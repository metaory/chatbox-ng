import { ApiError, BaseError, NetworkError, OCRError } from '@shared/models/errors'
import { findMessageContext, findMessageSourceThread } from '@shared/session/message-forks'
import type { CompactionPoint, Message, Session, SessionSettings, SessionType, Settings } from '@shared/types'
import { ModelProviderEnum } from '@shared/types'
import { identity, pickBy } from 'lodash'
import { getModelDisplayName } from '@/packages/model-setting-utils'
import { uiStore } from '../uiStore'

/**
 * Get session-level web browsing setting
 * Returns user's explicit setting if set, otherwise returns default based on provider
 */
export function getSessionWebBrowsing(sessionId: string, provider: string | undefined): boolean {
  const sessionValue = uiStore.getState().sessionWebBrowsingMap[sessionId]
  if (sessionValue !== undefined) {
    return sessionValue
  }
  // Default: true for ChatboxAI, false for others
  return provider === ModelProviderEnum.ChatboxAI
}

/**
 * Find target message index in session messages or threads
 * @returns Object with messages array and index, or null if not found
 */
export function findTargetMessageIndex(
  session: Session,
  targetMsgId: string
): { messages: Message[]; index: number } | null {
  const location = findMessageContext(session, targetMsgId)
  return location && location.index > 0 ? { messages: location.list, index: location.index } : null
}

/**
 * Compaction points applicable to a target message's conversation: thread
 * points when the message lives in an archived thread (retry from history),
 * session points otherwise. Points are stored next to their message list
 * (see buildCompactionCommitPatch / thread archive flows).
 */
export function getCompactionPointsForTarget(session: Session, targetMsgId: string): CompactionPoint[] | undefined {
  const sourceThread = findMessageSourceThread(session, targetMsgId)
  return sourceThread ? sourceThread.compactionPoints : session.compactionPoints
}

/**
 * Initialize target message with generating state
 */
export async function initializeTargetMessage(
  targetMsg: Message,
  settings: SessionSettings,
  globalSettings: Settings,
  sessionType: SessionType | undefined
): Promise<Message> {
  return {
    ...targetMsg,
    cancel: undefined,
    aiProvider: settings.provider,
    model: await getModelDisplayName(settings, globalSettings, sessionType || 'chat'),
    generating: true,
    errorCode: undefined,
    error: undefined,
    errorExtra: undefined,
    status: [],
    firstTokenLatency: undefined,
    isStreamingMode: settings.stream !== false,
  }
}

/**
 * Handle generation error and return updated message with error info
 */
export function handleGenerationError(err: unknown, targetMsg: Message, settings: SessionSettings): Message {
  const error = !(err instanceof Error) ? new Error(`${err}`) : err
  let errorCode: number | undefined
  if (err instanceof BaseError) {
    errorCode = err.code
  }

  const ocrError = error instanceof OCRError ? error : undefined
  const causeError = ocrError?.cause

  return {
    ...targetMsg,
    generating: false,
    cancel: undefined,
    errorCode,
    error: `${error.message}`,
    errorExtra: pickBy(
      {
        aiProvider: ocrError ? ocrError.ocrProvider : settings.provider,
        causeErrorCode: causeError instanceof BaseError ? causeError.code : undefined,
        host:
          error instanceof NetworkError ? error.host : causeError instanceof NetworkError ? causeError.host : undefined,
        responseBody:
          error instanceof ApiError
            ? error.responseBody
            : causeError instanceof ApiError
              ? causeError.responseBody
              : undefined,
        httpStatusCode:
          error instanceof ApiError
            ? error.statusCode
            : causeError instanceof ApiError
              ? causeError.statusCode
              : undefined,
        requestId:
          error instanceof BaseError
            ? error.requestId
            : causeError instanceof BaseError
              ? causeError.requestId
              : undefined,
      },
      identity
    ),
    status: [],
  }
}

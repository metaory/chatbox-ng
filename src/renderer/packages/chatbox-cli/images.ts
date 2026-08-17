import type { ImageGeneration } from '@shared/types'
import { requestAppActionApproval } from '@/packages/app-action-approval'
import { getAvailableImageModels } from '@/packages/image-model-catalog'
import platform from '@/platform'
import storage from '@/storage'
import { startImageGeneration } from '@/stores/imageGenerationActions'
import { imageGenerationStore } from '@/stores/imageGenerationStore'
import { settingsStore } from '@/stores/settingsStore'
import { queueImageTaskCompletion, queueImageTaskCompletionError } from './image-task-follow-up'
import { ChatboxCliUsageError, integerFlag, stringFlag } from './parser'
import type { ChatboxCliCommandContext, ChatboxCliCommandDefinition } from './types'

const MAX_REFERENCE_LENGTH = 1_000
const IMAGE_EXECUTION_STORAGE_PREFIX = 'chatbox-cli:image-generation-execution'
const executionCache = new Map<string, { signature: string; promise: Promise<Record<string, unknown>> }>()

interface PersistedImageExecution {
  version: 1
  signature: string
  recordId: string
  startedAt: number
}

interface ImageExecutionSignature {
  provider: string
  modelId: string
}

function imageExecutionStorageKey(sessionId: string, toolCallId: string): string {
  return `${IMAGE_EXECUTION_STORAGE_PREFIX}:${sessionId}:${toolCallId}`
}

function isPersistedImageExecution(value: unknown): value is PersistedImageExecution {
  if (!value || typeof value !== 'object') return false
  const record = value as Record<string, unknown>
  return (
    record.version === 1 &&
    typeof record.signature === 'string' &&
    typeof record.recordId === 'string' &&
    typeof record.startedAt === 'number'
  )
}

function parseImageExecutionSignature(signature: string): ImageExecutionSignature | undefined {
  try {
    const value = JSON.parse(signature) as Record<string, unknown>
    if (typeof value.provider !== 'string' || typeof value.modelId !== 'string') return undefined
    return { provider: value.provider, modelId: value.modelId }
  } catch {
    return undefined
  }
}

function compactReference(reference: string): string {
  if (reference.startsWith('data:')) return '[inline image omitted]'
  if (reference.length <= MAX_REFERENCE_LENGTH) return reference
  return `${reference.slice(0, MAX_REFERENCE_LENGTH - 1)}…`
}

function compactRecord(record: ImageGeneration): Record<string, unknown> {
  const waitingForCompletion = record.status === 'pending' || record.status === 'generating'
  const hasActiveRunner = imageGenerationStore.getState().currentGeneratingId === record.id
  return {
    id: record.id,
    status: record.status,
    prompt: record.prompt.slice(0, 500),
    model: record.model,
    aspectRatio: record.aspectRatio,
    imageGenerateNum: record.imageGenerateNum ?? 1,
    createdAt: record.createdAt,
    generatedImages: record.generatedImages.slice(0, 4).map(compactReference),
    generatedImageThumbnails: record.generatedImageThumbnails?.slice(0, 4).map(compactReference),
    error: record.error?.slice(0, 1_000),
    taskId: record.taskId,
    ...(waitingForCompletion
      ? {
          wait: hasActiveRunner
            ? {
                mode: 'callback',
                managedBy: 'chatbox',
                modelShouldPoll: false,
              }
            : {
                mode: record.taskId ? 'manual_resume' : 'manual_retry',
                managedBy: 'chatbox',
                modelShouldPoll: false,
                ...(record.taskId ? { location: 'original chat or Image Creator' } : { requiresNewApproval: true }),
              },
        }
      : {}),
  }
}

function restoredExecutionResult(record: ImageGeneration): Record<string, unknown> {
  const waitingForCompletion = record.status === 'pending' || record.status === 'generating'
  const hasActiveRunner = imageGenerationStore.getState().currentGeneratingId === record.id

  if (waitingForCompletion && hasActiveRunner) {
    return {
      accepted: true,
      background: true,
      restored: true,
      recordId: record.id,
      status: 'pending',
      recordStatus: record.status,
      startedAt: record.createdAt,
      model: record.model,
      wait: {
        mode: 'callback',
        managedBy: 'chatbox',
        modelShouldPoll: false,
      },
      message: 'This image request is already running. End this turn and wait for the existing Chatbox callback.',
    }
  }

  return {
    restored: true,
    recordId: record.id,
    ...compactRecord(record),
    message: waitingForCompletion
      ? record.taskId
        ? 'This image request was already submitted. Do not submit it again or poll it; resume it from the original chat or Image Creator.'
        : 'This image generation was interrupted without a resumable task id. Do not submit it again without new user approval.'
      : 'This tool call is already linked to the returned image record and was not submitted again.',
  }
}

function cacheExecution(
  key: string,
  signature: string,
  create: () => Promise<Record<string, unknown>>
): Promise<Record<string, unknown>> {
  const existing = executionCache.get(key)
  if (existing) {
    if (existing.signature !== signature) {
      return Promise.reject(new Error(`Tool call ${key} was reused with different image arguments.`))
    }
    return existing.promise
  }
  const promise = create()
  executionCache.set(key, { signature, promise })
  void promise.catch(() => {
    if (executionCache.get(key)?.promise === promise) executionCache.delete(key)
  })
  if (executionCache.size > 100) {
    const oldest = executionCache.keys().next().value
    if (typeof oldest === 'string') executionCache.delete(oldest)
  }
  return promise
}

async function generateImage(context: ChatboxCliCommandContext): Promise<Record<string, unknown>> {
  if (!context.sessionId) throw new ChatboxCliUsageError('Image generation requires an active chat session.')
  if (!context.toolCallId) throw new ChatboxCliUsageError('Image generation requires a tool call id.')
  const sessionId = context.sessionId
  const toolCallId = context.toolCallId
  const requestedPrompt = stringFlag(context.parsed, 'prompt') ?? context.parsed.positionals.join(' ').trim()
  if (!requestedPrompt) throw new ChatboxCliUsageError('Missing --prompt.')
  if (requestedPrompt.length > 8_000) throw new ChatboxCliUsageError('Prompt must be at most 8000 characters.')

  const requestedProvider = stringFlag(context.parsed, 'provider')
  const requestedModelId = stringFlag(context.parsed, 'model')
  const requestedCount = integerFlag(context.parsed, 'count', { defaultValue: 1, min: 1, max: 4 })
  const requestedAspectRatio = stringFlag(context.parsed, 'aspect-ratio')
  const requestedStyle = stringFlag(context.parsed, 'style')
  if (requestedStyle && requestedStyle !== 'vivid' && requestedStyle !== 'natural') {
    throw new ChatboxCliUsageError('--style must be vivid or natural.')
  }
  const parsedStyle: 'vivid' | 'natural' | undefined =
    requestedStyle === 'vivid' || requestedStyle === 'natural' ? requestedStyle : undefined
  const approvedRequest =
    context.approved && context.approvalDetails?.type === 'image_generation' ? context.approvalDetails : undefined
  if (
    approvedRequest &&
    (approvedRequest.prompt !== requestedPrompt ||
      approvedRequest.count !== requestedCount ||
      approvedRequest.aspectRatio !== requestedAspectRatio ||
      approvedRequest.style !== parsedStyle ||
      (requestedProvider !== undefined && approvedRequest.provider !== requestedProvider) ||
      (requestedModelId !== undefined && approvedRequest.modelId !== requestedModelId))
  ) {
    throw new Error('The image request changed after approval. Ask the user to review it again.')
  }

  const prompt = approvedRequest?.prompt ?? requestedPrompt
  const count = approvedRequest?.count ?? requestedCount
  const aspectRatio = approvedRequest?.aspectRatio ?? requestedAspectRatio
  const dalleStyle = approvedRequest?.style ?? parsedStyle

  const cacheKey = `${sessionId}:${toolCallId}`
  const persistedExecutionKey = imageExecutionStorageKey(sessionId, toolCallId)
  const existing = executionCache.get(cacheKey)
  const persistedExecutionValue = existing ? null : await storage.getItem<unknown>(persistedExecutionKey, null)
  if (persistedExecutionValue !== null && !isPersistedImageExecution(persistedExecutionValue)) {
    throw new Error(`Stored image execution metadata is invalid for tool call ${cacheKey}.`)
  }
  const boundSignature = existing?.signature ?? persistedExecutionValue?.signature
  const boundRequest = boundSignature ? parseImageExecutionSignature(boundSignature) : undefined
  if (boundSignature && !boundRequest) {
    throw new Error(`Stored image execution signature is invalid for tool call ${cacheKey}.`)
  }

  const settings = settingsStore.getState()
  let availableModels: Awaited<ReturnType<typeof getAvailableImageModels>> | undefined
  let provider = approvedRequest?.provider ?? requestedProvider ?? boundRequest?.provider
  let modelId = approvedRequest?.modelId ?? requestedModelId ?? boundRequest?.modelId
  if (!provider || !modelId) {
    availableModels = await getAvailableImageModels(settings)
    const selected = provider
      ? availableModels.find((model) => model.provider === provider)
      : modelId
        ? availableModels.find((model) => model.modelId === modelId)
        : availableModels[0]
    provider ??= selected?.provider
    modelId ??= selected?.modelId
  }
  if (!provider) throw new ChatboxCliUsageError('Missing --provider.')
  if (!modelId) throw new ChatboxCliUsageError('Missing --model.')
  const signature = JSON.stringify({ prompt, provider, modelId, count, aspectRatio, dalleStyle })
  if (existing) {
    if (existing.signature !== signature) {
      throw new Error(`Tool call ${cacheKey} was reused with different image arguments.`)
    }
    return existing.promise
  }

  if (persistedExecutionValue !== null) {
    if (persistedExecutionValue.signature !== signature) {
      throw new Error(`Tool call ${cacheKey} was reused with different image arguments.`)
    }
    const persistedRecord = await platform.getImageGenerationStorage().getById(persistedExecutionValue.recordId)
    if (!persistedRecord) {
      throw new Error(
        'The image record linked to this approved tool call no longer exists. Start a new request and ask the user to approve it again.'
      )
    }
    return restoredExecutionResult(persistedRecord)
  }

  if (settings.providers?.[provider]?.excludedModels?.includes(modelId)) {
    throw new ChatboxCliUsageError(`Image model is disabled in settings: ${provider}/${modelId}`)
  }
  availableModels ??= await getAvailableImageModels(settings)
  if (!availableModels.some((model) => model.provider === provider && model.modelId === modelId)) {
    throw new ChatboxCliUsageError(
      `Image model is not available: ${provider}/${modelId}. Use "chatbox image models" to list available models.`
    )
  }

  if (!approvedRequest) {
    await requestAppActionApproval(
      toolCallId,
      'image.generate',
      'Generate image',
      [
        `Provider: ${JSON.stringify(provider)}`,
        `Model: ${JSON.stringify(modelId)}`,
        `Images: ${count}`,
        ...(aspectRatio ? [`Aspect ratio: ${JSON.stringify(aspectRatio)}`] : []),
        ...(dalleStyle ? [`Style: ${JSON.stringify(dalleStyle)}`] : []),
        `Prompt: ${JSON.stringify(prompt)}`,
      ].join('\n'),
      {
        type: 'image_generation',
        provider,
        modelId,
        prompt,
        count,
        aspectRatio,
        style: dalleStyle,
        billing: 'provider',
      }
    )
    throw new Error('Image generation cannot start without matching structured approval details.')
  }

  if (context.abortSignal?.aborted) throw new DOMException('Aborted', 'AbortError')

  return cacheExecution(cacheKey, signature, async () => {
    const handle = await startImageGeneration(
      {
        prompt,
        referenceImages: [],
        model: { provider, modelId },
        imageGenerateNum: count,
        aspectRatio,
        dalleStyle,
        source: {
          type: 'chatbox_cli',
          sessionId,
          toolCallId,
        },
      },
      {
        onRecordCreated: async (record) => {
          await storage.setItemNow<PersistedImageExecution>(persistedExecutionKey, {
            version: 1,
            signature,
            recordId: record.id,
            startedAt: record.createdAt,
          })
        },
      }
    )

    void handle.completion
      .then((record) => {
        if (record) queueImageTaskCompletion(record, { sessionId, toolCallId }, handle.startedAt)
      })
      .catch((error: unknown) => {
        queueImageTaskCompletionError(handle.recordId, handle.startedAt, { sessionId, toolCallId }, error)
      })

    return {
      accepted: true,
      background: true,
      recordId: handle.recordId,
      status: 'pending',
      startedAt: handle.startedAt,
      model: { provider, modelId },
      wait: {
        mode: 'callback',
        managedBy: 'chatbox',
        modelShouldPoll: false,
      },
      message: 'Image generation is running in the background. End this turn and wait for Chatbox to call you back.',
    }
  })
}

export const imageCommands: ChatboxCliCommandDefinition[] = [
  {
    path: ['image', 'generate'],
    description: 'Request approval, then start a callback-driven image background task. Never poll for completion.',
    usage:
      'chatbox image generate --prompt <text> [--provider <id>] [--model <id>] [--count 1] [--aspect-ratio <ratio>]',
    execute: generateImage,
  },
  {
    path: ['image', 'status'],
    description: 'Read an image generation record.',
    usage: 'chatbox image status <record-id>',
    async execute({ parsed }) {
      const recordId = parsed.positionals[0]
      if (!recordId) throw new ChatboxCliUsageError('Missing image generation record id.')
      const record = await platform.getImageGenerationStorage().getById(recordId)
      if (!record) throw new ChatboxCliUsageError(`Image generation record not found: ${recordId}`)
      return compactRecord(record)
    },
  },
  {
    path: ['image', 'history'],
    description: 'List recent image generation records.',
    usage: 'chatbox image history [--limit 10] [--cursor 0]',
    async execute({ parsed }) {
      const limit = integerFlag(parsed, 'limit', { defaultValue: 10, min: 1, max: 20 })
      const cursor = integerFlag(parsed, 'cursor', { defaultValue: 0, min: 0, max: 10_000_000 })
      const page = await platform.getImageGenerationStorage().getPage(cursor, limit)
      return {
        scope: 'global',
        items: page.items.map(compactRecord),
        nextCursor: page.nextCursor,
        total: page.total,
      }
    },
  },
  {
    path: ['image', 'models'],
    description: 'List configured image-capable models without exposing provider credentials.',
    usage: 'chatbox image models',
    async execute() {
      const models = await getAvailableImageModels()
      return {
        models,
        defaultModel: models[0] ?? null,
      }
    },
  },
]

export function resetImageCommandExecutionsForTests(): void {
  executionCache.clear()
}

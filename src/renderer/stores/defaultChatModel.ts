import { ModelProviderEnum, type Session } from '@shared/types'

export type DefaultChatModelSelection = {
  provider: string
  modelId: string
}

export const FALLBACK_CHAT_MODEL: DefaultChatModelSelection = {
  provider: ModelProviderEnum.OpenAI,
  modelId: 'gpt-4.1',
}

export function resolveFallbackChatModel(defaultChatModel?: {
  provider: string
  model: string
}): DefaultChatModelSelection {
  if (defaultChatModel?.provider && defaultChatModel.model) {
    return { provider: defaultChatModel.provider, modelId: defaultChatModel.model }
  }
  return FALLBACK_CHAT_MODEL
}

export function applyFallbackChatModelToSession<T extends Pick<Session, 'type' | 'settings'>>(
  session: T,
  defaultChatModel?: { provider: string; model: string }
): T {
  if (session.type !== 'chat' || (session.settings?.provider && session.settings?.modelId)) {
    return session
  }

  return {
    ...session,
    settings: {
      ...(session.settings || {}),
      ...resolveFallbackChatModel(defaultChatModel),
    },
  }
}

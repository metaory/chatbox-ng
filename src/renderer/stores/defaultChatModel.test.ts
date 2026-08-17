import { ModelProviderEnum } from '@shared/types'
import { describe, expect, it } from 'vitest'
import { applyFallbackChatModelToSession, FALLBACK_CHAT_MODEL, resolveFallbackChatModel } from './defaultChatModel'

describe('resolveFallbackChatModel', () => {
  it('uses OpenAI gpt-4.1 when no user default is set', () => {
    expect(resolveFallbackChatModel()).toEqual(FALLBACK_CHAT_MODEL)
    expect(FALLBACK_CHAT_MODEL).toEqual({
      provider: ModelProviderEnum.OpenAI,
      modelId: 'gpt-4.1',
    })
  })

  it('uses the user default chat model when set', () => {
    expect(resolveFallbackChatModel({ provider: ModelProviderEnum.Claude, model: 'claude-sonnet-4' })).toEqual({
      provider: ModelProviderEnum.Claude,
      modelId: 'claude-sonnet-4',
    })
  })
})

describe('applyFallbackChatModelToSession', () => {
  it('applies the OpenAI fallback to chat sessions without a selected model', () => {
    expect(
      applyFallbackChatModelToSession({
        type: 'chat',
        settings: { temperature: 0.7 },
      })
    ).toEqual({
      type: 'chat',
      settings: {
        temperature: 0.7,
        provider: ModelProviderEnum.OpenAI,
        modelId: 'gpt-4.1',
      },
    })
  })

  it('does not override an existing session model', () => {
    const session = {
      type: 'chat' as const,
      settings: {
        provider: ModelProviderEnum.OpenAI,
        modelId: 'gpt-4o',
      },
    }

    expect(applyFallbackChatModelToSession(session)).toBe(session)
  })

  it('does not apply chat defaults to picture sessions', () => {
    const session = {
      type: 'picture' as const,
      settings: undefined,
    }

    expect(applyFallbackChatModelToSession(session)).toBe(session)
  })
})

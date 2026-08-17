import { describe, expect, it } from 'vitest'
import { AppActionApprovalPausedError, requestAppActionApproval } from './app-action-approval'

describe('Chatbox app action approval', () => {
  it('throws a persistent pause with localized UI details', () => {
    const details = {
      type: 'image_generation' as const,
      provider: 'openai',
      modelId: 'gpt-image-1',
      prompt: 'A cat in watercolor',
      count: 1,
      billing: 'provider' as const,
    }

    try {
      void requestAppActionApproval('tool-app', 'image.generate', 'Generate image', 'A cat in watercolor', details)
      throw new Error('expected approval pause')
    } catch (error) {
      expect(error).toBeInstanceOf(AppActionApprovalPausedError)
      expect(error).toMatchObject({
        toolCallId: 'tool-app',
        action: 'image.generate',
        details,
      })
    }
  })
})

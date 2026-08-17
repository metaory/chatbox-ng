import { beforeEach, describe, expect, it, vi } from 'vitest'

const {
  getAvailableImageModelsMock,
  getImageGenerationByIdMock,
  getImageGenerationPageMock,
  queueBackgroundTaskNotificationMock,
  requestAppActionApprovalMock,
  executionStorage,
  getStorageItemMock,
  setStorageItemNowMock,
  startImageGenerationMock,
} = vi.hoisted(() => ({
  getAvailableImageModelsMock: vi.fn(),
  getImageGenerationByIdMock: vi.fn(),
  getImageGenerationPageMock: vi.fn(),
  queueBackgroundTaskNotificationMock: vi.fn(),
  requestAppActionApprovalMock: vi.fn(),
  executionStorage: new Map<string, unknown>(),
  getStorageItemMock: vi.fn(),
  setStorageItemNowMock: vi.fn(),
  startImageGenerationMock: vi.fn(),
}))

vi.mock('@/packages/app-action-approval', () => ({ requestAppActionApproval: requestAppActionApprovalMock }))
vi.mock('@/packages/image-model-catalog', () => ({
  getAvailableImageModels: getAvailableImageModelsMock,
}))
vi.mock('@/platform', () => ({
  default: {
    getImageGenerationStorage: () => ({
      getById: getImageGenerationByIdMock,
      getPage: getImageGenerationPageMock,
    }),
  },
}))
vi.mock('@/stores/imageGenerationActions', () => ({ startImageGeneration: startImageGenerationMock }))
vi.mock('@/stores/imageGenerationStore', () => ({
  imageGenerationStore: { getState: () => ({ currentGeneratingId: null }) },
}))
vi.mock('@/stores/settingsStore', () => ({
  settingsStore: {
    getState: () => ({
      providers: {},
    }),
  },
}))
vi.mock('@/storage', () => ({
  default: {
    getItem: getStorageItemMock,
    setItemNow: setStorageItemNowMock,
  },
}))
vi.mock('./background-follow-up', () => ({
  queueBackgroundTaskNotification: queueBackgroundTaskNotificationMock,
}))

import type { ImageGeneration } from '@shared/types'
import { imageCommands, resetImageCommandExecutionsForTests } from './images'
import { parseArguments } from './parser'
import type { ChatboxCliCommandContext, ChatboxCliToolContext } from './types'

function command(name: string) {
  const result = imageCommands.find((candidate) => candidate.path[1] === name)
  if (!result) throw new Error(`Missing image command: ${name}`)
  return result
}

function context(argv: string[], options: ChatboxCliToolContext = {}): ChatboxCliCommandContext {
  return {
    argv,
    parsed: parseArguments(argv),
    displayCommand: `chatbox image ${argv.join(' ')}`,
    sessionId: 'session-1',
    toolCallId: options.toolCallId ?? 'tool-1',
    approved: options.approved ?? true,
    approvalDetails: options.approvalDetails,
  }
}

describe('Chatbox CLI image commands', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetImageCommandExecutionsForTests()
    executionStorage.clear()
    getStorageItemMock.mockImplementation(async (key: string, initialValue: unknown) =>
      executionStorage.has(key) ? executionStorage.get(key) : initialValue
    )
    setStorageItemNowMock.mockImplementation((key: string, value: unknown) => {
      executionStorage.set(key, value)
      return Promise.resolve()
    })
    getAvailableImageModelsMock.mockResolvedValue([
      { provider: 'openai', modelId: 'manifest-image', nickname: 'Manifest Image' },
    ])
  })

  it('selects the first available catalog model and anchors the completion follow-up', async () => {
    const approvalDetails = {
      type: 'image_generation' as const,
      provider: 'openai',
      modelId: 'manifest-image',
      prompt: 'red fox',
      count: 1,
      billing: 'provider' as const,
    }
    startImageGenerationMock.mockResolvedValue({
      recordId: 'record-1',
      startedAt: 1_000,
      monitoring: { mode: 'direct' },
      completion: Promise.resolve({
        id: 'record-1',
        status: 'done',
        generatedImages: ['storage://image-1'],
      }),
    })

    await expect(
      command('generate').execute(context(['--prompt', 'red fox'], { approvalDetails }))
    ).resolves.toMatchObject({
      accepted: true,
      background: true,
      recordId: 'record-1',
      startedAt: 1_000,
      wait: {
        mode: 'callback',
        managedBy: 'chatbox',
        modelShouldPoll: false,
      },
    })
    await Promise.resolve()

    expect(startImageGenerationMock).toHaveBeenCalledWith(
      expect.objectContaining({ model: { provider: 'openai', modelId: 'manifest-image' } }),
      expect.objectContaining({ onRecordCreated: expect.any(Function) })
    )
    expect(queueBackgroundTaskNotificationMock).toHaveBeenCalledWith(
      'session-1',
      'tool-1',
      expect.objectContaining({
        recordId: 'record-1',
        status: 'completed',
        startedAt: 1_000,
        elapsedMs: expect.any(Number),
      })
    )
  })

  it('requires a tool-call anchor', async () => {
    await expect(command('generate').execute(context(['--prompt', 'red fox'], { toolCallId: '' }))).rejects.toThrow(
      'requires a tool call id'
    )
    expect(startImageGenerationMock).not.toHaveBeenCalled()
  })

  it('rejects explicit models outside the configured image catalog', async () => {
    await expect(
      command('generate').execute(context(['--prompt', 'red fox', '--provider', 'openai', '--model', 'gpt-4o']))
    ).rejects.toThrow('Image model is not available')
    expect(startImageGenerationMock).not.toHaveBeenCalled()
  })

  it('requests structured approval with provider billing', async () => {
    const pause = new Error('approval required')
    requestAppActionApprovalMock.mockRejectedValueOnce(pause)

    await expect(
      command('generate').execute(
        context(['--prompt', 'red fox\nProvider: spoof', '--style', 'vivid'], { approved: false })
      )
    ).rejects.toBe(pause)
    expect(requestAppActionApprovalMock).toHaveBeenCalledWith(
      'tool-1',
      'image.generate',
      'Generate image',
      expect.stringContaining('Prompt: "red fox\\nProvider: spoof"'),
      expect.objectContaining({
        type: 'image_generation',
        provider: 'openai',
        modelId: 'manifest-image',
        prompt: 'red fox\nProvider: spoof',
        count: 1,
        style: 'vivid',
        billing: 'provider',
      })
    )
    expect(startImageGenerationMock).not.toHaveBeenCalled()
  })

  it('does not trust an approved flag without matching structured approval details', async () => {
    const pause = new Error('approval required')
    requestAppActionApprovalMock.mockRejectedValueOnce(pause)

    await expect(command('generate').execute(context(['--prompt', 'red fox'], { approved: true }))).rejects.toBe(pause)
    expect(requestAppActionApprovalMock).toHaveBeenCalledWith(
      'tool-1',
      'image.generate',
      'Generate image',
      expect.stringContaining('Prompt: "red fox"'),
      expect.objectContaining({
        type: 'image_generation',
        provider: 'openai',
        modelId: 'manifest-image',
        prompt: 'red fox',
      })
    )
    expect(startImageGenerationMock).not.toHaveBeenCalled()
  })

  it('shows the complete prompt in the approval request', async () => {
    const pause = new Error('approval required')
    const prompt = `${'a'.repeat(600)} hidden tail`
    requestAppActionApprovalMock.mockRejectedValueOnce(pause)

    await expect(command('generate').execute(context(['--prompt', prompt], { approved: false }))).rejects.toBe(pause)
    expect(requestAppActionApprovalMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(String),
      expect.any(String),
      expect.stringContaining('hidden tail'),
      expect.objectContaining({ prompt })
    )
  })

  it('executes the exact model persisted in the approved request when catalog order changes', async () => {
    const pause = new Error('approval required')
    requestAppActionApprovalMock.mockRejectedValueOnce(pause)
    getAvailableImageModelsMock.mockResolvedValueOnce([
      { provider: 'openai', modelId: 'reviewed-model', nickname: 'Reviewed Model' },
      { provider: 'openai', modelId: 'new-default', nickname: 'New Default' },
    ])

    await expect(command('generate').execute(context(['--prompt', 'red fox'], { approved: false }))).rejects.toBe(pause)
    const approvalDetails = requestAppActionApprovalMock.mock.calls[0]?.[4]
    expect(approvalDetails).toMatchObject({ provider: 'openai', modelId: 'reviewed-model' })

    getAvailableImageModelsMock.mockResolvedValueOnce([
      { provider: 'openai', modelId: 'new-default', nickname: 'New Default' },
      { provider: 'openai', modelId: 'reviewed-model', nickname: 'Reviewed Model' },
    ])
    startImageGenerationMock.mockResolvedValueOnce({
      recordId: 'record-reviewed',
      startedAt: 1_000,
      monitoring: { mode: 'direct' },
      completion: Promise.resolve(null),
    })

    await command('generate').execute(context(['--prompt', 'red fox'], { approved: true, approvalDetails }))

    expect(startImageGenerationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        model: { provider: 'openai', modelId: 'reviewed-model' },
        source: {
          type: 'chatbox_cli',
          sessionId: 'session-1',
          toolCallId: 'tool-1',
        },
      }),
      expect.objectContaining({ onRecordCreated: expect.any(Function) })
    )
  })

  it('reuses the durable image record after the in-memory execution cache is lost', async () => {
    const approvalDetails = {
      type: 'image_generation' as const,
      provider: 'openai',
      modelId: 'manifest-image',
      prompt: 'red fox',
      count: 1,
      billing: 'provider' as const,
    }
    const createdRecord: ImageGeneration = {
      id: 'record-persisted',
      prompt: 'red fox',
      referenceImages: [],
      generatedImages: [],
      createdAt: 1_000,
      model: { provider: 'openai', modelId: 'manifest-image' },
      imageGenerateNum: 1,
      status: 'generating',
      taskId: 'task-persisted',
    }
    startImageGenerationMock.mockImplementationOnce(
      async (_params: unknown, options: { onRecordCreated?: (record: ImageGeneration) => Promise<void> }) => {
        await options.onRecordCreated?.(createdRecord)
        return {
          recordId: createdRecord.id,
          startedAt: createdRecord.createdAt,
          monitoring: { mode: 'direct' },
          completion: Promise.resolve(null),
        }
      }
    )

    await command('generate').execute(context(['--prompt', 'red fox'], { approvalDetails }))
    expect(setStorageItemNowMock).toHaveBeenCalledOnce()

    resetImageCommandExecutionsForTests()
    const catalogCallsBeforeRestore = getAvailableImageModelsMock.mock.calls.length
    getAvailableImageModelsMock.mockRejectedValue(new Error('catalog unavailable'))
    getImageGenerationByIdMock.mockResolvedValueOnce(createdRecord)

    await expect(command('generate').execute(context(['--prompt', 'red fox']))).resolves.toMatchObject({
      restored: true,
      recordId: 'record-persisted',
      status: 'generating',
      wait: {
        mode: 'manual_resume',
        managedBy: 'chatbox',
        modelShouldPoll: false,
      },
    })
    expect(startImageGenerationMock).toHaveBeenCalledTimes(1)
    expect(getAvailableImageModelsMock).toHaveBeenCalledTimes(catalogCallsBeforeRestore)
  })

  it('uses the shared image model catalog for model discovery', async () => {
    getAvailableImageModelsMock.mockResolvedValueOnce([
      { provider: 'openai', modelId: 'server-default', nickname: 'Server Default' },
      { provider: 'openai', modelId: 'gpt-image-1.5', nickname: 'GPT Image 1.5' },
    ])

    await expect(command('models').execute(context([]))).resolves.toEqual({
      models: [
        { provider: 'openai', modelId: 'server-default', nickname: 'Server Default' },
        { provider: 'openai', modelId: 'gpt-image-1.5', nickname: 'GPT Image 1.5' },
      ],
      defaultModel: { provider: 'openai', modelId: 'server-default', nickname: 'Server Default' },
    })
    expect(getAvailableImageModelsMock).toHaveBeenCalledOnce()
  })

  it('marks an orphaned pending task for manual recovery instead of promising a callback', async () => {
    getImageGenerationByIdMock.mockResolvedValue({
      id: 'record-1',
      status: 'generating',
      createdAt: 1_000,
      prompt: 'red fox',
      referenceImages: [],
      generatedImages: [],
      model: { provider: 'openai', modelId: 'manifest-image' },
      taskId: 'task-1',
    })

    await expect(command('status').execute(context(['record-1']))).resolves.toMatchObject({
      id: 'record-1',
      status: 'generating',
      wait: {
        mode: 'manual_resume',
        managedBy: 'chatbox',
        modelShouldPoll: false,
        location: 'original chat or Image Creator',
      },
    })
  })

  it('requires a newly approved retry when an interrupted record has no resumable task id', async () => {
    getImageGenerationByIdMock.mockResolvedValue({
      id: 'record-direct',
      status: 'generating',
      createdAt: 1_000,
      prompt: 'red fox',
      referenceImages: [],
      generatedImages: [],
      model: { provider: 'openai', modelId: 'gpt-image-1' },
    })

    await expect(command('status').execute(context(['record-direct']))).resolves.toMatchObject({
      id: 'record-direct',
      status: 'generating',
      wait: {
        mode: 'manual_retry',
        managedBy: 'chatbox',
        modelShouldPoll: false,
        requiresNewApproval: true,
      },
    })
  })

  it('labels image history as device-wide', async () => {
    getImageGenerationPageMock.mockResolvedValue({ items: [], nextCursor: null, total: 0 })

    await expect(command('history').execute(context([]))).resolves.toEqual({
      scope: 'global',
      items: [],
      nextCursor: null,
      total: 0,
    })
  })
})

import { beforeEach, describe, expect, it, vi } from 'vitest'

const submitImageGenerationMock = vi.fn()
const pollTaskUntilCompleteMock = vi.fn()
const pollImageTaskMock = vi.fn()
const createRecordMock = vi.fn()
const updateRecordMock = vi.fn()
const getImageGenerationByIdMock = vi.fn()
const setQueryDataMock = vi.fn()
const invalidateQueriesMock = vi.fn()
const getImageMock = vi.fn()
const setCurrentGeneratingIdMock = vi.fn()
const setCurrentRecordIdMock = vi.fn()

vi.mock('@/adapters', () => ({
  createModelDependencies: vi.fn(async () => ({
    storage: {
      getImage: getImageMock,
    },
  })),
}))

vi.mock('@/packages/remote', () => ({
  IMAGE_GENERATION_POLL_INTERVAL_MS: 2000,
  submitImageGeneration: submitImageGenerationMock,
  pollTaskUntilComplete: pollTaskUntilCompleteMock,
  pollImageTask: pollImageTaskMock,
}))

vi.mock('./imageGenerationStore', () => ({
  IMAGE_GEN_LIST_QUERY_KEY: 'image-gen-list',
  IMAGE_GEN_QUERY_KEY: 'image-gen',
  createRecord: createRecordMock,
  updateRecord: updateRecordMock,
  addGeneratedImage: vi.fn(),
  imageGenerationStore: {
    getState: () => ({
      currentGeneratingId: null,
      currentRecordId: null,
      setCurrentGeneratingId: setCurrentGeneratingIdMock,
      setCurrentRecordId: setCurrentRecordIdMock,
    }),
  },
}))

vi.mock('./queryClient', () => ({
  queryClient: {
    setQueryData: setQueryDataMock,
    invalidateQueries: invalidateQueriesMock,
  },
}))

vi.mock('./settingsStore', () => ({
  settingsStore: {
    getState: () => ({
      licenseKey: 'license-key',
    }),
  },
}))

vi.mock('@/lib/utils', () => ({
  getLogger: () => ({
    debug: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  }),
}))

vi.mock('@/platform', () => ({
  default: {
    getImageGenerationStorage: () => ({
      getById: getImageGenerationByIdMock,
    }),
  },
}))

vi.mock('@/storage', () => ({
  default: {},
}))

vi.mock('@/storage/StoreStorage', () => ({
  StorageKeyGenerator: {},
}))

describe('imageGenerationActions reference image payload', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    createRecordMock.mockResolvedValue({ id: 'record-1', createdAt: 1_000 })
    updateRecordMock.mockImplementation(async (id: string, patch: Record<string, unknown>) => ({ id, ...patch }))
    submitImageGenerationMock.mockResolvedValue({
      task_id: 'task-1',
      items: [{ status: 'pending' }],
    })
    pollTaskUntilCompleteMock.mockResolvedValue({
      items: [
        {
          status: 'completed',
          image_url: 'https://example.com/output.png',
          thumbnail_url: 'https://example.com/output.png?thumbnail=512x512',
        },
      ],
    })
    getImageMock.mockResolvedValue('data:image/png;base64,AAAA')
    getImageGenerationByIdMock.mockResolvedValue({
      id: 'record-1',
      prompt: 'make an image',
      referenceImages: [],
      generatedImages: [],
      createdAt: 1_000,
      model: { provider: 'chatbox-ai', modelId: 'gpt-image-1' },
      imageGenerateNum: 1,
      status: 'generating',
      taskId: 'task-1',
      source: {
        type: 'chatbox_cli',
        sessionId: 'session-1',
        toolCallId: 'tool-1',
      },
    })
  })

  it('sends reference images as image_url entries for both URLs and stored images', async () => {
    const { createAndGenerate } = await import('./imageGenerationActions')

    await createAndGenerate({
      prompt: 'make a variation',
      referenceImages: ['https://example.com/reference.png', 'storage-key-1'],
      model: {
        provider: 'chatbox-ai',
        modelId: 'gpt-image-1',
      },
      imageGenerateNum: 1,
    })

    await vi.waitFor(() => {
      expect(submitImageGenerationMock).toHaveBeenCalledTimes(1)
    })

    expect(submitImageGenerationMock).toHaveBeenCalledWith(
      expect.objectContaining({
        images: [{ image_url: 'https://example.com/reference.png' }, { image_url: 'data:image/png;base64,AAAA' }],
      }),
      'license-key'
    )
  })

  it('exposes a completion promise for background task consumers', async () => {
    const { startImageGeneration } = await import('./imageGenerationActions')

    const handle = await startImageGeneration({
      prompt: 'make an image',
      referenceImages: [],
      model: {
        provider: 'chatbox-ai',
        modelId: 'gpt-image-1',
      },
      imageGenerateNum: 1,
    })

    expect(handle).toMatchObject({
      recordId: 'record-1',
      startedAt: 1_000,
      monitoring: { mode: 'polling', intervalMs: 2_000 },
    })

    await expect(handle.completion).resolves.toMatchObject({
      id: 'record-1',
      status: 'done',
      generatedImages: ['https://example.com/output.png'],
    })
  })

  it('persists caller retry metadata before starting the provider request', async () => {
    let releasePersistence: (() => void) | undefined
    const persistenceGate = new Promise<void>((resolve) => {
      releasePersistence = resolve
    })
    const onRecordCreated = vi.fn(async () => persistenceGate)
    const { startImageGeneration } = await import('./imageGenerationActions')

    const handlePromise = startImageGeneration(
      {
        prompt: 'make an image',
        referenceImages: [],
        model: {
          provider: 'chatbox-ai',
          modelId: 'gpt-image-1',
        },
      },
      { onRecordCreated }
    )

    await vi.waitFor(() => expect(onRecordCreated).toHaveBeenCalledOnce())
    expect(submitImageGenerationMock).not.toHaveBeenCalled()

    releasePersistence?.()
    await handlePromise
    await vi.waitFor(() => expect(submitImageGenerationMock).toHaveBeenCalledOnce())
  })

  it('returns the terminal record when resuming an existing backend task', async () => {
    pollImageTaskMock.mockResolvedValueOnce({
      is_finished: true,
      items: [
        {
          status: 'completed',
          image_url: 'https://example.com/resumed.png',
          thumbnail_url: 'https://example.com/resumed-thumbnail.png',
        },
      ],
    })
    updateRecordMock.mockResolvedValueOnce({
      id: 'record-1',
      prompt: 'make an image',
      referenceImages: [],
      generatedImages: ['https://example.com/resumed.png'],
      generatedImageThumbnails: ['https://example.com/resumed-thumbnail.png'],
      createdAt: 1_000,
      model: { provider: 'chatbox-ai', modelId: 'gpt-image-1' },
      imageGenerateNum: 1,
      status: 'done',
      taskId: 'task-1',
      source: {
        type: 'chatbox_cli',
        sessionId: 'session-1',
        toolCallId: 'tool-1',
      },
    })

    const { resumeGeneration } = await import('./imageGenerationActions')

    await expect(resumeGeneration('record-1')).resolves.toMatchObject({
      id: 'record-1',
      status: 'done',
      source: {
        type: 'chatbox_cli',
        sessionId: 'session-1',
        toolCallId: 'tool-1',
      },
    })
  })

  it('stores structured error codes from Chatbox AI image generation failures', async () => {
    const { BaseError } = await import('@shared/models/errors')
    class StructuredImageGenerationError extends BaseError {
      public code = 20004
    }
    submitImageGenerationMock.mockRejectedValueOnce(new StructuredImageGenerationError('license not found'))

    const { createAndGenerate } = await import('./imageGenerationActions')

    await createAndGenerate({
      prompt: 'make an image',
      referenceImages: [],
      model: {
        provider: 'chatbox-ai',
        modelId: 'gpt-image-1',
      },
      imageGenerateNum: 1,
    })

    await vi.waitFor(() => {
      expect(updateRecordMock).toHaveBeenCalledWith(
        'record-1',
        expect.objectContaining({
          status: 'error',
          error: 'license not found',
          errorCode: 20004,
        })
      )
    })
  })

  it('stores thumbnail URLs separately from original image URLs', async () => {
    const { createAndGenerate } = await import('./imageGenerationActions')

    await createAndGenerate({
      prompt: 'make an image',
      referenceImages: [],
      model: {
        provider: 'chatbox-ai',
        modelId: 'gpt-image-1',
      },
      imageGenerateNum: 1,
    })

    await vi.waitFor(() => {
      expect(updateRecordMock).toHaveBeenCalledWith(
        'record-1',
        expect.objectContaining({
          generatedImages: ['https://example.com/output.png'],
          generatedImageThumbnails: ['https://example.com/output.png?thumbnail=512x512'],
          status: 'done',
        })
      )
    })
  })

  it('stores failed item error messages from async image generation results', async () => {
    pollTaskUntilCompleteMock.mockResolvedValueOnce({
      task_id: 'task-1',
      is_finished: true,
      items: [
        {
          uuid: 'item-1',
          status: 'failed',
          created_at: '2026-05-08T15:23:34.442+08:00',
          error_code: 'image_content_moderation_blocked',
          error_message: 'Content rejected by content moderation',
        },
      ],
    })

    const { createAndGenerate } = await import('./imageGenerationActions')

    await createAndGenerate({
      prompt: 'make an image',
      referenceImages: [],
      model: {
        provider: 'chatbox-ai',
        modelId: 'gpt-image-1',
      },
      imageGenerateNum: 1,
    })

    await vi.waitFor(() => {
      expect(updateRecordMock).toHaveBeenCalledWith(
        'record-1',
        expect.objectContaining({
          status: 'error',
          error: 'Content rejected by content moderation',
          errorCode: 'image_content_moderation_blocked',
          errorItemUuid: 'item-1',
        })
      )
    })
  })
})

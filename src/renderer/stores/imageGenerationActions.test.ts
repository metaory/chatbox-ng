import { beforeEach, describe, expect, it, vi } from 'vitest'

const paintMock = vi.fn()
const getModelMock = vi.fn(() => ({ paint: paintMock }))
const createRecordMock = vi.fn()
const updateRecordMock = vi.fn()
const getImageGenerationByIdMock = vi.fn()
const setQueryDataMock = vi.fn()
const invalidateQueriesMock = vi.fn()
const getImageMock = vi.fn()
const setCurrentGeneratingIdMock = vi.fn()
const setCurrentRecordIdMock = vi.fn()
const getConfigMock = vi.fn()

vi.mock('@/adapters', () => ({
  createModelDependencies: vi.fn(async () => ({
    storage: {
      getImage: getImageMock,
    },
  })),
}))

vi.mock('@shared/providers', () => ({
  getModel: getModelMock,
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
      getSettings: () => ({}),
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
    getConfig: getConfigMock,
  },
}))

vi.mock('@/storage', () => ({
  default: {},
}))

vi.mock('@/storage/StoreStorage', () => ({
  StorageKeyGenerator: {
    picture: (prefix: string) => `${prefix}-key`,
  },
}))

describe('imageGenerationActions provider path', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    createRecordMock.mockResolvedValue({ id: 'record-1', createdAt: 1_000 })
    updateRecordMock.mockImplementation(async (id: string, patch: Record<string, unknown>) => ({ id, ...patch }))
    paintMock.mockResolvedValue(['data:image/png;base64,AAAA'])
    getImageMock.mockResolvedValue('data:image/png;base64,AAAA')
    getConfigMock.mockResolvedValue({ uuid: 'config-uuid' })
    getImageGenerationByIdMock.mockResolvedValue({
      id: 'record-1',
      prompt: 'make an image',
      referenceImages: [],
      generatedImages: ['data:image/png;base64,AAAA'],
      createdAt: 1_000,
      model: { provider: 'openai', modelId: 'gpt-image-1' },
      imageGenerateNum: 1,
      status: 'generating',
      source: {
        type: 'chatbox_cli',
        sessionId: 'session-1',
        toolCallId: 'tool-1',
      },
    })
  })

  it('sends reference images as imageUrl entries for both URLs and stored images', async () => {
    const { createAndGenerate } = await import('./imageGenerationActions')

    await createAndGenerate({
      prompt: 'make a variation',
      referenceImages: ['https://example.com/reference.png', 'storage-key-1'],
      model: {
        provider: 'openai',
        modelId: 'gpt-image-1',
      },
      imageGenerateNum: 1,
    })

    await vi.waitFor(() => {
      expect(paintMock).toHaveBeenCalledTimes(1)
    })

    expect(paintMock).toHaveBeenCalledWith(
      expect.objectContaining({
        images: [{ imageUrl: 'https://example.com/reference.png' }, { imageUrl: 'data:image/png;base64,AAAA' }],
      }),
      expect.any(AbortSignal),
      expect.any(Function)
    )
  })

  it('exposes a completion promise for background task consumers', async () => {
    const { startImageGeneration } = await import('./imageGenerationActions')

    const handle = await startImageGeneration({
      prompt: 'make an image',
      referenceImages: [],
      model: {
        provider: 'openai',
        modelId: 'gpt-image-1',
      },
      imageGenerateNum: 1,
    })

    expect(handle).toMatchObject({
      recordId: 'record-1',
      startedAt: 1_000,
      monitoring: { mode: 'direct' },
    })

    await expect(handle.completion).resolves.toMatchObject({
      id: 'record-1',
      status: 'done',
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
          provider: 'openai',
          modelId: 'gpt-image-1',
        },
      },
      { onRecordCreated }
    )

    await vi.waitFor(() => expect(onRecordCreated).toHaveBeenCalledOnce())
    expect(paintMock).not.toHaveBeenCalled()

    releasePersistence?.()
    await handlePromise
    await vi.waitFor(() => expect(paintMock).toHaveBeenCalledOnce())
  })

  it('stores structured error codes from provider image generation failures', async () => {
    const { BaseError } = await import('@shared/models/errors')
    class StructuredImageGenerationError extends BaseError {
      public code = 20004
    }
    paintMock.mockRejectedValueOnce(new StructuredImageGenerationError('provider failed'))

    const { createAndGenerate } = await import('./imageGenerationActions')

    await createAndGenerate({
      prompt: 'make an image',
      referenceImages: [],
      model: {
        provider: 'openai',
        modelId: 'gpt-image-1',
      },
      imageGenerateNum: 1,
    })

    await vi.waitFor(() => {
      expect(updateRecordMock).toHaveBeenCalledWith(
        'record-1',
        expect.objectContaining({
          status: 'error',
          error: 'provider failed',
          errorCode: 20004,
        })
      )
    })
  })
})

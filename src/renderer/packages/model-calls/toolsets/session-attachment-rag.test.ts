import { beforeEach, describe, expect, test, vi } from 'vitest'

const queryMock = vi.fn()
const getAttachmentsMock = vi.fn()
const readParentsMock = vi.fn()
const getSettingsMock = vi.fn()

vi.mock('@/platform', () => ({
  default: {
    getSessionAttachmentRagController: () => ({
      getAttachments: getAttachmentsMock,
      query: queryMock,
      readParents: readParentsMock,
    }),
  },
}))

vi.mock('@/stores/settingsStore', () => ({
  settingsStore: {
    getState: getSettingsMock,
  },
}))

async function toModelOutput(tool: unknown, output: unknown) {
  const mapper = tool as {
    toModelOutput: (options: { toolCallId: string; input: unknown; output: unknown }) => Promise<unknown> | unknown
  }
  return await mapper.toModelOutput({ toolCallId: 'tool-call-id', input: {}, output })
}

describe('session attachment RAG toolset', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getAttachmentsMock.mockResolvedValue([
      {
        id: 1,
        filename: 'large.pdf',
        status: 'ready',
      },
    ])
    getSettingsMock.mockReturnValue({
      defaultRerankModel: {
        provider: 'cohere',
        model: 'rerank-v3.5',
      },
    })
    queryMock.mockResolvedValue([])
    readParentsMock.mockResolvedValue([])
  })

  test('uses default rerank model when configured', async () => {
    const { getToolSet } = await import('./session-attachment-rag')
    const toolset = await getToolSet([1])
    const executeQuery = toolset.tools.query_session_attachment.execute
    expect(executeQuery).toBeDefined()

    await executeQuery?.(
      { query: 'budget summary', limit: 3 },
      {
        toolCallId: 'call-1',
        messages: [],
      }
    )

    expect(queryMock).toHaveBeenCalledWith({
      attachmentIds: [1],
      query: 'budget summary',
      plan: {
        recallTopK: 20,
        finalTopK: 3,
        rerank: {
          enabled: true,
          model: 'cohere:rerank-v3.5',
        },
      },
    })
  })

  test('disables rerank when no default rerank model is set', async () => {
    getSettingsMock.mockReturnValue({ defaultRerankModel: undefined })

    const { getToolSet } = await import('./session-attachment-rag')
    const toolset = await getToolSet([1])
    const executeQuery = toolset.tools.query_session_attachment.execute
    expect(executeQuery).toBeDefined()

    await executeQuery?.(
      { query: 'budget summary' },
      {
        toolCallId: 'call-1',
        messages: [],
      }
    )

    expect(queryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        plan: expect.objectContaining({
          rerank: {
            enabled: false,
            model: undefined,
          },
        }),
      })
    )
  })

  test('query_session_attachment maps search results to readable model text', async () => {
    const { getToolSet } = await import('./session-attachment-rag')
    const toolset = await getToolSet([1])

    await expect(
      toModelOutput(toolset.tools.query_session_attachment, [
        {
          filename: 'large.pdf',
          sectionPath: 'Section 2',
          parentId: 42,
          score: 0.81234,
          text: 'Relevant attachment text.',
        },
      ])
    ).resolves.toEqual({
      type: 'text',
      value:
        'Result 1\nAttachment: large.pdf\nSection: Section 2\nParent ID: 42\nScore: 0.812\nText:\nRelevant attachment text.',
    })
  })

  test('read_session_attachment_parents maps parent blocks to readable model text', async () => {
    const { getToolSet } = await import('./session-attachment-rag')
    const toolset = await getToolSet([1])

    await expect(
      toModelOutput(toolset.tools.read_session_attachment_parents, [
        {
          filename: 'large.pdf',
          sectionPath: 'Appendix',
          pageStart: 10,
          pageEnd: 12,
          text: 'Larger parent block.',
        },
      ])
    ).resolves.toEqual({
      type: 'text',
      value: 'Parent block 1\nAttachment: large.pdf\nSection: Appendix\nPages: 10-12\nText:\nLarger parent block.',
    })
  })
})

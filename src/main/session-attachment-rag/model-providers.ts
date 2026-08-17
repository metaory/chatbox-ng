import type { EmbeddingModel } from 'ai'
import { CohereClient } from 'cohere-ai'
import { getProviderSettings } from '../../shared/models'
import { getChatboxAPIOrigin } from '../../shared/request/chatboxai_pool'
import { parseKnowledgeBaseModelString } from '../../shared/utils/knowledge-base-model-parser'
import { cache } from '../cache'
import { createEmbeddingProviderFromModelString } from '../knowledge-base/model-providers'
import { getDefaultEmbeddingModelString, getDefaultRerankModelString } from '../rag-default-models'
import { getSettings, store } from '../store-node'
import { getLogger } from '../util'

const log = getLogger('session-attachment-rag:model-providers')

const SESSION_ATTACHMENT_EMBEDDING_MODEL = 'chatbox-ai:text-embedding-3-small'

export type SessionAttachmentEmbeddingProviderResolution = {
  provider: EmbeddingModel
  modelString: string
  source: 'chatbox-ai-license' | 'default-embedding-model'
}

export async function getSessionAttachmentEmbeddingProviderWithResolution(): Promise<SessionAttachmentEmbeddingProviderResolution> {
  const settings = getSettings()
  const hasLicense = Boolean(store.get('settings.licenseKey'))
  const defaultEmbeddingModel = getDefaultEmbeddingModelString(settings)
  const embeddingModel = defaultEmbeddingModel || (hasLicense ? SESSION_ATTACHMENT_EMBEDDING_MODEL : undefined)
  const source: SessionAttachmentEmbeddingProviderResolution['source'] = defaultEmbeddingModel
    ? 'default-embedding-model'
    : 'chatbox-ai-license'

  if (!embeddingModel) {
    throw new Error('session attachment embedding model not set')
  }

  try {
    const provider = await createEmbeddingProviderFromModelString(embeddingModel)
    return {
      provider,
      modelString: embeddingModel,
      source,
    }
  } catch (error) {
    log.error(`[MODEL] Failed to resolve session attachment embedding provider: ${embeddingModel}`, error)
    throw error
  }
}

export async function getSessionAttachmentEmbeddingProvider(): Promise<EmbeddingModel> {
  return (await getSessionAttachmentEmbeddingProviderWithResolution()).provider
}

export function getDefaultSessionAttachmentRerankModelString(): string | undefined {
  const rerankModel = getDefaultRerankModelString(getSettings())
  log.debug(`[MODEL] Default session attachment rerank model: ${rerankModel ?? 'none'}`)
  return rerankModel
}

export async function getSessionAttachmentRerankProvider(modelString?: string | null) {
  if (!modelString) {
    return null
  }

  return cache(
    `session-attachment-rag:rerank:${modelString}`,
    async () => {
      try {
        const parsed = parseKnowledgeBaseModelString(modelString)
        if (!parsed) {
          throw new Error(`Invalid rerank model format: ${modelString}`)
        }

        const { providerId, modelId } = parsed
        const settings = getSettings()
        const { providerSetting, formattedApiHost } = getProviderSettings(
          {
            ...settings,
            provider: providerId,
            modelId,
          },
          settings
        )

        let apiHost = formattedApiHost
        let token = providerSetting.apiKey
        if (providerId === 'chatbox-ai') {
          apiHost = getChatboxAPIOrigin()
          token = store.get('settings.licenseKey')
        }

        if (!token) {
          throw new Error(`Missing token for rerank provider: ${providerId}`)
        }

        const client = new CohereClient({
          environment: apiHost,
          token,
        })
        return { client, modelId }
      } catch (error) {
        log.error(`[MODEL] Failed to resolve session attachment rerank provider: ${modelString}`, error)
        throw error
      }
    },
    {
      ttl: 1000 * 60,
    }
  )
}

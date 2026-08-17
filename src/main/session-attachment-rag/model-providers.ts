import type { EmbeddingModel } from 'ai'
import { CohereClient } from 'cohere-ai'
import { getProviderSettings } from '../../shared/models'
import { parseKnowledgeBaseModelString } from '../../shared/utils/knowledge-base-model-parser'
import { cache } from '../cache'
import { createEmbeddingProviderFromModelString } from '../knowledge-base/model-providers'
import { getDefaultEmbeddingModelString, getDefaultRerankModelString } from '../rag-default-models'
import { getSettings } from '../store-node'
import { getLogger } from '../util'

const log = getLogger('session-attachment-rag:model-providers')

export type SessionAttachmentEmbeddingProviderResolution = {
  provider: EmbeddingModel
  modelString: string
  source: 'default-embedding-model'
}

export async function getSessionAttachmentEmbeddingProviderWithResolution(): Promise<SessionAttachmentEmbeddingProviderResolution> {
  const settings = getSettings()
  const embeddingModel = getDefaultEmbeddingModelString(settings)

  if (!embeddingModel) {
    throw new Error('session attachment embedding model not set')
  }

  try {
    const provider = await createEmbeddingProviderFromModelString(embeddingModel)
    return {
      provider,
      modelString: embeddingModel,
      source: 'default-embedding-model',
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

        if (!providerSetting.apiKey) {
          throw new Error(`Missing token for rerank provider: ${providerId}`)
        }

        const client = new CohereClient({
          environment: formattedApiHost,
          token: providerSetting.apiKey,
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

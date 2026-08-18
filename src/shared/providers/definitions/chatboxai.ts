import { ModelProviderEnum, ModelProviderType } from '../../types'
import { defineProvider } from '../registry'
import ChatboxAI from './models/chatboxai'

export const chatboxAIProvider = defineProvider({
  id: ModelProviderEnum.ChatboxAI,
  name: 'Chatbox AI',
  type: ModelProviderType.ChatboxAI,
  urls: {
    website: 'https://chatbox-unbundled.pages.dev',
    docs: 'https://github.com/metaory/chatbox-unbundled',
  },
  createModel: (config) => {
    return new ChatboxAI(
      {
        model: config.model,
        language: config.globalSettings.language,
        dalleStyle: config.settings.dalleStyle || 'vivid',
        temperature: config.settings.temperature,
        topP: config.settings.topP,
        maxOutputTokens: config.settings.maxTokens,
        stream: config.settings.stream,
      },
      config.config,
      config.dependencies
    )
  },
  getDisplayName: (modelId, providerSettings, sessionType) => {
    if (sessionType === 'picture') {
      return 'Chatbox AI'
    }
    return `Chatbox AI (${providerSettings?.models?.find((m) => m.modelId === modelId)?.nickname || modelId})`
  },
})

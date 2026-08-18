import { ofetch } from 'ofetch'
import { z } from 'zod'
import { getLogger } from '@/lib/utils'
import platform from '@/platform'
import { CHATBOX_BUILD_CHANNEL, USE_LOCAL_CHATBOX } from '@/variables'
import * as chatboxaiAPI from '../../shared/request/chatboxai_pool'
import { createAfetch, createAuthenticatedAfetch } from '../../shared/request/request'
import { reportNativeContent } from '../../shared/services/native-report'
import {
  type CopilotDetail,
  type ModelProvider,
  ProviderModelInfoSchema,
  type RemoteConfig,
} from '../../shared/types'
import { getOS } from './navigator'

const log = getLogger('remote-api')

let _afetch: ReturnType<typeof createAfetch> | null = null
let afetchPromise: Promise<ReturnType<typeof createAfetch>> | null = null

async function initAfetch(): Promise<ReturnType<typeof createAfetch>> {
  if (afetchPromise) return afetchPromise

  afetchPromise = (async () => {
    _afetch = createAfetch({
      type: platform.type,
      platform: await platform.getPlatform(),
      os: getOS(),
      version: await platform.getVersion(),
    })
    return _afetch
  })()

  return afetchPromise
}

async function getAfetch() {
  if (!_afetch) {
    return await initAfetch()
  }
  return _afetch
}

// ========== Authenticated Afetch (带 token 自动刷新) ==========

let _authenticatedAfetch: ReturnType<typeof createAuthenticatedAfetch> | null = null
let authenticatedAfetchPromise: Promise<ReturnType<typeof createAuthenticatedAfetch>> | null = null

async function initAuthenticatedAfetch(): Promise<ReturnType<typeof createAuthenticatedAfetch>> {
  if (authenticatedAfetchPromise) return authenticatedAfetchPromise

  authenticatedAfetchPromise = (async () => {
    _authenticatedAfetch = createAuthenticatedAfetch({
      platformInfo: {
        type: platform.type,
        platform: await platform.getPlatform(),
        os: getOS(),
        version: await platform.getVersion(),
      },
      getTokens: async () => null,
      refreshTokens: async () => {
        throw new Error('not signed in')
      },
      clearTokens: async () => {},
    })
    return _authenticatedAfetch
  })()

  return authenticatedAfetchPromise
}

async function getAuthenticatedAfetch() {
  if (!_authenticatedAfetch) {
    return await initAuthenticatedAfetch()
  }
  return _authenticatedAfetch
}

// ========== API ORIGIN 根据可用性维护 ==========

// const RELEASE_ORIGIN = 'https://chatbox-unbundled.pages.dev'
export function getAPIOrigin() {
  return chatboxaiAPI.getChatboxAPIOrigin()
}

export function getChatboxOrigin() {
  if (USE_LOCAL_CHATBOX) {
    return 'http://localhost:3002'
  }
  return 'https://chatbox-unbundled.pages.dev'
}

export function buildChatboxUrl(path: string) {
  return new URL(path, getChatboxOrigin()).toString()
}

const getChatboxHeaders = async () => {
  return {
    'CHATBOX-PLATFORM': await platform.getPlatform(),
    'CHATBOX-PLATFORM-TYPE': platform.type,
    'CHATBOX-CHANNEL': CHATBOX_BUILD_CHANNEL,
    'CHATBOX-VERSION': await platform.getVersion(),
    'CHATBOX-OS': getOS(),
  }
}

// ========== 各个接口方法 ==========


// export async function getSponsorAd(): Promise<null | SponsorAd> {
//     type Response = {
//         data: null | SponsorAd
//     }
//     // const res = await ofetch<Response>(`${RELEASE_ORIGIN}/sponsor_ad`, {
//     const res = await ofetch<Response>(`${API_ORIGIN}/sponsor_ad`, {
//         retry: 3,
//     })
//     return res['data'] || null
// }

// export async function listSponsorAboutBanner() {
//     type Response = {
//         data: SponsorAboutBanner[]
//     }
//     // const res = await ofetch<Response>(`${RELEASE_ORIGIN}/sponsor_about_banner`, {
//     const res = await ofetch<Response>(`${API_ORIGIN}/sponsor_ad`, {
//         retry: 3,
//     })
//     return res['data'] || []
// }

export async function listCopilotTags(lang: string) {
  type Response = {
    data: string[]
  }
  const res = await ofetch<Response>(`${getAPIOrigin()}/api/system_copilots/tags/${lang}`, {
    method: 'GET',
    retry: 3,
  })
  return res.data
}

export async function listCopilotsByCursor(
  lang: string,
  filters?: {
    limit?: number
    cursor?: string
    tag?: string
    search?: string
  }
) {
  type Response = {
    data: CopilotDetail[]
    next_cursor: string | null
  }
  const res = await ofetch<Response>(`${getAPIOrigin()}/api/system_copilots/list`, {
    method: 'POST',
    retry: 3,
    body: { lang, ...filters },
  })
  return res
}

export async function recordCopilotUsage(params: {
  id: string
  action: 'create_session' | 'create_thread' | 'create_message' | 'use_copilot'
}) {
  await ofetch(`${getAPIOrigin()}/api/system_copilots/record_usage`, {
    method: 'POST',
    body: {
      ...params,
      device_id: (await platform.getConfig()).uuid,
    },
  })
}

export async function recordCopilotShare(detail: CopilotDetail) {
  await ofetch(`${getAPIOrigin()}/api/copilots/share-record`, {
    method: 'POST',
    body: {
      detail: detail,
    },
  })
}

export async function getPremiumPrice() {
  type Response = {
    data: {
      price: number
      discount: number
      discountLabel: string
    }
  }
  const res = await ofetch<Response>(`${getAPIOrigin()}/api/premium/price`, {
    retry: 3,
  })
  return res.data
}

export async function getRemoteConfig(config: keyof RemoteConfig) {
  type Response = {
    data: Pick<RemoteConfig, typeof config>
  }
  const res = await ofetch<Response>(`${getAPIOrigin()}/api/remote_config/${config}`, {
    retry: 3,
    headers: await getChatboxHeaders(),
  })
  return res['data']
}


export interface DialogConfig {
  markdown: string
  buttons: { label: string; url: string }[]
}

export async function getDialogConfig(params: { uuid: string; language: string; version: string }) {
  type Response = {
    data: null | DialogConfig
  }
  const res = await ofetch<Response>(`${getAPIOrigin()}/api/dialog_config`, {
    method: 'POST',
    retry: 3,
    body: params,
    headers: await getChatboxHeaders(),
  })
  return res['data'] || null
}

export async function parseUserLinkFree(params: { url: string }) {
  const afetch = await getAfetch()
  const res = await afetch(params.url)
  const html = await res.text()
  const title = html.match(/<title[^>]*>([^<]*)/i)?.[1]?.trim() || params.url
  return { title, text: html }
}


const RemoteModelInfoSchema = z.object({
  modelId: z.string(),
  modelName: z.string(),
  labels: z.array(z.string()).optional(),
  type: z.enum(['chat', 'embedding', 'rerank', 'image']).optional(),
  apiStyle: z.enum(['google', 'openai', 'openai-responses', 'anthropic']).optional(),
  contextWindow: z.number().optional(),
  capabilities: z.array(z.enum(['vision', 'tool_use', 'reasoning'])).optional(),
})

export type RemoteModelInfo = z.infer<typeof RemoteModelInfoSchema>

const ModelManifestResponseSchema = z.object({
  success: z.boolean().optional(),
  data: z.object({
    groupName: z.string(),
    models: z.array(RemoteModelInfoSchema),
    imageModels: z.array(RemoteModelInfoSchema).optional().default([]),
  }),
})

export async function getModelManifest(params: { aiProvider: ModelProvider; licenseKey?: string; language?: string }) {
  const afetch = await getAfetch()
  const res = await afetch(
    `${getAPIOrigin()}/api/model_manifest`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(await getChatboxHeaders()),
      },
      body: JSON.stringify({
        aiProvider: params.aiProvider,
        licenseKey: params.licenseKey,
        language: params.language,
      }),
    },
    {
      parseChatboxRemoteError: true,
      retry: 2,
    }
  )
  const { success, data, error } = ModelManifestResponseSchema.safeParse(await res.json())
  if (!success) {
    log.error('getModelManifest error', error)
    throw error
  }
  return data.data
}

const ChatboxAIModelAccessSchema = z.object({
  available: z.boolean().optional().default(true),
})

const ChatboxAIModelPriceTierSchema = z.object({
  max_input_tokens: z.number().optional().default(0),
  max_output_tokens: z.number().optional().default(0),
  price_input: z.number(),
  price_output: z.number(),
})

const ChatboxAIModelPricingSchema = z.object({
  tokensPerComputePoint: z.number().optional().default(0),
  officialInput: z.number().optional().default(0),
  officialOutput: z.number().optional().default(0),
  tieredPricing: z.array(ChatboxAIModelPriceTierSchema).optional().default([]),
})

const ChatboxAIModelInfoSchema = RemoteModelInfoSchema.extend({
  costLevel: z.string().optional().default(''),
  description: z.string().optional().default(''),
  access: ChatboxAIModelAccessSchema.optional().default({ available: true }),
  pricing: ChatboxAIModelPricingSchema.optional(),
})

const ChatboxAIModelListResponseSchema = z.object({
  success: z.boolean().optional(),
  data: z
    .object({
      provider: z.object({
        id: z.string(),
        name: z.string(),
      }),
      license: z
        .object({
          plan: z.string().optional().default('unknown'),
        })
        .optional()
        .default({ plan: 'unknown' }),
      groups: z.array(
        z.object({
          id: z.string(),
          modelIds: z.array(z.string()),
          featuredModelIds: z.array(z.string()).optional(),
        })
      ),
      models: z.record(z.string(), ChatboxAIModelInfoSchema),
      imageModels: z.array(RemoteModelInfoSchema).optional().default([]),
      links: z
        .object({
          modelPricing: z.string().optional(),
          upgrade: z.string().optional(),
        })
        .optional(),
    })
    .passthrough(),
})

export type ChatboxAIModelList = z.infer<typeof ChatboxAIModelListResponseSchema>['data']

export async function getChatboxAIModelList(params: { licenseKey?: string; language?: string }) {
  const afetch = await getAfetch()
  const res = await afetch(
    `${getAPIOrigin()}/api/chatbox_ai/model_list`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(await getChatboxHeaders()),
      },
      body: JSON.stringify({
        licenseKey: params.licenseKey,
        language: params.language,
      }),
    },
    {
      parseChatboxRemoteError: true,
      retry: 2,
    }
  )
  const { success, data, error } = ChatboxAIModelListResponseSchema.safeParse(await res.json())
  if (!success) {
    log.error('getChatboxAIModelList error', error)
    throw error
  }
  return data.data
}

export async function reportContent(params: { id: string; type: string; details: string }) {
  const afetch = await getAfetch()
  await reportNativeContent({
    ...params,
    apiOrigin: getAPIOrigin(),
    fetchFn: (input, init) => afetch(input, init),
    headers: await getChatboxHeaders(),
  })
}

const ProviderInfoResponseSchema = z.object({
  success: z.boolean(),
  data: z.record(z.string(), ProviderModelInfoSchema.nullable()),
})

export async function getProviderModelsInfo(params: { modelIds: string[] }) {
  const afetch = await getAfetch()
  const res = await afetch(
    `${getAPIOrigin()}/api/provider_models_info`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(await getChatboxHeaders()),
      },
      body: JSON.stringify(params),
    },
    {
      parseChatboxRemoteError: true,
      retry: 2,
    }
  )
  const json = ProviderInfoResponseSchema.parse(await res.json())
  return json.data
}

export async function requestLoginTicketId() {
  type Response = {
    data: {
      ticket_id: string
    }
  }
  const afetch = await getAfetch()

  let deviceType: string
  if (platform.type === 'mobile') {
    deviceType = await platform.getPlatform()
  } else if (platform.type === 'desktop') {
    const os = getOS()
    deviceType = os
  } else {
    // web 或其他
    deviceType = platform.type
  }
  const appVersion = await platform.getVersion()
  const deviceName = await platform.getDeviceName()

  const res = await afetch(
    `${getChatboxOrigin()}/api/auth/request_login_ticket`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(await getChatboxHeaders()),
      },
      body: JSON.stringify({
        device_type: deviceType,
        app_version: appVersion,
        device_name: deviceName,
      }),
    },
    {
      parseChatboxRemoteError: true,
      retry: 3,
    }
  )
  const json: Response = await res.json()
  return json.data.ticket_id
}

export async function sendEmailLoginCode(params: { email: string; lang?: string }) {
  type Response = {
    data: {
      result: string
    }
  }
  const afetch = await getAfetch()
  const res = await afetch(
    `${getChatboxOrigin()}/api/auth/send_email_login_code`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(await getChatboxHeaders()),
      },
      body: JSON.stringify({
        email: params.email,
        lang: params.lang,
      }),
    },
    {
      parseChatboxRemoteError: true,
      retry: 2,
    }
  )
  const json: Response = await res.json()
  return json.data.result
}

export async function loginOrSignupWithEmailCode(params: { email: string; code: string }) {
  type Response = {
    data: {
      access_token: string
      refresh_token: string
    }
    success: boolean
  }
  const afetch = await getAfetch()
  const res = await afetch(
    `${getChatboxOrigin()}/api/auth/login_or_signup_with_email_code`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(await getChatboxHeaders()),
      },
      body: JSON.stringify({
        email: params.email,
        code: params.code,
      }),
    },
    {
      parseChatboxRemoteError: true,
      retry: 1,
    }
  )
  const json: Response = await res.json()
  return {
    accessToken: json.data.access_token,
    refreshToken: json.data.refresh_token,
  }
}

export async function getWebAuthToken(): Promise<string> {
  type Response = {
    data: {
      web_auth_token: string
    }
    success: boolean
  }
  const afetch = await getAuthenticatedAfetch()
  const res = await afetch(
    `${getChatboxOrigin()}/api/auth/web_auth_token/generate`,
    {
      method: 'POST',
      headers: {
        ...(await getChatboxHeaders()),
      },
    },
    {
      parseChatboxRemoteError: true,
      retry: 2,
    }
  )
  const json: Response = await res.json()
  return json.data.web_auth_token
}

export async function checkLoginStatus(ticketId: string) {
  type Response = {
    data: {
      status?: 'success' | 'rejected' | 'pending'
      access_token?: string
      refresh_token?: string
    }
    success: boolean
  }
  const afetch = await getAfetch()
  const res = await afetch(
    `${getChatboxOrigin()}/api/auth/login_status`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(await getChatboxHeaders()),
      },
      body: JSON.stringify({ ticket_id: ticketId }),
    },
    {
      parseChatboxRemoteError: true,
      retry: 2,
    }
  )
  const json: Response = await res.json()
  const responseStatus = json.data.status
  const accessToken = json.data.access_token || null
  const refreshToken = json.data.refresh_token || null

  let status: 'pending' | 'success' | 'rejected' = 'pending'
  if (responseStatus === 'success' && accessToken && refreshToken) {
    status = 'success'
  } else if (responseStatus === 'rejected') {
    status = 'rejected'
  }

  return {
    status,
    accessToken,
    refreshToken,
  }
}

export async function refreshAccessToken(params: { refreshToken: string }) {
  type Response = {
    data: {
      result: string
    }
  }
  const afetch = await getAfetch()
  const res = await afetch(
    `${getChatboxOrigin()}/api/auth/token_refresh`,
    {
      method: 'POST',
      headers: {
        'x-chatbox-refresh-token': params.refreshToken,
        ...(await getChatboxHeaders()),
      },
    },
    {
      parseChatboxRemoteError: true,
      retry: 2,
    }
  )
  const json: Response = await res.json()
  // log.info('✅ refreshAccessToken response', json)

  const accessToken = res.headers.get('x-chatbox-access-token')
  const refreshToken = res.headers.get('x-chatbox-refresh-token')

  if (!accessToken || !refreshToken) {
    log.error('❌ Missing tokens in response headers:', {
      accessToken: accessToken ? 'present' : 'missing',
      refreshToken: refreshToken ? 'present' : 'missing',
    })
    throw new Error('Failed to refresh token: missing tokens in response headers')
  }

  return {
    accessToken,
    refreshToken,
  }
}

export async function getUserProfile() {
  type Response = {
    data: {
      email: string
      id: string
      created_at: string
    }
  }
  const afetch = await getAuthenticatedAfetch()
  const res = await afetch(
    `${getChatboxOrigin()}/api/user/profile`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(await getChatboxHeaders()),
      },
    },
    {
      parseChatboxRemoteError: true,
      retry: 2,
    }
  )
  const json: Response = await res.json()
  return json.data
}

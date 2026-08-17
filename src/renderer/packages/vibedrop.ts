import { ofetch } from 'ofetch'
import { settingsStore } from '@/stores/settingsStore'

const VIBEDROP_API = 'https://api.vibedrop.cc'
export const VIBEDROP_MANAGE_URL = 'https://app.vibedrop.cc'

export type VibedropVisibility = 'unlisted' | 'public'

export interface VibedropSite {
  slug: string
  url: string
  visibility: VibedropVisibility
  claimUrl?: string | null
}

export class VibedropAuthError extends Error {}
export class VibedropSlugNotOwnedError extends Error {}

type Json = Record<string, unknown> & {
  key?: string
  site?: { slug: string; url: string; visibility: VibedropVisibility }
  claimUrl?: string | null
  url?: string
  error?: { code?: string; message?: string }
}

async function request(path: string, init: RequestInit = {}, key?: string) {
  const headers = new Headers(init.headers)
  if (!headers.has('Content-Type') && init.body) headers.set('Content-Type', 'application/json')
  if (key) headers.set('Authorization', `Bearer ${key}`)
  const res = await ofetch.raw<Json>(`${VIBEDROP_API}${path}`, {
    method: init.method,
    headers,
    body: init.body,
    ignoreResponseError: true,
  })
  return { status: res.status, json: res._data ?? null }
}

export async function createAnonKey(): Promise<string> {
  const { status, json } = await request('/v1/keys/anonymous', { method: 'POST' })
  if (status >= 400 || !json?.key) {
    throw new Error(json?.error?.message || `Failed to create VibeDrop key (status ${status})`)
  }
  return json.key
}

export async function ensureVibedropKey(): Promise<string> {
  const existing = settingsStore.getState().vibedropApiKey?.trim()
  if (existing) return existing
  const key = await createAnonKey()
  settingsStore.getState().setSettings({ vibedropApiKey: key })
  return key
}

export async function mintClaimUrl(key: string): Promise<string> {
  const { status, json } = await request('/v1/keys/claim-token', { method: 'POST' }, key)
  if (status >= 400 || !json?.url) {
    throw new Error(json?.error?.message || `Failed to mint claim URL (status ${status})`)
  }
  return json.url
}

async function publishOnce(params: {
  html: string
  visibility: VibedropVisibility
  slug?: string | null
  key: string
}): Promise<VibedropSite> {
  const { html, visibility, slug, key } = params
  if (!html.trim()) throw new Error('HTML content is empty, nothing to publish.')
  const body: Record<string, unknown> = { html, visibility }
  if (slug) body.slug = slug
  const { status, json } = await request(
    '/v1/sites/inline',
    { method: 'POST', body: JSON.stringify(body) },
    key
  )
  if (status === 401 || status === 403) {
    throw new VibedropAuthError(json?.error?.message || 'VibeDrop authorization failed')
  }
  if (status === 404 && json?.error?.code === 'slug_not_owned') {
    throw new VibedropSlugNotOwnedError('slug no longer owned')
  }
  if (status >= 400 || !json?.site?.url) {
    throw new Error(json?.error?.message || `Failed to publish to VibeDrop (status ${status})`)
  }
  return { ...json.site, claimUrl: json.claimUrl }
}

export async function publishToVibedrop(params: {
  html: string
  visibility: VibedropVisibility
  slug?: string | null
}): Promise<VibedropSite> {
  let key = await ensureVibedropKey()
  try {
    return await publishOnce({ ...params, key })
  } catch (e) {
    if (!(e instanceof VibedropAuthError)) throw e
    settingsStore.getState().setSettings({ vibedropApiKey: undefined })
    key = await ensureVibedropKey()
    return await publishOnce({ ...params, key })
  }
}

export function getStoredSlug(uniqueId: string | undefined): string | undefined {
  if (!uniqueId) return undefined
  return settingsStore.getState().vibedropSlugs?.[uniqueId]
}

export function setStoredSlug(uniqueId: string | undefined, slug: string): void {
  if (!uniqueId) return
  settingsStore.getState().setSettings((state) => {
    state.vibedropSlugs = { ...(state.vibedropSlugs || {}), [uniqueId]: slug }
  })
}

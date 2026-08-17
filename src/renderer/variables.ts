// Injected at compile time by electron.vite.config.ts `define`.

export const CHATBOX_BUILD_TARGET = (process.env.CHATBOX_BUILD_TARGET || 'unknown') as 'unknown' | 'mobile_app'
export const CHATBOX_BUILD_PLATFORM = (process.env.CHATBOX_BUILD_PLATFORM || 'unknown') as
  | 'unknown'
  | 'ios'
  | 'android'
  | 'web'

export const CHATBOX_BUILD_CHANNEL = (process.env.CHATBOX_BUILD_CHANNEL || 'unknown') as 'unknown' | 'google_play'

// api.chatboxai.app
export const USE_LOCAL_API = process.env.USE_LOCAL_API || ''
export const USE_BETA_API = process.env.USE_BETA_API || ''
export const USE_NEWDB_API = process.env.USE_NEWDB_API || ''

// chatboxai.app
export const USE_LOCAL_CHATBOX = process.env.USE_LOCAL_CHATBOX || ''
export const USE_BETA_CHATBOX = process.env.USE_BETA_CHATBOX || ''

export const NODE_ENV = process.env.NODE_ENV || 'development'

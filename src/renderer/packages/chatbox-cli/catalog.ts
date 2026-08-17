import type { ChatboxCliCommandDefinition } from './types'

export type ChatboxCliCommandDomain = 'settings' | 'chats' | 'image'

export interface ChatboxCliCommandCatalogEntry
  extends Pick<ChatboxCliCommandDefinition, 'path' | 'description' | 'usage'> {
  domain: ChatboxCliCommandDomain
}

/**
 * Pure command metadata. Keep this module free of renderer stores and services so
 * help/capability discovery never loads the runtime implementation of every domain.
 */
export const chatboxCliCommandCatalog: ChatboxCliCommandCatalogEntry[] = [
  {
    domain: 'settings',
    path: ['version'],
    description: 'Show installed Chatbox client version and platform.',
    usage: 'chatbox version',
  },
  {
    domain: 'settings',
    path: ['settings', 'list'],
    description: 'List settings exposed through the read-only CLI allowlist.',
    usage: 'chatbox settings list',
  },
  {
    domain: 'settings',
    path: ['settings', 'get'],
    description: 'Read one allowlisted setting.',
    usage: 'chatbox settings get <key>',
  },
  {
    domain: 'chats',
    path: ['chats', 'list'],
    description: 'List conversation metadata. Reading history does not require approval.',
    usage: 'chatbox chats list [--limit 10] [--cursor 0] [--archived]',
  },
  {
    domain: 'chats',
    path: ['chats', 'search'],
    description: 'Search message text across conversation history without approval.',
    usage: 'chatbox chats search <query> [--limit 10]',
  },
  {
    domain: 'chats',
    path: ['chats', 'read'],
    description: 'Read compact user/assistant messages from one conversation without approval.',
    usage: 'chatbox chats read <session-id> [--limit 20] [--cursor 0]',
  },
  {
    domain: 'image',
    path: ['image', 'generate'],
    description: 'Request approval, then start a callback-driven image background task. Never poll for completion.',
    usage:
      'chatbox image generate --prompt <text> [--provider <id>] [--model <id>] [--count 1] [--aspect-ratio <ratio>]',
  },
  {
    domain: 'image',
    path: ['image', 'status'],
    description: 'Inspect one image record after a callback, on explicit request, or for recovery. Do not poll it.',
    usage: 'chatbox image status <record-id>',
  },
  {
    domain: 'image',
    path: ['image', 'history'],
    description: 'List the device-wide Image Creator history, not only the current conversation.',
    usage: 'chatbox image history [--limit 10] [--cursor 0]',
  },
  {
    domain: 'image',
    path: ['image', 'models'],
    description: 'List configured image-capable models without exposing provider credentials.',
    usage: 'chatbox image models',
  },
]

export function sameCommandPath(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((part, index) => part === right[index])
}

import { t } from 'i18next'
import { parseChatboxCliInput } from '@/packages/chatbox-cli/parser'
import type { ChatboxCliInput } from '@/packages/chatbox-cli/types'

function getChatboxCliToolName(input: unknown): string {
  if (!input || typeof input !== 'object') return 'Chatbox'
  const value = input as Record<string, unknown>
  const cliInput: ChatboxCliInput = {
    ...(typeof value.command === 'string' ? { command: value.command } : {}),
    ...(Array.isArray(value.argv) && value.argv.every((item) => typeof item === 'string') ? { argv: value.argv } : {}),
  }

  let argv: string[]
  try {
    argv = parseChatboxCliInput(cliInput).argv.map((item) => item.toLowerCase())
  } catch {
    return 'Chatbox'
  }

  const [first, second] = argv
  if (first === 'version') return 'Chatbox Version'
  if (first === 'settings' && second === 'list') return 'List Settings'
  if (first === 'settings' && second === 'get') return 'Read Setting'
  if (first === 'chats' && second === 'list') return 'Conversation List'
  if (first === 'chats' && second === 'search') return 'Search All Conversations'
  if (first === 'chats' && second === 'read') return 'Read Conversation'
  if (first === 'image' && second === 'models') return 'List Image Models'
  if (first === 'image' && second === 'generate') return 'Generate images'
  if (first === 'image' && second === 'status') return 'Image Generation Status'
  if (first === 'image' && second === 'history') return 'Image History'
  return 'Chatbox'
}

export function getToolName(toolName: string, input?: unknown): string {
  if (toolName === 'chatbox_cli') return getChatboxCliToolName(input)
  // Use translation keys that i18next cli can detect
  const toolNames: Record<string, string> = {
    query_knowledge_base: 'Query Knowledge Base',
    get_files_meta: 'Get Files Meta',
    read_file_chunks: 'Read File Chunks',
    list_files: 'List Files',
    web_search: 'Web Search',
    file_search: 'File Search',
    code_search: 'Code Search',
    terminal: 'Terminal',
    create_file: 'Create File',
    edit_file: 'Edit File',
    delete_file: 'Delete File',
    read_file: 'Read File',
    write_file: 'Write File',
    search_files: 'Search Files',
    parse_link: 'Parse Link',
    code_execution: 'Code Execution',
    create_download: 'Create Download',
    search_file_content: 'Search File Content',
    sandbox_bash: 'Terminal',
    sandbox_read: 'Read File',
    sandbox_write: 'Write File',
    sandbox_edit: 'Edit File',
    sandbox_grep: 'Search File Content',
    sandbox_ls: 'List Directory',
    sandbox_find: 'Find Files',
    load_skill: 'Load Skill',
    install_skill: 'Install Skill',
    user_exec: 'Run Command',
    parse_file: 'Parse File',
  }

  return toolNames[toolName] || toolName
}

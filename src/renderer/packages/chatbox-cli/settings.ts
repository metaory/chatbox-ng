import { Theme } from '@shared/types'
import platform from '@/platform'
import { settingsStore } from '@/stores/settingsStore'
import { ChatboxCliUsageError } from './parser'
import type { ChatboxCliCommandDefinition } from './types'

type SafeSettingValue = string | number | boolean
type SettingsPage = 'General Settings' | 'Chat Settings'

interface SafeSettingSpec {
  key: string
  description: string
  page: SettingsPage
  read: () => SafeSettingValue
}

function manualChangeGuidance(page: SettingsPage): string {
  return `Open Chatbox Settings > ${page} and ask the user to change this setting manually.`
}

function themeName(theme: Theme): 'dark' | 'light' | 'system' {
  if (theme === Theme.Dark) return 'dark'
  if (theme === Theme.Light) return 'light'
  return 'system'
}

const safeSettings: SafeSettingSpec[] = [
  {
    key: 'appearance.theme',
    description: 'App color theme.',
    page: 'General Settings',
    read: () => themeName(settingsStore.getState().theme),
  },
  {
    key: 'appearance.language',
    description: 'App display language.',
    page: 'General Settings',
    read: () => settingsStore.getState().language,
  },
  {
    key: 'appearance.font-size',
    description: 'Base UI font size.',
    page: 'General Settings',
    read: () => settingsStore.getState().fontSize,
  },
  {
    key: 'appearance.spell-check',
    description: 'Enable spell checking.',
    page: 'Chat Settings',
    read: () => Boolean(settingsStore.getState().spellCheck),
  },
  {
    key: 'chat.stream',
    description: 'Stream model responses.',
    page: 'Chat Settings',
    read: () => settingsStore.getState().stream !== false,
  },
  {
    key: 'chat.temperature',
    description: 'Default model temperature.',
    page: 'Chat Settings',
    read: () => settingsStore.getState().temperature ?? 0.7,
  },
  {
    key: 'chat.max-context-messages',
    description: 'Default maximum context message count.',
    page: 'Chat Settings',
    read: () => settingsStore.getState().maxContextMessageCount ?? Number.MAX_SAFE_INTEGER,
  },
  ...(
    [
      ['chat.show-word-count', 'Show message word counts.', 'showWordCount', 'Chat Settings'],
      ['chat.show-token-count', 'Show estimated message token counts.', 'showTokenCount', 'Chat Settings'],
      ['chat.show-token-used', 'Show model token usage.', 'showTokenUsed', 'Chat Settings'],
      ['chat.show-model-name', 'Show model names on messages.', 'showModelName', 'Chat Settings'],
      ['chat.show-message-timestamp', 'Show message timestamps.', 'showMessageTimestamp', 'Chat Settings'],
      ['chat.show-avatar', 'Show chat avatars.', 'showAvatar', 'Chat Settings'],
      ['chat.markdown', 'Render Markdown.', 'enableMarkdownRendering', 'Chat Settings'],
      ['chat.latex', 'Render LaTeX.', 'enableLaTeXRendering', 'Chat Settings'],
      ['chat.mermaid', 'Render Mermaid diagrams.', 'enableMermaidRendering', 'Chat Settings'],
      ['chat.auto-generate-title', 'Automatically name new chats.', 'autoGenerateTitle', 'Chat Settings'],
      ['chat.auto-compaction', 'Automatically compact long contexts.', 'autoCompaction', 'Chat Settings'],
      ['app.auto-launch', 'Launch Chatbox at system startup.', 'autoLaunch', 'General Settings'],
      ['app.auto-update', 'Automatically check for stable updates.', 'autoUpdate', 'General Settings'],
      ['app.beta-update', 'Include beta updates.', 'betaUpdate', 'General Settings'],
    ] as const
  ).map(
    ([key, description, field, page]): SafeSettingSpec => ({
      key,
      description,
      page,
      read: () => Boolean(settingsStore.getState()[field]),
    })
  ),
  {
    key: 'chat.message-layout',
    description: 'Message layout style.',
    page: 'Chat Settings',
    read: () => settingsStore.getState().messageLayout ?? 'bubble',
  },
  {
    key: 'chat.compaction-threshold',
    description: 'Context compaction threshold.',
    page: 'Chat Settings',
    read: () => settingsStore.getState().compactionThreshold,
  },
  {
    key: 'app.startup-page',
    description: 'Page shown at startup.',
    page: 'General Settings',
    read: () => settingsStore.getState().startupPage ?? 'home',
  },
]

function findSetting(key: string): SafeSettingSpec {
  const setting = safeSettings.find((candidate) => candidate.key === key)
  if (!setting) throw new ChatboxCliUsageError(`Unknown or protected setting: ${key}`)
  return setting
}

export const settingsCommands: ChatboxCliCommandDefinition[] = [
  {
    path: ['version'],
    description: 'Show installed Chatbox client version and platform.',
    usage: 'chatbox version',
    async execute() {
      const [installedVersion, platformName] = await Promise.all([
        platform.getVersion().catch(() => 'unknown'),
        platform.getPlatform().catch(() => 'unknown'),
      ])
      return { installedVersion, platform: platformName }
    },
  },
  {
    path: ['settings', 'list'],
    description: 'List settings exposed through the read-only CLI allowlist.',
    usage: 'chatbox settings list',
    execute() {
      return {
        readOnly: true,
        changeGuidance: 'Guide the user to the listed Chatbox Settings page to make changes manually.',
        settings: safeSettings.map((setting) => ({
          key: setting.key,
          value: setting.read(),
          description: setting.description,
          location: `Settings > ${setting.page}`,
        })),
      }
    },
  },
  {
    path: ['settings', 'get'],
    description: 'Read one allowlisted setting.',
    usage: 'chatbox settings get <key>',
    execute({ parsed }) {
      const key = parsed.positionals[0]
      if (!key) throw new ChatboxCliUsageError('Missing setting key.')
      const setting = findSetting(key)
      return {
        readOnly: true,
        key,
        value: setting.read(),
        description: setting.description,
        location: `Settings > ${setting.page}`,
        changeGuidance: manualChangeGuidance(setting.page),
      }
    },
  },
]

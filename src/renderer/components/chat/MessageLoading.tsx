import { Group, Text } from '@mantine/core'
import type { Message } from '@shared/types'
import { IconLoader } from '@tabler/icons-react'
import { Loader } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getToolName } from '@/packages/tools'

export default function MessageStatuses(props: { statuses: Message['status'] }) {
  const { statuses } = props
  if (!statuses || statuses.length === 0) {
    return null
  }
  return (
    <>
      {statuses.map((status, index) => (
        <MessageStatus key={index} status={status} />
      ))}
    </>
  )
}

function MessageStatus(props: { status: NonNullable<Message['status']>[number] }) {
  const { status } = props
  const { t } = useTranslation()
  if (status.type === 'sending_file') {
    return (
      <div>
        <LoadingBubble>
          <span className="flex flex-col">
            <span>{t('Reading file...')}</span>
            {status.mode && (
              <span className="text-[10px] opacity-70 font-normal">
                {status.mode === 'local' ? t('Local Mode') : t('Advanced Mode')}
              </span>
            )}
          </span>
        </LoadingBubble>
      </div>
    )
  }
  if (status.type === 'loading_webpage') {
    return (
      <div>
        <LoadingBubble>
          <span className="flex flex-col">
            <span>{t('Loading webpage...')}</span>
            {status.mode && (
              <span className="text-[10px] opacity-70 font-normal">
                {status.mode === 'local' ? t('Local Mode') : t('Advanced Mode')}
              </span>
            )}
          </span>
        </LoadingBubble>
      </div>
    )
  }
  if (status.type === 'retrying') {
    return <RetryingIndicator attempt={status.attempt} maxAttempts={status.maxAttempts} />
  }
  if (status.type === 'preparing_tool_call') {
    return <PreparingToolCallStatus status={status} />
  }
  return null
}

export function PreparingToolCallStatus(props: {
  status: Extract<NonNullable<Message['status']>[number], { type: 'preparing_tool_call' }>
}) {
  const { status } = props
  const { t } = useTranslation()
  const translate = t as (key: string, options?: Record<string, unknown>) => string
  const label = status.toolName
    ? `${translate('Preparing')} ${getToolName(status.toolName)}`
    : translate('Preparing tool call')
  const progress = formatPreparingProgress(status.progress, translate)

  return (
    <Group gap={6} align="center" wrap="nowrap" mt={6} mb={2} className="max-w-full">
      <IconLoader
        size={13}
        className="animate-spin shrink-0"
        color="var(--chatbox-tint-brand)"
        style={{ display: 'block' }}
      />
      <Text size="xs" c="chatbox-secondary" lh="16px" truncate="end">
        {progress ? `${label} · ${progress}` : label}
      </Text>
    </Group>
  )
}

function formatPreparingProgress(
  progress: Extract<NonNullable<Message['status']>[number], { type: 'preparing_tool_call' }>['progress'],
  t: (key: string, options?: Record<string, unknown>) => string
): string | null {
  if (!progress) return null
  if (progress.kind === 'lines') {
    return t('{{count}} lines', { count: progress.value })
  }
  return `${progress.value.toFixed(1)} KB`
}

function RetryingIndicator(props: { attempt: number; maxAttempts: number }) {
  const { attempt, maxAttempts } = props
  const { t } = useTranslation()
  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-1">
      <Loader className="w-3 h-3 animate-spin" />
      <span>{t('Retrying {{attempt}}/{{maxAttempts}}', { attempt, maxAttempts })}</span>
    </div>
  )
}

export function LoadingBubble(props: { children: React.ReactNode }) {
  const { children } = props
  return (
    <div className="flex flex-row items-start justify-start overflow-x-auto overflow-y-hidden">
      <div
        className="flex justify-start items-center mb-1 px-1 py-2
                                                    border-solid border-chatbox-border-brand shadow-md rounded-lg
                                                    bg-chatbox-background-brand-secondary
                                                    "
      >
        <Loader className="w-6 h-6 ml-1 mr-2 text-chatbox-tint-brand animate-spin" />
        <span className="mr-4 animate-pulse font-bold text-chatbox-tint-primary/70">{children}</span>
      </div>
    </div>
  )
}

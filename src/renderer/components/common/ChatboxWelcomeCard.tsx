import { Button, Paper, Stack, Text } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import { navigateToSettings } from '@/modals/Settings'
import type { HomeWelcomeCardMode } from '@/utils/homeWelcomeCard'

export function ChatboxWelcomeCard(props: { mode: HomeWelcomeCardMode; className?: string }) {
  const { mode, className } = props
  const { t } = useTranslation()

  if (mode === 'none') {
    return null
  }

  return (
    <Paper
      radius="lg"
      withBorder
      py="md"
      px="sm"
      className={`bg-white/40 dark:bg-zinc-900/40 backdrop-blur-md ${className || ''}`}
    >
      <Stack gap="sm" align="center">
        <Text fw={600} ta="center">
          {t('Welcome to Chatbox!')}
        </Text>
        <Text size="xs" c="chatbox-tertiary" ta="center">
          {t('Select and configure an AI model provider')}
        </Text>
        <Button size="xs" variant="filled" h={32} miw={160} fw={600} onClick={() => navigateToSettings('provider')}>
          {t('Setup Provider')}
        </Button>
      </Stack>
    </Paper>
  )
}

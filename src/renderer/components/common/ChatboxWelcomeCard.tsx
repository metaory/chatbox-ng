import { Button, Paper, Stack, Text } from '@mantine/core'
import { navigateToSettings } from '@/modals/Settings'
import type { HomeWelcomeCardMode } from '@/utils/homeWelcomeCard'

export function ChatboxWelcomeCard(props: { mode: HomeWelcomeCardMode; className?: string }) {
  const { mode, className } = props

  if (mode === 'none') {
    return null
  }

  return (
    <Paper
      radius="lg"
      withBorder
      py="md"
      px="sm"
      className={`backdrop-blur-md ${className || ''}`}
      bg="color-mix(in srgb, var(--chatbox-background-primary) 50%, transparent)"
    >
      <Stack gap="sm" align="center">
        <Text fw={600} ta="center">
          Welcome to Chatbox!
        </Text>
        <Text size="xs" c="chatbox-tertiary" ta="center">
          Select and configure an AI model provider
        </Text>
        <Button size="xs" variant="filled" h={32} miw={160} fw={600} onClick={() => navigateToSettings('provider')}>
          Setup Provider
        </Button>
      </Stack>
    </Paper>
  )
}

import { ActionIcon, Flex, Paper, Text } from '@mantine/core'
import { IconX } from '@tabler/icons-react'
import { ScalableIcon } from '@/components/common/ScalableIcon'
import { useUIStore } from '@/stores/uiStore'

export function Disclaimer() {
  const dismissed = useUIStore((s) => s.disclaimerDismissed)
  const setDisclaimerDismissed = useUIStore((s) => s.setDisclaimerDismissed)

  if (dismissed) {
    return null
  }

  return (
    <div className="disclaimer-safe-area flex justify-center">
      <Paper
        radius="lg"
        py="xs"
        px="sm"
        className="w-max max-w-full backdrop-blur-md"
        bg="color-mix(in srgb, var(--chatbox-background-primary) 50%, transparent)"
      >
        <Flex align="center" gap="xs">
          <Text size="xs" c="chatbox-secondary">
            AI-generated content may be inaccurate. Please verify important information.
          </Text>
          <ActionIcon
            variant="subtle"
            color="chatbox-secondary"
            size="sm"
            aria-label="Dismiss disclaimer"
            onClick={() => setDisclaimerDismissed(true)}
          >
            <ScalableIcon icon={IconX} size={12} />
          </ActionIcon>
        </Flex>
      </Paper>
    </div>
  )
}

export default Disclaimer

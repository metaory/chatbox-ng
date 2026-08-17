import { Button, Stack, Text } from '@mantine/core'
import type { Session } from '@shared/types/session'
import { runCompactionWithUIState } from '@/packages/context-management/compaction'
import { AdaptiveModal } from './AdaptiveModal'

interface CompressionModalProps {
  opened: boolean
  onClose: () => void
  session: Session
}

export function CompressionModal({ opened, onClose, session }: CompressionModalProps) {

  const handleConfirm = () => {
    onClose()
    void runCompactionWithUIState(session.id, { force: true })
  }

  return (
    <AdaptiveModal opened={opened} onClose={onClose} title="Compress Conversation" centered size="md">
      <Stack gap="md">
        <Text>
          This will summarize the current conversation and start a new thread with the compressed context. Continue?
        </Text>
        <AdaptiveModal.Actions>
          <AdaptiveModal.CloseButton onClick={onClose} />
          <Button onClick={handleConfirm}>Confirm</Button>
        </AdaptiveModal.Actions>
      </Stack>
    </AdaptiveModal>
  )
}

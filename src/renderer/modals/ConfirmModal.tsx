import NiceModal, { useModal } from '@ebay/nice-modal-react'
import { Button, Text } from '@mantine/core'
import { AdaptiveModal } from '@/components/common/AdaptiveModal'

export interface ConfirmModalProps {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  /** Style the confirm button as a destructive action. */
  danger?: boolean
}

/**
 * Generic confirmation dialog. Resolves `true` when the user confirms, `false` when
 * they cancel or dismiss it. Use via `await NiceModal.show('confirm', props)`.
 */
const ConfirmModal = NiceModal.create(({ title, message, confirmText, cancelText, danger }: ConfirmModalProps) => {
  const modal = useModal()

  const close = (result: boolean) => {
    modal.resolve(result)
    modal.hide()
  }

  return (
    <AdaptiveModal opened={modal.visible} onClose={() => close(false)} centered title={title}>
      <Text size="sm" c="chatbox-secondary" style={{ whiteSpace: 'pre-wrap' }}>
        {message}
      </Text>

      <AdaptiveModal.Actions>
        <AdaptiveModal.CloseButton onClick={() => close(false)}>{cancelText || 'Cancel'}</AdaptiveModal.CloseButton>
        <Button color={danger ? 'chatbox-error' : undefined} onClick={() => close(true)}>
          {confirmText || 'Confirm'}
        </Button>
      </AdaptiveModal.Actions>
    </AdaptiveModal>
  )
})

export default ConfirmModal

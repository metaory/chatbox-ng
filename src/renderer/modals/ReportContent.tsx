import NiceModal, { useModal } from '@ebay/nice-modal-react'
import { Button, Stack, Textarea, TextInput } from '@mantine/core'
import { useState } from 'react'
import { AdaptiveSelect } from '@/components/AdaptiveSelect'
import { AdaptiveModal } from '@/components/common/AdaptiveModal'
import { useIsSmallScreen } from '@/hooks/useScreenChange'
import * as remote from '@/packages/remote'
import * as toastActions from '@/stores/toastActions'

const ReportContent = NiceModal.create(({ contentId }: { contentId: string }) => {
  const modal = useModal()
  const isSmallScreen = useIsSmallScreen()

  const [content, setContent] = useState('')
  const [reportType, setReportType] = useState('Harmful or offensive content')

  const onClose = () => {
    modal.resolve()
    modal.hide()
  }

  const onSubmit = async () => {
    toastActions.add('Thank you for your report')
    if (!contentId) {
      return
    }
    await remote.reportContent({
      id: contentId,
      type: reportType,
      details: content,
    })
    modal.resolve()
    modal.hide()
  }

  return (
    <AdaptiveModal opened={modal.visible} onClose={onClose} centered title="Report Content">
      <Stack>
        <TextInput
          label="Report Content ID"
          className="w-full"
          autoFocus={!isSmallScreen}
          value={contentId}
          disabled
        />

        <AdaptiveSelect
          label="Report Type"
          value={reportType}
          classNames={{ dropdown: 'pointer-events-auto' }}
          data={[
            { value: 'Harmful or offensive content', label: 'Harmful or offensive content' },
            { value: 'Misleading information', label: 'Misleading information' },
            { value: 'Spam or advertising', label: 'Spam or advertising' },
            { value: 'Violence or dangerous content', label: 'Violence or dangerous content' },
            { value: 'Child-inappropriate content', label: 'Child-inappropriate content' },
            { value: 'Sexual content', label: 'Sexual content' },
            { value: 'Hate speech or harassment', label: 'Hate speech or harassment' },
            { value: 'Other concerns', label: 'Other concerns' },
          ]}
          onChange={(value) => setReportType(value as string)}
        />

        <Textarea
          autosize
          minRows={3}
          maxRows={10}
          label="Details"
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
      </Stack>

      <AdaptiveModal.Actions>
        <AdaptiveModal.CloseButton onClick={onClose} />
        <Button onClick={onSubmit}>Submit</Button>
      </AdaptiveModal.Actions>
    </AdaptiveModal>
  )
})

export default ReportContent

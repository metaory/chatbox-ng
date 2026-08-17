import NiceModal, { useModal } from '@ebay/nice-modal-react'
import { ActionIcon, Button, CopyButton, Flex, SegmentedControl, Stack, Text, TextInput } from '@mantine/core'
import { IconCheck, IconCopy, IconExternalLink, IconWorldUpload } from '@tabler/icons-react'
import { useCallback, useState } from 'react'
import { AdaptiveModal } from '@/components/common/AdaptiveModal'
import { ScalableIcon } from '@/components/common/ScalableIcon'
import { AppTooltip as Tooltip } from '@/components/ui/tooltip'
import { useIsSmallScreen } from '@/hooks/useScreenChange'
import {
  getStoredSlug,
  publishToVibedrop,
  setStoredSlug,
  type VibedropVisibility,
  VibedropSlugNotOwnedError,
} from '@/packages/vibedrop'

export interface VibedropPublishProps {
  html: string
  uniqueId?: string
}

const VibedropPublish = NiceModal.create(({ html, uniqueId }: VibedropPublishProps) => {
  const modal = useModal()
  const isSmallScreen = useIsSmallScreen()
  const storedSlug = getStoredSlug(uniqueId)
  const [visibility, setVisibility] = useState<VibedropVisibility>('unlisted')
  const [stage, setStage] = useState<'form' | 'publishing' | 'success' | 'error'>('form')
  const [url, setUrl] = useState('')
  const [claimUrl, setClaimUrl] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  const onClose = () => {
    void modal.resolve()
    modal.hide()
  }

  const publish = useCallback(async () => {
    setStage('publishing')
    try {
      const site = await publishToVibedrop({ html, visibility, slug: storedSlug })
      setStoredSlug(uniqueId, site.slug)
      setUrl(site.url)
      setClaimUrl(site.claimUrl || '')
      setStage('success')
    } catch (e) {
      if (e instanceof VibedropSlugNotOwnedError) {
        try {
          const site = await publishToVibedrop({ html, visibility, slug: null })
          setStoredSlug(uniqueId, site.slug)
          setUrl(site.url)
          setClaimUrl(site.claimUrl || '')
          setStage('success')
          return
        } catch (retryErr) {
          setErrorMessage((retryErr as Error).message || 'Publish failed')
          setStage('error')
          return
        }
      }
      setErrorMessage((e as Error).message || 'Publish failed')
      setStage('error')
    }
  }, [html, storedSlug, uniqueId, visibility])

  return (
    <AdaptiveModal opened={modal.visible} onClose={onClose} centered title="Publish to VibeDrop">
      <Stack>
        {(stage === 'form' || stage === 'publishing') && (
          <>
            <Text size="sm" c="dimmed">
              Your HTML page will be published to VibeDrop. Choose who can access it.
            </Text>
            <Text size="xs" c="dimmed">
              Currently Anonymous.
              <br />
              Add your own key in Settings to keep and manage pages.
            </Text>
            <SegmentedControl
              fullWidth
              value={visibility}
              onChange={(v) => setVisibility(v as VibedropVisibility)}
              disabled={stage === 'publishing'}
              data={[
                { label: 'Link only', value: 'unlisted' },
                { label: 'Public', value: 'public' },
              ]}
            />
            <Text size="xs" c="dimmed">
              {visibility === 'public'
                ? 'Anyone can find this page in the VibeDrop explore gallery.'
                : 'Only people with the link can open this page.'}
            </Text>
            <AdaptiveModal.Actions>
              <Button variant="default" onClick={onClose} disabled={stage === 'publishing'}>
                close
              </Button>
              <Button
                onClick={publish}
                loading={stage === 'publishing'}
                leftSection={<ScalableIcon icon={IconWorldUpload} size={16} />}
              >
                Publish
              </Button>
            </AdaptiveModal.Actions>
          </>
        )}
        {stage === 'error' && (
          <>
            <Text size="sm" c="red">
              {errorMessage}
            </Text>
            <AdaptiveModal.Actions>
              <Button variant="default" onClick={onClose}>
                close
              </Button>
              <Button onClick={() => setStage('form')}>
                Try Again
              </Button>
            </AdaptiveModal.Actions>
          </>
        )}
        {stage === 'success' && (
          <>
            <Text size="sm" c="dimmed">
              Your page is published. You can access it via the link below.
            </Text>
            <Flex gap="xs" className={isSmallScreen ? 'flex-col' : ''}>
              <TextInput
                value={url}
                readOnly
                className="flex-1"
                rightSection={
                  <CopyButton value={url} timeout={2000}>
                    {({ copied, copy }) => (
                      <Tooltip label={copied ? 'Copied' : 'Copy'} withArrow position="right">
                        <ActionIcon color={copied ? 'teal' : 'gray'} variant="subtle" onClick={copy}>
                          {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </CopyButton>
                }
              />
              <Button
                component="a"
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                leftSection={<ScalableIcon icon={IconExternalLink} size={16} />}
              >
                Open
              </Button>
            </Flex>
            {claimUrl && (
              <Text size="xs" c="dimmed">
                Claim this site at VibeDrop to keep and manage it. The claim link expires in 1 hour. 
                <a href={claimUrl} target="_blank" rel="noopener noreferrer" className="underline">
                  Claim this site
                </a>
              </Text>
            )}
            {!isSmallScreen && (
              <AdaptiveModal.Actions>
                <Button variant="default" onClick={onClose}>
                  close
                </Button>
              </AdaptiveModal.Actions>
            )}
          </>
        )}
      </Stack>
    </AdaptiveModal>
  )
})

export default VibedropPublish

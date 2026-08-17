import NiceModal, { useModal } from '@ebay/nice-modal-react'
import { ActionIcon, Button, Flex, Stack, Text } from '@mantine/core'
import { IconArrowsMaximize, IconArrowsMinimize, IconExternalLink, IconReload, IconWorldUpload, IconX } from '@tabler/icons-react'
import clsx from 'clsx'
import { useCallback, useMemo, useState } from 'react'
import { Artifact } from '@/components/Artifact'
import { ScalableIcon } from '@/components/common/ScalableIcon'
import { Modal } from '@/components/layout/Overlay'
import { AppTooltip as Tooltip } from '@/components/ui/tooltip'
import { useIsSmallScreen } from '@/hooks/useScreenChange'
import platform from '@/platform'

export interface ArtifactPreviewProps {
  htmlCode: string
  previewUrl?: string
  uniqueId?: string
}

const ArtifactPreview = NiceModal.create((props: ArtifactPreviewProps) => {
  const { htmlCode, previewUrl, uniqueId } = props
  const modal = useModal()
  const [reloadSign, setReloadSign] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const canOpenInBrowser = useMemo(() => !!previewUrl || !!htmlCode.trim(), [htmlCode, previewUrl])
  const canPublish = useMemo(() => htmlCode.trim().length > 0, [htmlCode])
  const onReload = () => {
    setReloadSign(Math.random())
  }
  const onClose = () => {
    modal.resolve()
    modal.hide()
  }
  const onOpenInBrowser = useCallback(async () => {
    if (previewUrl) {
      await platform.openLink(previewUrl)
      return
    }
    const html = htmlCode.trim()
    if (!html) return
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
    window.open(url, '_blank', 'noopener')
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }, [htmlCode, previewUrl])
  const onPublish = useCallback(() => {
    if (!canPublish) return
    NiceModal.show('vibedrop-publish', { html: htmlCode, uniqueId }).catch(() => null)
  }, [canPublish, htmlCode, uniqueId])
  const isSmallScreen = useIsSmallScreen()
  const showFullscreen = isSmallScreen || isFullscreen
  const showLabeledActions = !isSmallScreen
  const mobileActionSize = 44

  return (
    <Modal
      opened={modal.visible}
      onClose={onClose}
      title={
        !isSmallScreen ? (
          <Flex align="center" py="xs" className="w-full">
            <Text fw={600} size="md">
              Preview
            </Text>
          </Flex>
        ) : (
          'Preview'
        )
      }
      withCloseButton={false}
      size="100%"
      classNames={{
        content: clsx('flex flex-col', showFullscreen ? '!h-[100vh] !max-h-[auto] !max-w-none' : 'max-w-5xl h-4/5'),
        header: clsx('flex-0 !pb-0', isSmallScreen && 'sr-only'),
        body: clsx('flex-1', showFullscreen ? '!p-0' : ''),
      }}
      fullScreen={showFullscreen}
      centered
      radius={0}
      transitionProps={{ transition: 'slide-up', duration: 200 }}
    >
      <Stack h="100%" gap={0}>
        {isSmallScreen && (
          <Flex
            component="header"
            align="center"
            justify="space-between"
            gap="sm"
            px="md"
            pt="calc(var(--mobile-safe-area-inset-top, 0px) + var(--mantine-spacing-xs))"
            pb="xs"
            tabIndex={-1}
            data-autofocus
            className="shrink-0 border-0 border-b border-solid border-[var(--chatbox-border-primary)] bg-[var(--chatbox-background-primary)] !outline-none"
          >
            <Text fw={600} size="md" className="shrink-0">
              Preview
            </Text>
            <Flex align="center" gap="xs" className="shrink-0">
              <Flex
                align="center"
                gap={2}
                p={2}
                className="rounded-lg border border-solid border-[var(--chatbox-border-primary)] bg-[var(--chatbox-background-secondary)]"
              >
                <Tooltip label="Refresh" withArrow openDelay={500}>
                  <ActionIcon
                    variant="transparent"
                    color="chatbox-tertiary"
                    size={mobileActionSize}
                    onClick={onReload}
                    aria-label="Refresh"
                  >
                    <ScalableIcon icon={IconReload} size={18} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip
                  label={canOpenInBrowser ? 'Open in Browser' : 'HTML content is empty, nothing to publish.'}
                  withArrow
                  openDelay={500}
                >
                  <ActionIcon
                    variant="transparent"
                    color="chatbox-tertiary"
                    size={mobileActionSize}
                    onClick={onOpenInBrowser}
                    aria-label="Open in Browser"
                    disabled={!canOpenInBrowser}
                  >
                    <ScalableIcon icon={IconExternalLink} size={18} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip
                  label={canPublish ? 'Publish Webpage' : 'HTML content is empty, nothing to publish.'}
                  withArrow
                  openDelay={500}
                >
                  <ActionIcon
                    variant="transparent"
                    color="chatbox-brand"
                    size={mobileActionSize}
                    onClick={onPublish}
                    aria-label="Publish Webpage"
                    disabled={!canPublish}
                  >
                    <ScalableIcon icon={IconWorldUpload} size={18} />
                  </ActionIcon>
                </Tooltip>
              </Flex>
              <Tooltip label="close" withArrow openDelay={500}>
                <ActionIcon
                  variant="subtle"
                  color="chatbox-tertiary"
                  size={mobileActionSize}
                  onClick={onClose}
                  aria-label="close"
                >
                  <ScalableIcon icon={IconX} size={20} />
                </ActionIcon>
              </Tooltip>
            </Flex>
          </Flex>
        )}
        <Artifact htmlCode={htmlCode} previewUrl={previewUrl} reloadSign={reloadSign} className="flex-1" />
        {showLabeledActions && (
          <Flex
            align="center"
            justify="flex-end"
            gap="xs"
            p="xs"
            className="shrink-0 flex-wrap border-0 border-t border-solid border-[var(--chatbox-border-primary)] bg-[var(--chatbox-background-primary)]"
          >
            <Button
              variant="subtle"
              size="xs"
              leftSection={<ScalableIcon icon={IconReload} size={16} />}
              onClick={onReload}
            >
              Refresh
            </Button>
            <Button
              variant="subtle"
              size="xs"
              leftSection={<ScalableIcon icon={showFullscreen ? IconArrowsMinimize : IconArrowsMaximize} size={16} />}
              onClick={() => setIsFullscreen((value) => !value)}
            >
              {showFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            </Button>
            <Button
              variant="subtle"
              size="xs"
              leftSection={<ScalableIcon icon={IconExternalLink} size={16} />}
              onClick={onOpenInBrowser}
              disabled={!canOpenInBrowser}
            >
              Open in Browser
            </Button>
            <Button
              variant="subtle"
              size="xs"
              leftSection={<ScalableIcon icon={IconWorldUpload} size={16} />}
              onClick={onPublish}
              disabled={!canPublish}
            >
              Publish Webpage
            </Button>
            <Button variant="subtle" size="xs" leftSection={<ScalableIcon icon={IconX} size={16} />} onClick={onClose}>
              close
            </Button>
          </Flex>
        )}
      </Stack>
    </Modal>
  )
})

export default ArtifactPreview

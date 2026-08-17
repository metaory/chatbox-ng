import {
  Anchor,
  Box,
  Button,
  Container,
  Divider,
  Flex,
  Image,
  Popover,
  Progress,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { IconChevronRight, IconFileText, IconHome, IconMail, IconPencil, IconRefresh } from '@tabler/icons-react'
import { createFileRoute } from '@tanstack/react-router'
import { Children, Fragment, type ReactElement, type ReactNode } from 'react'
import { ScalableIcon } from '@/components/common/ScalableIcon'
import BrandGithub from '@/components/icons/BrandGithub'
import BrandRedNote from '@/components/icons/BrandRedNote'
import BrandWechat from '@/components/icons/BrandWechat'
import Page from '@/components/layout/Page'
import { useIsSmallScreen } from '@/hooks/useScreenChange'
import useVersion from '@/hooks/useVersion'
import { buildChatboxUrl } from '@/packages/remote'
import platform from '@/platform'
import iconPNG from '@/static/icon.png'
import IMG_WECHAT_QRCODE from '@/static/wechat_qrcode.png'
import { useLanguage } from '@/stores/settingsStore'
import { installUpdate, useUpdateStore } from '@/stores/updateStore'

export const Route = createFileRoute('/about')({
  component: RouteComponent,
})

function RouteComponent() {
  const version = useVersion()
  const language = useLanguage()
  const isSmallScreen = useIsSmallScreen()

  return (
    <Page title="About">
      <Container size="md" p={0}>
        <Stack gap="xxl" px={isSmallScreen ? 'sm' : 'md'} py={isSmallScreen ? 'xl' : 'md'}>
          <Flex gap="xxl" p="md" className="rounded-lg bg-chatbox-background-secondary">
            <Image h={100} w={100} mah="20vw" maw="20vw" src={iconPNG} />
            <Stack flex={1} gap="xxs">
              <Flex justify="space-between" align="center" wrap="wrap" gap={isSmallScreen ? 'xs' : 'sm'} rowGap="xs">
                <Title order={5} lh={1.5} lineClamp={1} title={`Chatbox v${version.version}`}>
                  Chatbox {/\d/.test(version.version) ? `(v${version.version})` : ''}
                </Title>

                <UpdateSection language={language} needCheckUpdate={version.needCheckUpdate} />
              </Flex>
              <Text>Boost your efficiency with AI, your ultimate copilot for work and learning</Text>
              <Text c="chatbox-tertiary">A user-friendly AI desktop client that supports multiple advanced AI models, transforming cutting-edge artificial intelligence technology into an easy-to-use productivity tool.</Text>
            </Stack>
          </Flex>

          <List>
            <ListItem
              icon={<BrandGithub className="w-full h-full" />}
              title="Github"
              link="https://github.com/metaory/chatbox-ng"
              value="chatbox-ng"
            />
          </List>

          <List>
            <ListItem
              icon={<IconHome className="w-full h-full" />}
              title="Official Site"
              link="https://github.com/metaory/chatbox-ng"
            />
            <ListItem
              icon={<IconPencil className="w-full h-full" />}
              title="Feedback"
              link="https://github.com/metaory/chatbox-ng/issues/new/choose"
            />
            <ListItem
              icon={<IconFileText className="w-full h-full" />}
              title="Changelog"
              link="https://github.com/metaory/chatbox-ng/releases"
            />
            <ListItem
              icon={<IconMail className="w-full h-full" />}
              title="E-mail"
              link={`mailto:metaory@gmail.com`}
              value="metaory@gmail.com"
            />
          </List>
        </Stack>
      </Container>
    </Page>
  )
}

/**
 * Update section in the About page hero.
 * Desktop: check button, progress bar, error/retry, restart & install.
 * Mobile: "New version available" hint linking to app store.
 */
function UpdateSection({ language, needCheckUpdate }: { language: string; needCheckUpdate: boolean }) {
  const isDesktop = platform.type === 'desktop'

  if (isDesktop) {
    return <DesktopUpdateSection />
  }

  // Mobile and Web both use external link
  return <MobileUpdateHint language={language} needCheckUpdate={needCheckUpdate} />
}

function MobileUpdateHint({ language, needCheckUpdate }: { language: string; needCheckUpdate: boolean }) {

  if (needCheckUpdate) {
    return (
      <Button
        size="xs"
        variant="light"
        color="chatbox-brand"
        radius="md"
        className="flex-shrink-0"
        onClick={() => platform.openLink(buildChatboxUrl(`/redirect_app/check_update/${language}`))}
      >
        New version available
      </Button>
    )
  }

  return (
    <Button
      size="xs"
      variant="default"
      radius="md"
      className="flex-shrink-0"
      onClick={() => platform.openLink(buildChatboxUrl(`/redirect_app/check_update/${language}`))}
    >
      Check Update
    </Button>
  )
}

function DesktopUpdateSection() {
  const status = useUpdateStore((s) => s.status)
  const progress = useUpdateStore((s) => s.progress)
  const updateVersion = useUpdateStore((s) => s.version)

  const handleCheck = async () => {
    useUpdateStore.setState({ status: 'checking', error: null })
    try {
      const result = await platform.checkForUpdate?.()
      // If check was skipped (another check already in progress), reset UI
      if (result && !result.started) {
        const { status: currentStatus } = useUpdateStore.getState()
        if (currentStatus === 'checking') {
          useUpdateStore.setState({ status: 'idle' })
        }
      }
    } catch {
      useUpdateStore.setState({ status: 'idle' })
    }
    // Safety timeout: if still stuck at 'checking' after 30s, reset
    setTimeout(() => {
      if (useUpdateStore.getState().status === 'checking') {
        useUpdateStore.setState({ status: 'idle' })
      }
    }, 30_000)
  }

  const handleInstall = installUpdate

  switch (status) {
    case 'checking':
      return (
        <Button size="xs" variant="default" radius="md" className="flex-shrink-0" loading>
          Checking...
        </Button>
      )

    case 'available':
    case 'downloading':
      return (
        <Stack gap={4} flex={1} maw={200}>
          <Text size="xs" c="chatbox-brand" ta="right">
            {status === 'downloading'
              ? `Downloading... ${progress}%`
              : `New version available${updateVersion ? ` v${updateVersion}` : ''}`}
          </Text>
          {status === 'downloading' && <Progress value={progress} size="xs" color="chatbox-brand" animated />}
        </Stack>
      )

    case 'downloaded':
      return (
        <Button
          size="xs"
          variant="filled"
          color="chatbox-brand"
          radius="md"
          className="flex-shrink-0"
          leftSection={<ScalableIcon icon={IconRefresh} size={14} />}
          onClick={handleInstall}
        >
          Restart & Update
          {updateVersion ? ` (v${updateVersion})` : ''}
        </Button>
      )

    case 'error':
      return (
        <Stack gap={2} align="flex-end" className="flex-shrink-0">
          <Flex gap="xs" align="center">
            <Text size="xs" c="chatbox-error">
              Update failed
            </Text>
            <Button size="xs" variant="default" radius="md" onClick={handleCheck}>
              Retry
            </Button>
          </Flex>
          <Anchor
            size="xs"
            c="chatbox-tertiary"
            onClick={() => platform.openLink(buildChatboxUrl('/redirect_app/homepage/'))}
          >
            Download from official site
          </Anchor>
        </Stack>
      )

    case 'up-to-date':
      return (
        <Text size="xs" c="chatbox-tertiary" className="flex-shrink-0">
          Already up to date
        </Text>
      )

    default:
      return (
        <Button size="xs" variant="default" radius="md" className="flex-shrink-0" onClick={handleCheck}>
          Check Update
        </Button>
      )
  }
}

function WechatQRCode() {
  const [opened, { close, open }] = useDisclosure(false)
  return (
    <Popover position="top" withArrow shadow="md" opened={opened}>
      <Popover.Target>
        <Text onMouseEnter={open} onMouseLeave={close} c="chatbox-brand" className="cursor-pointer">
          QR Code
        </Text>
      </Popover.Target>
      <Popover.Dropdown style={{ pointerEvents: 'none' }}>
        <Image src={IMG_WECHAT_QRCODE} alt="wechat qrcode" w={160} h={160} />
      </Popover.Dropdown>
    </Popover>
  )
}

function List({ children }: { children: ReactNode }) {
  const items = Children.toArray(children)
  return (
    <Stack gap={0} className="rounded-lg bg-chatbox-background-secondary">
      {items.map((child, index) => (
        <Fragment key={`child-${index}`}>
          {child}
          {index !== items.length - 1 && <Divider />}
        </Fragment>
      ))}
    </Stack>
  )
}

function ListItem({
  icon,
  title,
  link,
  value,
  right,
}: {
  icon: ReactElement
  title: string
  link?: string
  value?: string
  right?: ReactElement
}) {
  return (
    <Flex
      px="md"
      py="sm"
      gap="xs"
      align="center"
      className={link ? 'cursor-pointer' : ''}
      onClick={() => link && platform.openLink(link)}
      c="chatbox-tertiary"
    >
      <Box w={20} h={20} className="flex-shrink-0 " c="chatbox-primary">
        {icon}
      </Box>
      <Text flex={1} size="md">
        {title}
      </Text>

      {right ? (
        right
      ) : (
        <>
          {value && (
            <Text size="md" c="chatbox-tertiary">
              {value}
            </Text>
          )}
          {link && <ScalableIcon icon={IconChevronRight} size={20} className="!text-inherit" />}
        </>
      )}
    </Flex>
  )
}

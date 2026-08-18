import { ActionIcon, Flex, Text } from '@mantine/core'
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react'
import { createFileRoute, Outlet, useCanGoBack, useNavigate, useRouter, useRouterState } from '@tanstack/react-router'
import { ScalableIcon } from '@/components/common/ScalableIcon'
import Page from '@/components/layout/Page'
import { useIsSmallScreen } from '@/hooks/useScreenChange'
import ExpandableSearch from './-components/ExpandableSearch'

export const Route = createFileRoute('/copilots')({
  component: RouteComponent,
})

export function RouteComponent() {
  const navigate = useNavigate()
  const router = useRouter()
  const routerState = useRouterState()
  const isSmallScreen = useIsSmallScreen()
  const canGoBack = useCanGoBack()

  // Get current sub-route
  const pathname = routerState.location.pathname
  const isMy = pathname.includes('/copilots/my')
  const isSearch = pathname.includes('/copilots/search')

  const getSubPageTitle = () => {
    if (isMy) return 'My Created & Added Copilots'
    if (isSearch) return 'Search'
    return null
  }

  const subPageTitle = getSubPageTitle()

  const handleRootClick = () => {
    navigate({ to: '/copilots' })
  }

  const handleSearch = (term: string) => {
    const value = term.trim()

    const isOnSearchPage = pathname.includes('/copilots/search')

    if (!value) {
      if (isOnSearchPage) {
        router.history.back()
      }
      return
    }

    navigate({
      to: '/copilots/search',
      search: {
        q: value,
      },
      ...(isOnSearchPage ? { replace: true } : {}),
    } as never)
  }

  const breadcrumbTitle = (
    <>
      <Flex align="center" gap="3xs" className="hidden md:flex flex-1">
        <Text
          size="lg"
          fw={subPageTitle ? 400 : 600}
          className={subPageTitle ? 'controls cursor-pointer hover:text-chatbox-tint-primary transition-colors' : ''}
          c={subPageTitle ? 'chatbox-secondary' : 'chatbox-primary'}
          onClick={subPageTitle ? handleRootClick : undefined}
        >
          My Copilots
        </Text>

        {subPageTitle && (
          <>
            <ScalableIcon icon={IconChevronRight} size={20} className="text-chatbox-tint-tertiary" />
            <Text size="lg" fw={600}>
              {subPageTitle}
            </Text>
          </>
        )}

        <div className="flex-1" />
      </Flex>

      {
        <Text size="lg" fw={600} className="md:hidden">
          {subPageTitle || 'My Copilots'}
        </Text>
      }
    </>
  )

  return (
    <Page
      title={breadcrumbTitle}
      left={
        isSmallScreen && canGoBack ? (
          <ActionIcon
            className="controls"
            variant="subtle"
            size={28}
            color="chatbox-secondary"
            mr="sm"
            onClick={() => router.history.back()}
          >
            <IconChevronLeft />
          </ActionIcon>
        ) : undefined
      }
      right={
        <Flex align="center" gap="xxs" className="controls">
          <ExpandableSearch onSearch={handleSearch} />
        </Flex>
      }
    >
      <Outlet />
    </Page>
  )
}

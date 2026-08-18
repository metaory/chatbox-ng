import { ActionIcon, Box, Flex, Title } from '@mantine/core'
import { IconLayoutSidebarLeftExpand, IconMenu2 } from '@tabler/icons-react'
import clsx from 'clsx'
import type { FC } from 'react'
import useNeedRoomForWinControls from '@/hooks/useNeedRoomForWinControls'
import { useIsSmallScreen } from '@/hooks/useScreenChange'
import { useUIStore } from '@/stores/uiStore'
import WindowControls from './WindowControls'

export type PageProps = {
  children?: React.ReactNode
  title: string | React.ReactNode
  left?: React.ReactNode
  right?: React.ReactNode
}

export const Page: FC<PageProps> = ({ children, title, left, right }) => {
  const showSidebar = useUIStore((s) => s.showSidebar)
  const setShowSidebar = useUIStore((s) => s.setShowSidebar)
  const isSmallScreen = useIsSmallScreen()
  const { needRoomForMacWindowControls } = useNeedRoomForWinControls()
  return (
    <div className="relative flex flex-col h-full">
      <Flex
        h={48}
        align="center"
        px="md"
        bg={isSmallScreen ? undefined : 'color-mix(in srgb, var(--chatbox-background-primary) 50%, transparent)'}
        className={clsx(
          'title-bar',
          isSmallScreen ? 'bg-chatbox-background-primary' : 'absolute inset-x-0 top-0 z-10 backdrop-blur-md border-0'
        )}
      >
        {left ||
          ((!showSidebar || isSmallScreen) && (
            <Flex align="center" className={needRoomForMacWindowControls ? 'pl-20' : ''}>
              <ActionIcon
                className="controls"
                variant="subtle"
                size={isSmallScreen ? 24 : 20}
                color={isSmallScreen ? 'chatbox-secondary' : 'chatbox-tertiary'}
                mr="xs"
                onClick={() => setShowSidebar(!showSidebar)}
              >
                {isSmallScreen ? <IconMenu2 /> : <IconLayoutSidebarLeftExpand />}
              </ActionIcon>
            </Flex>
          ))}

        <Flex align="center" gap="xxs" flex={1} {...(isSmallScreen ? { justify: 'center', px: 'sm' } : {})}>
          {typeof title === 'string' ? (
            <Title order={4} fz={!isSmallScreen ? 18 : undefined} lineClamp={1}>
              {title}
            </Title>
          ) : (
            title
          )}
        </Flex>
        {right}
        <WindowControls className="-mr-3 ml-2" />
        {isSmallScreen && !right && <Box w={28} />}
      </Flex>

      <div className={clsx('flex-1 overflow-auto', !isSmallScreen && 'pt-12')}>{children}</div>
    </div>
  )
}

export default Page

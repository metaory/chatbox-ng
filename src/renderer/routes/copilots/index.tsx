import NiceModal from '@ebay/nice-modal-react'
import { Button, Flex, Stack, Switch, Text, Title } from '@mantine/core'
import type { CopilotDetail } from '@shared/types'
import { IconChevronRight, IconPlus } from '@tabler/icons-react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { type PropsWithChildren, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScalableIcon } from '@/components/common/ScalableIcon'
import {
  useMyCopilots,
  useRemoteCopilotTags,
  useRemoteCopilotsByCursor,
} from '@/hooks/useCopilots'
import { useUIStore } from '@/stores/uiStore'
import CopilotItem from './-components/CopilotItem'

export const Route = createFileRoute('/copilots/')({
  component: Copilots,
})

const MY_PAGE_SIZE = 6
const CATALOG_PAGE_SIZE = 18

function Copilots() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const store = useMyCopilots()
  const { tags } = useRemoteCopilotTags()
  const [selectedTag, setSelectedTag] = useState<string | undefined>()
  const {
    copilots: catalogCopilots,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isCatalogLoading,
  } = useRemoteCopilotsByCursor({ limit: CATALOG_PAGE_SIZE, tag: selectedTag })
  const showCopilotsInNewSession = useUIStore((s) => s.showCopilotsInNewSession)
  const setShowCopilotsInNewSession = useUIStore((s) => s.setShowCopilotsInNewSession)

  const myCopilotsSorted = [
    ...store.copilots.filter((item) => item.starred),
    ...store.copilots.filter((item) => !item.starred),
  ]
  const myCopilotsList = myCopilotsSorted.slice(0, MY_PAGE_SIZE)
  const showMyCopilotsSeeAll = myCopilotsSorted.length > MY_PAGE_SIZE

  const handleTagChange = useCallback((tag: string | undefined) => {
    setSelectedTag((prev) => (prev === tag ? undefined : tag))
  }, [])

  const handleCreateCopilot = () => {
    void NiceModal.show('copilot-settings', {
      copilot: null,
      mode: 'create',
      onSave: (copilot: CopilotDetail) => {
        store.addOrUpdate(copilot)
      },
    })
  }

  return (
    <Stack px="sm" py="xl" gap="lg" className="max-w-7xl">
      <section>
        <Flex align="center" gap="md" justify="space-between" mb="md">
          <Flex align="center" gap="md">
            <Title order={5} c="chatbox-primary" className="font-normal">
              My Created & Added Copilots
            </Title>
            <Button
              variant="outline"
              size="compact-xs"
              px="xs"
              leftSection={<ScalableIcon icon={IconPlus} size={16} />}
              onClick={handleCreateCopilot}
              className="flex-shrink-0"
            >
              Create
            </Button>
          </Flex>
          {showMyCopilotsSeeAll && (
            <Flex
              align="center"
              gap={4}
              className="cursor-pointer text-chatbox-tint-secondary hover:text-chatbox-tint-primary transition-colors"
              onClick={() => navigate({ to: '/copilots/my' })}
            >
              <Text c="chatbox-secondary" size="xs" className="whitespace-nowrap">
                See All
              </Text>
              <ScalableIcon icon={IconChevronRight} size={12} className="text-chatbox-tint-secondary" />
            </Flex>
          )}
        </Flex>

        {myCopilotsList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myCopilotsList.map((copilot) => (
              <CopilotItem key={copilot.id} copilot={copilot} />
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <Text c="dimmed" size="sm">
              No copilots yet. Create your first one!
            </Text>
          </div>
        )}
      </section>

      <section>
        <Flex className="flex-1 mb-md" gap="xxs" wrap="wrap">
          <TagChip selected={selectedTag === undefined} onClick={() => handleTagChange(undefined)}>
            All
          </TagChip>
          {tags.map((tag) => (
            <TagChip key={tag} selected={selectedTag === tag} onClick={() => handleTagChange(tag)}>
              {t(tag)}
            </TagChip>
          ))}
        </Flex>

        {isCatalogLoading && (
          <div className="py-12 text-center">
            <Text c="dimmed" size="sm">
              Loading...
            </Text>
          </div>
        )}

        {!isCatalogLoading && catalogCopilots.length === 0 && (
          <div className="py-12 text-center">
            <Text c="dimmed" size="sm">
              No copilots available.
            </Text>
          </div>
        )}

        {catalogCopilots.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {catalogCopilots.map((copilot) => (
              <CopilotItem key={copilot.id} type="remote" copilot={copilot} />
            ))}
          </div>
        )}

        {hasNextPage && (
          <Flex justify="center" className="pt-sm">
            <Button
              variant="outline"
              color="chatbox-brand"
              size="sm"
              onClick={() => fetchNextPage()}
              loading={isFetchingNextPage}
            >
              Load More
            </Button>
          </Flex>
        )}
      </section>

      <section>
        <Title order={4} mb="md" className="text-chatbox-tint-primary">
          Settings
        </Title>
        <Switch
          checked={showCopilotsInNewSession}
          onChange={(event) => setShowCopilotsInNewSession(event.currentTarget.checked)}
          label="Show My Copilots in New Conversations"
          size="md"
        />
      </section>
    </Stack>
  )
}

function TagChip({
  selected,
  onClick,
  children,
}: PropsWithChildren & {
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        px-sm py-xxs rounded-full text-xs font-normal transition-colors cursor-pointer select-none
        ${
          selected
            ? 'border border-chatbox-tint-brand text-chatbox-tint-brand bg-transparent'
            : 'border border-transparent bg-chatbox-background-gray-secondary text-chatbox-tint-secondary'
        }
      `}
    >
      {children}
    </button>
  )
}

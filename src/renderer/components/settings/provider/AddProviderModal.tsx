import { Button, Flex, Select, Stack, Text, TextInput } from '@mantine/core'
import { ModelProviderType } from '@shared/types'
import { useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { AdaptiveSelect } from '@/components/AdaptiveSelect'
import { AdaptiveModal } from '@/components/common/AdaptiveModal'
import { useSettingsStore } from '@/stores/settingsStore'

interface AddProviderModalProps {
  opened: boolean
  onClose: () => void
}

export function AddProviderModal({ opened, onClose }: AddProviderModalProps) {
  const navigate = useNavigate()
  const setSettings = useSettingsStore((s) => s.setSettings)
  const customProviders = useSettingsStore((s) => s.customProviders)
  const [newProviderName, setNewProviderName] = useState('')
  const [newProviderMode, setNewProviderMode] = useState<ModelProviderType>(ModelProviderType.OpenAI)

  const handleAddProvider = () => {
    const pid = `custom-provider-${uuidv4()}`
    setSettings({
      customProviders: [
        ...(customProviders || []),
        {
          id: pid,
          name: newProviderName,
          type: newProviderMode,
          isCustom: true,
        },
      ],
    })
    onClose()
    navigate({
      to: '/settings/provider/$providerId',
      params: {
        providerId: pid,
      },
    })
  }

  return (
    <AdaptiveModal size="sm" opened={opened} onClose={onClose} centered title="Add provider">
      <Stack gap="xs">
        <Text>Name</Text>
        <TextInput
          value={newProviderName}
          onChange={(e) => setNewProviderName(e.currentTarget.value)}
          required
          error={!newProviderName.trim() ? 'Name is required' : ''}
        />
        <Text>API Mode</Text>
        <AdaptiveSelect
          value={newProviderMode}
          classNames={{ dropdown: 'pointer-events-auto' }}
          onChange={(value) => setNewProviderMode(value as ModelProviderType)}
          data={[
            {
              value: ModelProviderType.OpenAI,
              label: 'OpenAI API Compatible',
            },
            {
              value: ModelProviderType.OpenAIResponses,
              label: 'OpenAI Responses API Compatible',
            },
            {
              value: ModelProviderType.Claude,
              label: 'Claude API Compatible',
            },
            {
              value: ModelProviderType.Gemini,
              label: 'Google Gemini API Compatible',
            },
          ]}
        />
        <AdaptiveModal.Actions>
          <AdaptiveModal.CloseButton onClick={onClose} />
          <Button onClick={handleAddProvider} disabled={!newProviderName.trim()}>
            Add
          </Button>
        </AdaptiveModal.Actions>
      </Stack>
    </AdaptiveModal>
  )
}

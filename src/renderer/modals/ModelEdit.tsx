import NiceModal, { useModal } from '@ebay/nice-modal-react'
import { Button, Checkbox, Flex, Loader, NumberInput, Stack, Text, TextInput } from '@mantine/core'
import type { ProviderModelInfo } from '@shared/types'
import { useEffect, useState } from 'react'
import { createModelDependencies } from '@/adapters'
import { AdaptiveSelect } from '@/components/AdaptiveSelect'
import { AdaptiveModal } from '@/components/common/AdaptiveModal'
import { AppTooltip as Tooltip } from '@/components/ui/tooltip'
import platform from '@/platform'
import { settingsStore } from '@/stores/settingsStore'
import { type ModelTestState, testModelCapabilities } from '@/utils/model-tester'

const ModelEdit = NiceModal.create((props: { model?: ProviderModelInfo; providerId?: string }) => {
  const modal = useModal()

  const isNew = !props.model
  const [modelId, setModelId] = useState(props.model?.modelId || '')
  const [nickname, setNickname] = useState(props.model?.nickname || '')
  const [capabilities, setCapabilities] = useState(props.model?.capabilities || [])
  const [type, setType] = useState<ProviderModelInfo['type']>(props.model?.type || 'chat')
  const [contextWindow, setContextWindow] = useState<number | undefined>(props.model?.contextWindow)
  const [maxOutput, setMaxOutput] = useState<number | undefined>(props.model?.maxOutput)
  const [testState, setTestState] = useState<ModelTestState>({
    testing: false,
  })

  const typeOptions = [
    { value: 'chat', label: 'Chat'?.toString() ?? 'Chat' },
    { value: 'image', label: 'Image'?.toString() ?? 'Image' },
    { value: 'embedding', label: 'Embedding'?.toString() ?? 'Embedding' },
    { value: 'rerank', label: 'Rerank'?.toString() ?? 'Rerank' },
  ]

  useEffect(() => {
    setModelId(props.model?.modelId || '')
    setNickname(props.model?.nickname || '')
    setCapabilities(props.model?.capabilities || [])
    setType(props.model?.type || 'chat')
    setContextWindow(props.model?.contextWindow)
    setMaxOutput(props.model?.maxOutput)
    setTestState({ testing: false })
  }, [props])

  const handleTestModel = async () => {
    if (!modelId || !props.providerId) return

    const configs = await platform.getConfig()
    const dependencies = await createModelDependencies()

    await testModelCapabilities({
      providerId: props.providerId,
      modelId,
      settings: settingsStore.getState(),
      configs,
      dependencies,
      onStateChange: (state) => {
        setTestState(state)

        // Auto-enable capabilities based on test results
        if (state.visionTest?.status === 'success') {
          setCapabilities((prev = []) => (prev.includes('vision') ? prev : [...prev, 'vision']))
        }
        if (state.toolTest?.status === 'success') {
          setCapabilities((prev = []) => (prev.includes('tool_use') ? prev : [...prev, 'tool_use']))
        }
      },
    })
  }

  const handleCancel = () => {
    modal.resolve()
    modal.hide()
  }

  const handleSave = () => {
    modal.resolve({
      modelId,
      type,
      nickname: nickname || undefined,
      capabilities,
      contextWindow,
      maxOutput,
    })
    modal.hide()
  }

  return (
    <AdaptiveModal
      keepMounted={false}
      opened={modal.visible}
      onClose={handleCancel}
      title="Edit Model"
      centered={true}
      w={456}
    >
      <Stack gap="md">
        {/* Model ID & NickName */}
        <Stack gap="xs">
          <Flex align="center" gap="lg">
            <Stack gap={0}>
              <Text>Model ID</Text>
              <Text className="select-none h-0 overflow-hidden opacity-0">Nickname</Text>
            </Stack>
            <TextInput disabled={!isNew} flex={1} value={modelId} onChange={(e) => setModelId(e.currentTarget.value)} />
          </Flex>
          <Flex align="center" gap="lg">
            <Stack gap={0}>
              <Text className="select-none h-0 overflow-hidden opacity-0">Model ID</Text>
              <Text>Nickname</Text>
            </Stack>
            <TextInput
              placeholder={'optional'}
              flex={1}
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </Flex>
        </Stack>

        {/* Model Type */}
        <Stack gap="xs">
          <Text fw="600">Model Type</Text>
          <AdaptiveSelect
            classNames={{ dropdown: 'pointer-events-auto' }}
            comboboxProps={{ withinPortal: false }}
            allowDeselect={false}
            styles={{
              label: {
                fontWeight: 400,
              },
            }}
            data={typeOptions}
            value={type}
            onChange={(v) => setType(v as ProviderModelInfo['type'])}
          />
        </Stack>

        {/* Capabilities */}
        {type === 'chat' && (
          <Stack gap="xs">
            <Text fw="600">Capabilities</Text>
            <Flex align="center" gap="md">
              <Checkbox
                flex={1}
                label="Vision"
                checked={capabilities?.includes('vision')}
                onChange={(e) => {
                  const checked = e.currentTarget.checked
                  if (checked) {
                    setCapabilities([...(capabilities || []), 'vision'])
                  } else {
                    setCapabilities([...(capabilities?.filter((c) => c !== 'vision') || [])])
                  }
                }}
              />
              <Checkbox
                flex={1}
                label="Reasoning"
                checked={capabilities?.includes('reasoning')}
                onChange={(e) => {
                  const checked = e.currentTarget.checked
                  if (checked) {
                    setCapabilities([...(capabilities || []), 'reasoning'])
                  } else {
                    setCapabilities([...(capabilities?.filter((c) => c !== 'reasoning') || [])])
                  }
                }}
              />
              <Checkbox
                flex={1}
                label="Tool use"
                checked={capabilities?.includes('tool_use')}
                onChange={(e) => {
                  const checked = e.currentTarget.checked
                  if (checked) {
                    setCapabilities([...(capabilities || []), 'tool_use'])
                  } else {
                    setCapabilities([...(capabilities?.filter((c) => c !== 'tool_use') || [])])
                  }
                }}
              />
            </Flex>
          </Stack>
        )}

        {/* Context Window and Max Output */}
        <Stack gap="xs">
          <Text fw="600">Advanced Settings</Text>
          <Flex gap="md">
            <Stack gap="xs" flex={1}>
              <Text size="sm">Context Window</Text>
              <NumberInput
                placeholder={'e.g. 128000'}
                value={contextWindow}
                onChange={(value) => setContextWindow(typeof value === 'number' ? value : undefined)}
                min={1}
                max={10_000_000}
                step={1000}
                thousandSeparator=","
                clampBehavior="strict"
              />
            </Stack>
            <Stack gap="xs" flex={1}>
              <Text size="sm">Max Output Tokens</Text>
              <NumberInput
                placeholder={'e.g. 4096'}
                value={maxOutput}
                onChange={(value) => setMaxOutput(typeof value === 'number' ? value : undefined)}
                min={1}
                max={1_000_000}
                step={100}
                thousandSeparator=","
                clampBehavior="strict"
              />
            </Stack>
          </Flex>
        </Stack>

        <AdaptiveModal.Actions>
          {testState.basicTest?.status === 'success' ? (
            <Text c="chatbox-success" className="text-center">
              Test successful
            </Text>
          ) : testState.basicTest?.status === 'error' ? (
            <Tooltip label={testState.basicTest.error} multiline maw={300}>
              <Text c="chatbox-error" style={{ cursor: 'help' }} className="text-center">
                Test failed
              </Text>
            </Tooltip>
          ) : null}
          <AdaptiveModal.CloseButton onClick={handleCancel} />
          <Button variant="light" onClick={handleTestModel}>
            {testState.testing ? <Loader size="xs" /> : 'Test Model'}
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </AdaptiveModal.Actions>
      </Stack>
    </AdaptiveModal>
  )
})

export default ModelEdit

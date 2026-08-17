import { Button, Flex, PasswordInput, Stack, Text, Title } from '@mantine/core'
import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ensureVibedropKey, mintClaimUrl, VIBEDROP_MANAGE_URL } from '@/packages/vibedrop'
import platform from '@/platform'
import { useSettingsStore } from '@/stores/settingsStore'

export const Route = createFileRoute('/settings/publish')({
  component: RouteComponent,
})

export function RouteComponent() {
  const { t } = useTranslation()
  const vibedropApiKey = useSettingsStore((s) => s.vibedropApiKey)
  const setSettings = useSettingsStore((s) => s.setSettings)
  const [claimUrl, setClaimUrl] = useState('')
  const [claimError, setClaimError] = useState('')
  const [claiming, setClaiming] = useState(false)

  const onClaim = async () => {
    setClaiming(true)
    setClaimError('')
    try {
      const key = await ensureVibedropKey()
      setClaimUrl(await mintClaimUrl(key))
    } catch (e) {
      setClaimError((e as Error).message || t('Publish failed'))
    } finally {
      setClaiming(false)
    }
  }

  return (
    <Stack p="md" gap="md">
      <Title order={5}>{t('Publish')}</Title>
      <Text size="sm" c="dimmed">
        Currently Anonymous unless you paste a key.
        <br />
        Own keys keep pages you can manage at{' '}
        <a
          href={VIBEDROP_MANAGE_URL}
          onClick={(e) => {
            e.preventDefault()
            void platform.openLink(VIBEDROP_MANAGE_URL)
          }}
          className="underline"
        >
          app.vibedrop.cc
        </a>
      </Text>
      <Stack gap="xs">
        <Text fw="600">{t('VibeDrop API Key')}</Text>
        <PasswordInput
          maw={400}
          value={vibedropApiKey || ''}
          onChange={(e) => setSettings({ vibedropApiKey: e.currentTarget.value || undefined })}
          placeholder="vd_..."
        />
      </Stack>
      <Flex gap="xs" wrap="wrap">
        <Button variant="light" onClick={() => platform.openLink(VIBEDROP_MANAGE_URL)}>
          {t('Manage sites')}
        </Button>
        <Button variant="light" loading={claiming} onClick={onClaim}>
          {t('Get claim link')}
        </Button>
      </Flex>
      {claimUrl && (
        <Text size="sm">
          <a href={claimUrl} target="_blank" rel="noopener noreferrer" className="underline">
            {t('Claim this site')}
          </a>
          {' · '}
          {t('This claim link expires in 1 hour.')}
        </Text>
      )}
      {claimError && (
        <Text size="sm" c="red">
          {claimError}
        </Text>
      )}
    </Stack>
  )
}

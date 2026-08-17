import {
  Alert,
  Badge,
  Button,
  Checkbox,
  Divider,
  FileButton,
  Flex,
  Radio,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
} from '@mantine/core'
import {
  colorPresetLabel,
  getDefaultInterfaceColors,
  INTERFACE_COLOR_PRESETS,
  type InterfaceColorPreset,
  type InterfaceColors,
  type InterfaceThemeColors,
  isInterfaceBrandColorAllowed,
  paletteKey,
  resolveInterfaceBrandColors,
  withColorOpacity,
} from '@shared/theme-colors'
import { Theme } from '@shared/types'
import { formatFileSize } from '@shared/utils'
import { getBackupFilename } from '@shared/utils/backup'
import { IconDeviceFloppy, IconInfoCircle, IconPlus } from '@tabler/icons-react'
import { createFileRoute } from '@tanstack/react-router'
import dayjs from 'dayjs'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AdaptiveSelect } from '@/components/AdaptiveSelect'
import { InterfaceColorInput } from '@/components/common/InterfaceColorInput'
import LazySlider from '@/components/common/LazySlider'
import {
  type BackupExportItem,
  type BackupProgress,
  type BackupWarning,
  exportBackupArchive,
  importBackupArchive,
  importLegacyJsonBackup,
  isZipBackupFile,
  rehydrateImportedSession,
} from '@/packages/backup'
import platform from '@/platform'
import { canShareFile, shareFile } from '@/platform/web_file_share'
import storage from '@/storage'
import { getMetaStorage, recoverSessionList } from '@/stores/chatStore'
import { migrateOnData } from '@/stores/migration'
import { useSettingsStore } from '@/stores/settingsStore'
import { useUIStore } from '@/stores/uiStore'

export const Route = createFileRoute('/settings/general')({
  component: RouteComponent,
})

const presetBadgeButtonClassName =
  'transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.97] motion-reduce:transform-none motion-reduce:transition-none'

export function RouteComponent() {
  const { t } = useTranslation()
  const { setSettings, ...settings } = useSettingsStore((state) => state)
  const realTheme = useUIStore((state) => state.realTheme)
  const liveInterfaceColors = resolveInterfaceBrandColors(settings.interfaceColors ?? getDefaultInterfaceColors())
  const currentInterfaceColors = liveInterfaceColors[realTheme]
  const [isCreatingInterfaceColorPreset, setIsCreatingInterfaceColorPreset] = useState(false)
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null)
  const [presetLabel, setPresetLabel] = useState('')

  const updateCurrentInterfaceColors = (updater: (colors: InterfaceThemeColors) => InterfaceThemeColors) => {
    setSettings((draft) => {
      draft.interfaceColors ??= getDefaultInterfaceColors()
      draft.interfaceColors[realTheme] = updater(draft.interfaceColors[realTheme])
    })
  }

  const setInterfaceColor = (key: keyof InterfaceThemeColors, value: string) => {
    updateCurrentInterfaceColors((colors) => ({ ...colors, [key]: value }))
  }

  const resetInterfaceColors = () => {
    updateCurrentInterfaceColors(() => getDefaultInterfaceColors()[realTheme])
  }

  const applyInterfaceColorPreset = (colors: InterfaceColors) => {
    setSettings((draft) => {
      draft.interfaceColors = resolveInterfaceBrandColors(colors)
    })
  }

  const saveInterfaceColorPreset = () => {
    const label = presetLabel.trim()
    if (!label) return

    setSettings((draft) => {
      const currentColors = resolveInterfaceBrandColors(draft.interfaceColors ?? getDefaultInterfaceColors())
      draft.interfaceColorPresets ??= []
      draft.interfaceColorPresets.push({
        id: crypto.randomUUID(),
        label,
        colors: {
          light: { ...currentColors.light },
          dark: { ...currentColors.dark },
        },
      })
    })
    setIsCreatingInterfaceColorPreset(false)
    setPresetLabel('')
  }

  const deleteInterfaceColorPreset = (presetId: string) => {
    setSettings((draft) => {
      draft.interfaceColorPresets = (draft.interfaceColorPresets ?? []).filter((preset) => preset.id !== presetId)
      draft.interfaceColors = resolveInterfaceBrandColors(getDefaultInterfaceColors())
    })
    if (editingPresetId === presetId) cancelEditingInterfaceColorPreset()
  }

  const startEditingInterfaceColorPreset = (preset: InterfaceColorPreset) => {
    applyInterfaceColorPreset(preset.colors)
    setIsCreatingInterfaceColorPreset(false)
    setEditingPresetId(preset.id)
    setPresetLabel(colorPresetLabel(preset))
  }

  const cancelEditingInterfaceColorPreset = () => {
    setEditingPresetId(null)
    setPresetLabel('')
  }

  const saveEditedInterfaceColorPreset = () => {
    const label = presetLabel.trim()
    if (!editingPresetId || !label) return

    setSettings((draft) => {
      const colors = resolveInterfaceBrandColors(draft.interfaceColors ?? getDefaultInterfaceColors())
      draft.interfaceColorPresets = (draft.interfaceColorPresets ?? []).map((preset) =>
        preset.id === editingPresetId
          ? {
              ...preset,
              label,
              colors: {
                light: { ...colors.light },
                dark: { ...colors.dark },
              },
            }
          : preset
      )
    })
    cancelEditingInterfaceColorPreset()
  }

  const colorPresets = [
    ...INTERFACE_COLOR_PRESETS.map((preset) => ({
      ...preset,
      colors: resolveInterfaceBrandColors(preset.colors),
      isCustom: false,
    })),
    ...(settings.interfaceColorPresets ?? []).map((preset) => ({
      ...preset,
      colors: resolveInterfaceBrandColors(preset.colors),
      isCustom: true,
    })),
  ] satisfies Array<InterfaceColorPreset & { isCustom: boolean }>
  const livePaletteKey = paletteKey(liveInterfaceColors)
  const activePresetId = colorPresets.find((preset) => paletteKey(preset.colors) === livePaletteKey)?.id

  return (
    <Stack p="md" gap="xl">
      <Title order={5}>General Settings</Title>

      {/* Display Settings */}
      <Stack gap="lg" maw={720}>
        <Title order={5}>Display Settings</Title>

        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          <AdaptiveSelect
            comboboxProps={{ withinPortal: true, withArrow: true }}
            label="Theme"
            styles={{
              label: {
                fontWeight: 400,
              },
            }}
            data={[
              { value: `${Theme.System}`, label: 'Follow System' },
              { value: `${Theme.Light}`, label: 'Light Mode' },
              { value: `${Theme.Dark}`, label: 'Dark Mode' },
            ]}
            value={`${settings.theme}`}
            onChange={(val) => {
              if (val) {
                setSettings({
                  theme: parseInt(val),
                })
              }
            }}
          />
        </SimpleGrid>

        <Stack gap="md">
          <Stack gap="xxs">
            <Text size="sm">Color Presets</Text>
            <Flex gap="sm" wrap="wrap">
              {colorPresets.map((preset) => {
                const brand = preset.colors[realTheme].brand
                const selected = preset.id === activePresetId
                return (
                  <Badge
                    key={preset.id}
                    component="button"
                    type="button"
                    className={presetBadgeButtonClassName}
                    variant="filled"
                    style={{
                      backgroundColor: withColorOpacity(brand, 0.6),
                      cursor: 'pointer',
                      height: 30,
                      maxWidth: 160,
                      ...(selected && {
                        outline: `4px solid ${withColorOpacity(brand, 0.4)}`,
                      }),
                    }}
                    onClick={() => {
                      if (preset.isCustom) {
                        startEditingInterfaceColorPreset(preset)
                        return
                      }
                      applyInterfaceColorPreset(preset.colors)
                      cancelEditingInterfaceColorPreset()
                      setIsCreatingInterfaceColorPreset(false)
                    }}
                  >
                    {preset.isCustom ? colorPresetLabel(preset) : t(colorPresetLabel(preset))}
                  </Badge>
                )
              })}
              {!isCreatingInterfaceColorPreset && (
                <Badge
                  component="button"
                  type="button"
                  className={presetBadgeButtonClassName}
                  circle
                  variant="outline"
                  aria-label="New Preset"
                  style={{ cursor: 'pointer', height: 30, width: 30 }}
                  styles={{ label: { display: 'flex', width: '100%', justifyContent: 'center' } }}
                  onClick={() => {
                    cancelEditingInterfaceColorPreset()
                    setPresetLabel(`Custom Preset ${(settings.interfaceColorPresets?.length ?? 0) + 1}`)
                    setIsCreatingInterfaceColorPreset(true)
                  }}
                >
                  <IconPlus size={14} />
                </Badge>
              )}
            </Flex>
          </Stack>
          {(isCreatingInterfaceColorPreset || editingPresetId) && (
            <Stack gap="md">
              <TextInput
                autoFocus
                label="Name"
                value={presetLabel}
                onChange={(event) => setPresetLabel(event.currentTarget.value)}
              />
              <SimpleGrid cols={2} spacing="md">
                <Stack gap="md">
                  <InterfaceColorInput
                    label="Primary Background"
                    value={currentInterfaceColors.backgroundPrimary}
                    onCommit={(value) => setInterfaceColor('backgroundPrimary', value)}
                  />
                  <InterfaceColorInput
                    label="Secondary Background"
                    value={currentInterfaceColors.backgroundSecondary}
                    onCommit={(value) => setInterfaceColor('backgroundSecondary', value)}
                  />
                </Stack>
                <Stack gap="md">
                  <InterfaceColorInput
                    label="Tertiary Background"
                    value={currentInterfaceColors.backgroundTertiary}
                    onCommit={(value) => setInterfaceColor('backgroundTertiary', value)}
                  />
                  <InterfaceColorInput
                    label="Brand Color"
                    value={currentInterfaceColors.brand}
                    isColorAllowed={isInterfaceBrandColorAllowed}
                    onCommit={(value) => setInterfaceColor('brand', value)}
                  />
                </Stack>
              </SimpleGrid>
              <SimpleGrid cols={2} spacing="md">
                {editingPresetId ? (
                  <Button variant="outline" color="red" onClick={() => deleteInterfaceColorPreset(editingPresetId)}>
                    Remove
                  </Button>
                ) : (
                  <Button variant="outline" onClick={resetInterfaceColors}>
                    Reset Colors
                  </Button>
                )}
                <Button
                  leftSection={<IconDeviceFloppy size={14} />}
                  disabled={!presetLabel.trim()}
                  onClick={editingPresetId ? saveEditedInterfaceColorPreset : saveInterfaceColorPreset}
                >
                  {editingPresetId ? 'Save' : 'Save Preset'}
                </Button>
              </SimpleGrid>
            </Stack>
          )}
        </Stack>

        {/* Font Size */}
        <Stack>
          <Text>Font Size</Text>
          <LazySlider
            step={1}
            min={10}
            max={22}
            maw={720}
            marks={[
              {
                value: 14,
              },
            ]}
            value={settings.fontSize}
            onChange={(val) =>
              setSettings({
                fontSize: val,
              })
            }
          />
        </Stack>

        {/* Startup Page */}
        <Stack>
          <Text>Startup Page</Text>
          <Radio.Group
            value={settings.startupPage}
            defaultValue="home"
            onChange={(val) => {
              if (val === 'home' || val === 'session') setSettings({ startupPage: val })
            }}
          >
            <Flex gap="md">
              <Radio label="Home Page" value="home" />
              <Radio label="Last Session" value="session" />
            </Flex>
          </Radio.Group>
        </Stack>
      </Stack>

      <Divider />

      {/* Network Proxy */}
      <Stack gap="xs">
        <Title order={5}>Network Proxy</Title>
        <TextInput
          maw={320}
          placeholder="socks5://127.0.0.1:6153"
          value={settings.proxy}
          onChange={(e) =>
            setSettings({
              proxy: e.currentTarget.value,
            })
          }
        />
      </Stack>

      <Divider />

      {/* Data Recovery */}
      <DataRecoverySection />

      <Divider />

      {/* import and export data */}
      <ImportExportDataSection />

      <Divider />

      {/* Export Logs */}
      <ExportLogsSection />

      {/* others */}
      {platform.type === 'desktop' && (
        <>
          <Divider />

          <Stack gap="xl">
            <Switch
              label="Launch at system startup"
              checked={settings.autoLaunch}
              onChange={(e) =>
                setSettings({
                  autoLaunch: e.currentTarget.checked,
                })
              }
            />
            <Switch
              label="Automatic updates"
              checked={settings.autoUpdate}
              onChange={(e) =>
                setSettings({
                  autoUpdate: e.currentTarget.checked,
                })
              }
            />
            <Switch
              label="Beta updates"
              checked={settings.betaUpdate}
              onChange={(e) =>
                setSettings({
                  betaUpdate: e.currentTarget.checked,
                })
              }
            />
          </Stack>
        </>
      )}
    </Stack>
  )
}

const DataRecoverySection = () => {
  const { t } = useTranslation()
  const [isRecovering, setIsRecovering] = useState(false)
  const [recoveryResult, setRecoveryResult] = useState<{
    success: boolean
    recovered?: number
    failed?: number
    error?: string
  } | null>(null)

  const handleRecover = async () => {
    setIsRecovering(true)
    setRecoveryResult(null)
    try {
      const result = await recoverSessionList()
      setRecoveryResult({ success: true, recovered: result.recovered, failed: result.failed })
    } catch (error) {
      console.error('Failed to recover session list:', error)
      setRecoveryResult({ success: false, error: String(error) })
    } finally {
      setIsRecovering(false)
    }
  }

  const hasPartialFailure = recoveryResult?.success && recoveryResult.failed && recoveryResult.failed > 0

  return (
    <Stack gap="md">
      <Stack gap="xxs">
        <Title order={5}>Data Recovery</Title>
        <Text c="chatbox-tertiary">
          If conversations are missing from the list, use this feature to scan and recover them from storage
        </Text>
      </Stack>
      <Button className="self-start" onClick={handleRecover} disabled={isRecovering} loading={isRecovering}>
        {isRecovering ? 'Recovering...' : 'Recover Conversation List'}
      </Button>
      {recoveryResult && (
        <Alert
          className="self-start"
          variant="light"
          color={recoveryResult.success ? (hasPartialFailure ? 'yellow' : 'green') : 'red'}
          title={
            recoveryResult.success
              ? t('Recovered {{count}} conversations', { count: recoveryResult.recovered })
              : 'Recovery failed'
          }
          icon={<IconInfoCircle />}
        >
          {recoveryResult.success ? (
            <Stack gap="xs">
              <Text size="sm">The conversation list has been successfully recovered</Text>
              {hasPartialFailure && (
                <Text size="sm" c="orange">
                  {t('{{count}} conversations could not be recovered due to data read errors', {
                    count: recoveryResult.failed,
                  })}
                </Text>
              )}
            </Stack>
          ) : (
            <Text size="sm">{recoveryResult.error || 'Unknown error'}</Text>
          )}
        </Alert>
      )}
    </Stack>
  )
}

const ImportExportDataSection = () => {
  const { t } = useTranslation()

  const formatBackupWarning = (warning: BackupWarning) => {
    switch (warning.code) {
      case 'session-read-failed':
        return 'Conversation data could not be read and was not included.'
      case 'resource-read-failed':
        return 'Managed attachment or image data could not be read and was not included.'
      case 'external-resource-skipped':
        return 'The original external file is not managed by Chatbox and was not included.'
      case 'rag-rebuild-failed':
        return 'The attachment search index could not be restored.'
    }
  }

  const formatBackupProgressPhase = (phase: BackupProgress['phase']) => {
    switch (phase) {
      case 'preparing':
        return 'Preparing backup'
      case 'sessions':
        return 'Exporting conversations'
      case 'resources':
        return 'Exporting attachments'
      case 'packing':
        return 'Creating backup archive'
      case 'reading':
        return 'Reading backup'
      case 'validating':
        return 'Validating backup'
      case 'restoring':
        return 'Restoring data'
    }
  }

  const [importTips, setImportTips] = useState('')
  const [importDetails, setImportDetails] = useState('')
  const [importRequiresRestart, setImportRequiresRestart] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState<BackupProgress | null>(null)
  const [exportNotice, setExportNotice] = useState<{
    color: 'green' | 'yellow' | 'red'
    title: string
    body?: string
  }>()
  const [pendingDownload, setPendingDownload] = useState<{ filename: string; blob: Blob }>()
  const [pendingDownloadUrl, setPendingDownloadUrl] = useState<string>()
  const operationAbortRef = useRef<AbortController | null>(null)
  const [exportItems, setExportItems] = useState<ExportDataItem[]>([
    ExportDataItem.Setting,
    ExportDataItem.Conversations,
    ExportDataItem.Copilot,
  ])

  const isLoading = isExporting || isImporting || importRequiresRestart
  const pendingDownloadFile = useMemo(
    () =>
      pendingDownload
        ? new File([pendingDownload.blob], pendingDownload.filename, {
            type: pendingDownload.blob.type,
          })
        : undefined,
    [pendingDownload]
  )
  const canSharePendingDownload = useMemo(() => {
    return pendingDownloadFile ? canShareFile(pendingDownloadFile) : false
  }, [pendingDownloadFile])

  useEffect(() => {
    if (!pendingDownload) {
      setPendingDownloadUrl(undefined)
      return
    }

    const url = URL.createObjectURL(pendingDownload.blob)
    setPendingDownloadUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [pendingDownload])

  const onSharePendingDownload = async () => {
    if (!pendingDownloadFile || !canSharePendingDownload) return
    try {
      await shareFile(pendingDownloadFile)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return
      console.error('Failed to share backup:', error)
    }
  }

  const onExport = async () => {
    if (isLoading) return

    const abortController = new AbortController()
    operationAbortRef.current = abortController
    setIsExporting(true)
    setProgress(null)
    setExportNotice(undefined)
    setPendingDownload(undefined)
    try {
      const date = new Date()
      const result = await exportBackupArchive({
        exportItems: exportItems.map((item) => item as BackupExportItem),
        includeKeys: exportItems.includes(ExportDataItem.Key),
        exportedAt: date,
        storage,
        metaStorage: getMetaStorage(),
        application: { version: platform.getVersion(), platform: platform.getPlatform() },
        signal: abortController.signal,
        onProgress: setProgress,
        writeArchive: (dataCallback) =>
          platform.exporter.exportStreamingFile(
            getBackupFilename(date),
            dataCallback,
            'application/zip',
            abortController.signal
          ),
      })
      const warningCount = result.manifest.warnings.length
      const warningSummary = result.manifest.warnings
        .slice(0, 3)
        .map((warning) => `${warning.itemId ? `${warning.itemId}: ` : ''}${formatBackupWarning(warning)}`)
        .join('\n')
      setPendingDownload(result.pendingDownload)
      const warningBody = [
        warningCount > 0
          ? String(
              t('{{count}} item(s) could not be included. See manifest.json in the backup for details.', {
                count: warningCount,
              })
            )
          : '',
        warningSummary,
        result.pendingDownload
          ? "Your backup was created in memory. Select Download, then confirm it appears in your browser's downloads."
          : !result.boundedMemory
          ? 'This browser does not support streaming downloads, so the backup was buffered before saving.'
          : '',
      ]
        .filter(Boolean)
        .join('\n')
      setExportNotice(
        result.pendingDownload
          ? {
              color: warningCount > 0 ? 'yellow' : 'green',
              title: 'Backup ready to download',
              body: warningBody,
            }
          : warningCount > 0 || !result.boundedMemory
          ? {
              color: 'yellow',
              title: 'Backup exported with warnings',
              body: warningBody,
            }
          : { color: 'green', title: 'Backup exported successfully' }
      )
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        setExportNotice({ color: 'yellow', title: 'Export canceled' })
      } else {
        console.error('Export failed:', error)
        setExportNotice({ color: 'red', title: 'Export failed', body: String(error) })
      }
    } finally {
      operationAbortRef.current = null
      setIsExporting(false)
      setProgress(null)
    }
  }

  const onImport = async (file: File | null) => {
    if (isLoading || !file) return
    const abortController = new AbortController()
    operationAbortRef.current = abortController
    setIsImporting(true)
    setImportTips('')
    setImportDetails('')
    setImportRequiresRestart(false)
    setProgress(null)
    try {
      if (await isZipBackupFile(file)) {
        const result = await importBackupArchive(file, {
          storage,
          metaStorage: await getMetaStorage(),
          signal: abortController.signal,
          onProgress: setProgress,
          rehydrateSession: rehydrateImportedSession,
        })
        if (result.warnings.length > 0) {
          const warningSummary = result.warnings
            .slice(0, 3)
            .map((warning) => `${warning.itemId ? `${warning.itemId}: ` : ''}${formatBackupWarning(warning)}`)
            .join('\n')
          setImportTips(
            String(
              t(
                'Backup restore is almost complete, with {{count}} warning(s). Select Continue to restart Chatbox and finish restoring.',
                {
                  count: result.warnings.length,
                }
              )
            )
          )
          setImportDetails(warningSummary)
          setImportRequiresRestart(true)
          return
        }
      } else {
        await importLegacyJsonBackup(file, {
          storage,
          metaStorage: await getMetaStorage(),
          migrateData: (dataStore) => migrateOnData(dataStore, false),
          recoverSessionList: async () => {
            await recoverSessionList()
          },
        })
      }
      await platform.relaunch()
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') setImportTips('Import canceled')
      else {
        console.error('Import failed:', error)
        setImportTips(
          String(
            t('Import failed: {{error}}', {
              error: error instanceof Error ? error.message : 'Unsupported or damaged backup',
            })
          )
        )
      }
    } finally {
      operationAbortRef.current = null
      setIsImporting(false)
      setProgress(null)
    }
  }

  const cancelOperation = () => {
    operationAbortRef.current?.abort(new DOMException('Operation canceled', 'AbortError'))
  }

  const [showStorageInfo, setShowStorageInfo] = useState(false)
  const [storagePersisted, setStoragePersisted] = useState<boolean>()
  const [storageEstimate, setStorageEstimate] = useState<StorageEstimate>()
  const storageInfo = useMemo(
    () =>
      `Storage persisted: ${storagePersisted}; Storage Estimate: { quota: ${formatFileSize(
        storageEstimate?.quota || 0
      )}, usage: ${formatFileSize(storageEstimate?.usage || 0)} }`,
    [storagePersisted, storageEstimate]
  )
  useEffect(() => {
    if (window?.navigator?.storage) {
      window.navigator.storage.estimate?.().then((res) => setStorageEstimate(res))
      window.navigator.storage.persisted?.().then((p) => setStoragePersisted(p))
    }
  }, [])

  return (
    <>
      <Stack gap="md">
        <Title order={5} onDoubleClick={() => setShowStorageInfo(true)}>
          Data Backup
        </Title>
        {showStorageInfo && (
          <Text size="xs" c="chatbox-tertiary">
            {storageInfo}
          </Text>
        )}
        <Text c="chatbox-tertiary">ZIP backups include each conversation and its managed images and attachments.</Text>
        <Text size="sm" c="chatbox-tertiary">
          Backup files exported here can only be imported in Chatbox 1.22 or later.
        </Text>
        {[
          { label: 'Settings', value: ExportDataItem.Setting },
          { label: 'API KEY & License', value: ExportDataItem.Key },
          { label: 'Chat History', value: ExportDataItem.Conversations },
          { label: 'My Copilots', value: ExportDataItem.Copilot },
        ].map(({ label, value }) => (
          <Checkbox
            key={value}
            checked={exportItems.includes(value)}
            label={label}
            disabled={isLoading}
            onChange={(e) => {
              const checked = e.currentTarget.checked
              if (checked && !exportItems.includes(value)) {
                setExportItems([...exportItems, value])
              } else if (!checked) {
                setExportItems(exportItems.filter((v) => v !== value))
              }
            }}
          />
        ))}
        <Flex gap="sm">
          <Button className="self-start" onClick={onExport} disabled={isLoading} loading={isExporting}>
            {isExporting ? 'Exporting...' : 'Export Selected Data'}
          </Button>
          {isExporting && (
            <Button variant="light" color="chatbox-gray" onClick={cancelOperation}>
              Cancel
            </Button>
          )}
        </Flex>
        {progress && (
          <Text size="sm" c="chatbox-tertiary">
            {t('{{phase}}: {{current}} / {{total}}', {
              phase: formatBackupProgressPhase(progress.phase),
              current: progress.current,
              total: progress.total,
            })}
            {progress.label ? ` · ${progress.label}` : ''}
          </Text>
        )}
        {exportNotice && (
          <Alert
            className="self-start"
            variant="light"
            color={exportNotice.color}
            title={exportNotice.title}
            icon={<IconInfoCircle />}
          >
            {exportNotice.body && (
              <Text size="sm" style={{ whiteSpace: 'pre-line' }}>
                {exportNotice.body}
              </Text>
            )}
            {pendingDownload && pendingDownloadUrl && (
              <Flex gap="sm" mt="sm">
                {canSharePendingDownload && <Button onClick={onSharePendingDownload}>Save</Button>}
                <Button
                  component="a"
                  variant={canSharePendingDownload ? 'light' : 'filled'}
                  href={pendingDownloadUrl}
                  download={pendingDownload.filename}
                >
                  Download
                </Button>
              </Flex>
            )}
          </Alert>
        )}
      </Stack>

      <Divider />

      <Stack gap="lg">
        <Stack gap="xxs">
          <Title order={5}>Data Restore</Title>
          <Text c="chatbox-tertiary">
            Upon import, changes will take effect immediately and existing data will be overwritten
          </Text>
        </Stack>
        {importTips && (
          <Alert className=" self-start" variant="light" color="yellow" title={importTips} icon={<IconInfoCircle />}>
            {importDetails && (
              <Text size="sm" style={{ whiteSpace: 'pre-line' }}>
                {importDetails}
              </Text>
            )}
            {importRequiresRestart && (
              <Button mt="sm" variant="light" onClick={() => platform.relaunch()}>
                Continue
              </Button>
            )}
          </Alert>
        )}
        <FileButton accept=".zip,.json,application/zip,application/json" onChange={onImport} disabled={isLoading}>
          {(props) => (
            <Flex gap="sm">
              <Button {...props} className="self-start" disabled={isLoading} loading={isImporting}>
                {isImporting ? 'Importing...' : 'Import and Restore'}
              </Button>
              {isImporting && (
                <Button variant="light" color="chatbox-gray" onClick={cancelOperation}>
                  Cancel
                </Button>
              )}
            </Flex>
          )}
        </FileButton>
      </Stack>
    </>
  )
}

enum ExportDataItem {
  Setting = 'setting',
  Key = 'key',
  Conversations = 'conversations',
  Copilot = 'copilot',
}

const ExportLogsSection = () => {
  const [isExporting, setIsExporting] = useState(false)
  const [exportResult, setExportResult] = useState<{
    success: boolean
    error?: string
  } | null>(null)

  const handleExportLogs = async () => {
    setIsExporting(true)
    setExportResult(null)
    try {
      const logs = await platform.exportLogs()
      if (!logs || logs.trim() === '') {
        setExportResult({ success: true })
        return
      }

      const date = new Date()
      const dateStr = dayjs(date).format('YYYY-M-D_H-m')
      await platform.exporter.exportTextFile(`chatbox-logs-${dateStr}.txt`, logs)
      setExportResult({ success: true })
    } catch (error) {
      console.error('Failed to export logs:', error)
      setExportResult({ success: false, error: String(error) })
    } finally {
      setIsExporting(false)
    }
  }

  const _handleClearLogs = async () => {
    try {
      await platform.clearLogs()
      setExportResult({ success: true })
    } catch (error) {
      console.error('Failed to clear logs:', error)
    }
  }

  return (
    <Stack gap="md">
      <Stack gap="xxs">
        <Title order={5}>Diagnostic Logs</Title>
        <Text c="chatbox-tertiary">
          Export application logs for troubleshooting. These logs may be requested by support to help diagnose issues.
        </Text>
      </Stack>
      <Flex gap="md">
        <Button variant="filled" onClick={handleExportLogs} disabled={isExporting} loading={isExporting}>
          {isExporting ? 'Exporting...' : 'Export Logs'}
        </Button>
        {/* <Button variant="subtle" color="red" onClick={handleClearLogs} disabled={isExporting}>
          {t('Clear Logs')}
        </Button> */}
      </Flex>
      {exportResult && !exportResult.success && (
        <Alert className="self-start" variant="light" color="red" title="Export failed" icon={<IconInfoCircle />}>
          <Text size="sm">{exportResult.error || 'Unknown error'}</Text>
        </Alert>
      )}
    </Stack>
  )
}

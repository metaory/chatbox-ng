import type { ModelProviderEnum, ProviderInfo, ProviderSettings } from '@shared/types'
import { useCallback, useState } from 'react'
import { parseProviderFromJson } from '@/utils/provider-config'

export function useProviderImport(providers: ProviderInfo[]) {
  const [importModalOpened, setImportModalOpened] = useState(false)
  const [importedConfig, setImportedConfig] = useState<
    ProviderInfo | (ProviderSettings & { id: ModelProviderEnum }) | null
  >(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [existingProvider, setExistingProvider] = useState<ProviderInfo | null>(null)

  const checkExistingProvider = useCallback(
    (providerId: string) => {
      const existing = providers.find((p) => p.id === providerId)
      if (existing) {
        setExistingProvider(existing)
      } else {
        setExistingProvider(null)
      }
    },
    [providers]
  )

  const handleClipboardImport = async () => {
    try {
      setIsImporting(true)
      setImportError(null)

      const text = await navigator.clipboard.readText()
      const config = parseProviderFromJson(text)

      if (!config) {
        setImportError('Invalid provider configuration format')
        return
      }

      // Check if provider already exists
      checkExistingProvider(config.id)

      setImportedConfig(config)
      setImportModalOpened(true)
    } catch (err) {
      console.error('Clipboard import failed:', err)
      setImportError('Failed to read from clipboard')
    } finally {
      setIsImporting(false)
    }
  }

  const handleCancelImport = () => {
    setImportModalOpened(false)
    setImportedConfig(null)
    setImportError(null)
    setExistingProvider(null)
  }

  return {
    importModalOpened,
    setImportModalOpened,
    importedConfig,
    setImportedConfig,
    importError,
    setImportError,
    isImporting,
    existingProvider,
    checkExistingProvider,
    handleClipboardImport,
    handleCancelImport,
  }
}

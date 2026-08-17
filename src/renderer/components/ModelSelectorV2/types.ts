import type { ComboboxProps } from '@mantine/core'
import type { ProviderModelInfo } from '@shared/types'
import type { PropsWithChildren } from 'react'

export type FilteredProvider = {
  id: string
  name: string
  isCustom?: boolean
  models?: ProviderModelInfo[]
}

export type FavoriteModel = {
  provider?: { id: string; name: string; isCustom?: boolean }
  model?: ProviderModelInfo
}

export type ModelSelectorV2Props = PropsWithChildren<
  {
    showAuto?: boolean
    autoText?: string
    onSelect?: (provider: string, model: string) => void
    onDropdownOpen?: () => void
    modelFilter?: (model: ProviderModelInfo, providerId?: string) => boolean
    modelDisabledCheck?: (model: ProviderModelInfo, providerId?: string) => string | undefined
    selectedProviderId?: string
    selectedModelId?: string
    searchPosition?: 'top' | 'bottom'
  } & ComboboxProps
>

export type DetailModel = {
  providerId: string
  providerName: string
  modelId: string
  name: string
  capabilities?: ProviderModelInfo['capabilities']
  costLevel?: string
  description?: string
  pricing?: {
    officialInput: number
    officialOutput: number
    tokensPerComputePoint: number
    tieredPricing: Array<{
      max_input_tokens?: number
      max_output_tokens?: number
      price_input: number
      price_output: number
    }>
  }
  locked?: boolean
  disabledReason?: string
}

export type DesktopDetailState = {
  key: string
  model: DetailModel
  pricingLink?: string
  left: number
  top: number
}

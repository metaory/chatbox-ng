export type InterfaceTheme = 'light' | 'dark'

export type InterfaceThemeColors = {
  backgroundPrimary: string
  backgroundSecondary: string
  backgroundTertiary: string
  brand: string
}

export type InterfaceColors = Record<InterfaceTheme, InterfaceThemeColors>

export type InterfaceColorPreset = {
  id: string
  label: string
  colors: InterfaceColors
}

const pal = ([backgroundPrimary, backgroundSecondary, backgroundTertiary, brand]: [
  string,
  string,
  string,
  string,
]): InterfaceThemeColors => ({
  backgroundPrimary,
  backgroundSecondary,
  backgroundTertiary,
  brand,
})

export const DEFAULT_INTERFACE_COLORS: InterfaceColors = {
  light: pal(['#f8f4fc', '#eee6f7', '#ddd0ee', '#c026d3']),
  dark: pal(['#1a1226', '#2b1c3d', '#3d2854', '#f472d0']),
}

export const INTERFACE_COLOR_PRESETS = [
  { id: 'default', label: 'Default', colors: DEFAULT_INTERFACE_COLORS },
  {
    id: 'violet',
    label: 'Violet',
    colors: {
      light: pal(['#f3f4ff', '#e4e7ff', '#cdd3ff', '#4f46e5']),
      dark: pal(['#12121f', '#1c1c32', '#2a2a4c', '#818cf8']),
    },
  },
  {
    id: 'magenta',
    label: 'Magenta',
    colors: {
      light: pal(['#fff0f5', '#ffd6e5', '#ffb0cc', '#e11d74']),
      dark: pal(['#1c1016', '#301820', '#442430', '#ff5da8']),
    },
  },
  {
    id: 'ember',
    label: 'Ember',
    colors: {
      light: pal(['#fff5f0', '#ffe4d6', '#ffcbb3', '#ea3a0a']),
      dark: pal(['#1c100c', '#2e1a14', '#42241c', '#ff7a45']),
    },
  },
  {
    id: 'sand',
    label: 'Sand',
    colors: {
      light: pal(['#fffaf0', '#f5ebd0', '#ead9a8', '#c27800']),
      dark: pal(['#1a1610', '#2a2418', '#3c3220', '#fbbf24']),
    },
  },
  {
    id: 'lime',
    label: 'Lime',
    colors: {
      light: pal(['#f5fce6', '#e6f7b8', '#d0ed7a', '#5a9a00']),
      dark: pal(['#12180a', '#1e2a10', '#2c3c16', '#a3e635']),
    },
  },
  {
    id: 'forest',
    label: 'Forest',
    colors: {
      light: pal(['#f0f7f1', '#d8ebd9', '#b8d8ba', '#0d8a3e']),
      dark: pal(['#0e1610', '#1a281c', '#263a28', '#4ade80']),
    },
  },
  {
    id: 'azure',
    label: 'Azure',
    colors: {
      light: pal(['#f0f8ff', '#d6eeff', '#b3dfff', '#0077ff']),
      dark: pal(['#0c1824', '#152a3c', '#1e3c54', '#4db8ff']),
    },
  },
  {
    id: 'ink',
    label: 'Ink',
    colors: {
      light: pal(['#f2f5f8', '#e2e8ee', '#cdd6e0', '#0088cc']),
      dark: pal(['#0c0c0e', '#16161a', '#222228', '#00e5ff']),
    },
  },
] satisfies ReadonlyArray<InterfaceColorPreset>

export function getDefaultInterfaceColors(): InterfaceColors {
  return {
    light: { ...DEFAULT_INTERFACE_COLORS.light },
    dark: { ...DEFAULT_INTERFACE_COLORS.dark },
  }
}

export function isInterfaceBrandColorAllowed(color: string): boolean {
  return color.toLowerCase() !== '#ffffff'
}

export function resolveInterfaceBrandColor(color: string, theme: InterfaceTheme): string {
  return isInterfaceBrandColorAllowed(color) ? color : DEFAULT_INTERFACE_COLORS[theme].brand
}

export function resolveInterfaceBrandColors(colors: InterfaceColors): InterfaceColors {
  return {
    light: { ...colors.light, brand: resolveInterfaceBrandColor(colors.light.brand, 'light') },
    dark: { ...colors.dark, brand: resolveInterfaceBrandColor(colors.dark.brand, 'dark') },
  }
}

export function renameInterfaceColorPreset(
  presets: InterfaceColorPreset[],
  presetId: string,
  label: string
): InterfaceColorPreset[] {
  const trimmedLabel = label.trim()
  if (!trimmedLabel) return presets

  return presets.map((preset) => (preset.id === presetId ? { ...preset, label: trimmedLabel } : preset))
}

export function withColorOpacity(color: string, opacity: number): string {
  const alpha = Math.round(Math.min(Math.max(opacity, 0), 1) * 255)
  return `${color}${alpha.toString(16).padStart(2, '0')}`
}

export const INITIAL_INTERFACE_COLORS_KEY = 'initial-interface-colors'

const isHex = (color: unknown): color is string => typeof color === 'string' && /^#[0-9a-f]{6}$/i.test(color)

export function toSplashColorCache(colors: InterfaceColors) {
  const slice = ({ backgroundPrimary, backgroundTertiary, brand }: InterfaceThemeColors) => ({
    backgroundPrimary,
    backgroundTertiary,
    brand,
  })
  return { light: slice(colors.light), dark: slice(colors.dark) }
}

export function splashPaletteFromCache(cache: unknown, theme: InterfaceTheme) {
  if (!cache || typeof cache !== 'object') return null
  const pal = (
    cache as Record<
      InterfaceTheme,
      { backgroundPrimary?: unknown; backgroundTertiary?: unknown; brand?: unknown }
    >
  )[theme]
  if (!isHex(pal?.backgroundPrimary) || !isHex(pal?.backgroundTertiary)) return null
  return {
    backgroundPrimary: pal.backgroundPrimary,
    backgroundTertiary: pal.backgroundTertiary,
    ...(isHex(pal.brand) ? { brand: pal.brand } : {}),
  }
}

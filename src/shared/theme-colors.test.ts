import { describe, expect, it } from 'vitest'
import {
  DEFAULT_INTERFACE_COLORS,
  INTERFACE_COLOR_PRESETS,
  isInterfaceBrandColorAllowed,
  renameInterfaceColorPreset,
  resolveInterfaceBrandColor,
  resolveInterfaceBrandColors,
  splashPaletteFromCache,
  toSplashColorCache,
  withColorOpacity,
} from './theme-colors'

describe('INTERFACE_COLOR_PRESETS', () => {
  it('provides the default and saturated hue presets', () => {
    expect(INTERFACE_COLOR_PRESETS.map((preset) => ({ id: preset.id, label: preset.label }))).toEqual([
      { id: 'default', label: 'Default' },
      { id: 'violet', label: 'Violet' },
      { id: 'magenta', label: 'Magenta' },
      { id: 'ember', label: 'Ember' },
      { id: 'sand', label: 'Sand' },
      { id: 'lime', label: 'Lime' },
      { id: 'forest', label: 'Forest' },
      { id: 'azure', label: 'Azure' },
      { id: 'ink', label: 'Ink' },
    ])
  })

  it('uses the application default colors for the default preset', () => {
    expect(INTERFACE_COLOR_PRESETS[0].colors).toEqual(DEFAULT_INTERFACE_COLORS)
  })

  it('provides complete light and dark palettes for every preset', () => {
    for (const preset of INTERFACE_COLOR_PRESETS) {
      expect(preset.colors.light).toEqual({
        backgroundPrimary: expect.stringMatching(/^#[0-9a-f]{6}$/i),
        backgroundSecondary: expect.stringMatching(/^#[0-9a-f]{6}$/i),
        backgroundTertiary: expect.stringMatching(/^#[0-9a-f]{6}$/i),
        brand: expect.stringMatching(/^#[0-9a-f]{6}$/i),
      })
      expect(preset.colors.dark).toEqual({
        backgroundPrimary: expect.stringMatching(/^#[0-9a-f]{6}$/i),
        backgroundSecondary: expect.stringMatching(/^#[0-9a-f]{6}$/i),
        backgroundTertiary: expect.stringMatching(/^#[0-9a-f]{6}$/i),
        brand: expect.stringMatching(/^#[0-9a-f]{6}$/i),
      })
    }
  })

  it('uses a 60% alpha channel for preset badge backgrounds', () => {
    expect(withColorOpacity('#d97757', 0.6)).toBe('#d9775799')
  })
})

describe('interface brand color', () => {
  it('rejects white regardless of letter case', () => {
    expect(isInterfaceBrandColorAllowed('#ffffff')).toBe(false)
    expect(isInterfaceBrandColorAllowed('#FFFFFF')).toBe(false)
  })

  it('replaces white with the default brand color for the active theme', () => {
    expect(resolveInterfaceBrandColor('#ffffff', 'light')).toBe('#c026d3')
    expect(resolveInterfaceBrandColor('#FFFFFF', 'dark')).toBe('#f472d0')
    expect(resolveInterfaceBrandColor('#123456', 'light')).toBe('#123456')
  })

  it('replaces white brand colors across a complete palette', () => {
    expect(
      resolveInterfaceBrandColors({
        light: { ...INTERFACE_COLOR_PRESETS[0].colors.light, brand: '#ffffff' },
        dark: { ...INTERFACE_COLOR_PRESETS[0].colors.dark, brand: '#FFFFFF' },
      })
    ).toEqual({
      light: { ...INTERFACE_COLOR_PRESETS[0].colors.light, brand: '#c026d3' },
      dark: { ...INTERFACE_COLOR_PRESETS[0].colors.dark, brand: '#f472d0' },
    })
  })
})

describe('renameInterfaceColorPreset', () => {
  const presets = [
    {
      id: 'custom-1',
      label: 'Custom Preset 1',
      colors: INTERFACE_COLOR_PRESETS[0].colors,
    },
  ]

  it('renames the matching preset and trims the label', () => {
    expect(renameInterfaceColorPreset(presets, 'custom-1', '  My Colors  ')[0].label).toBe('My Colors')
  })

  it('does not accept a blank label', () => {
    expect(renameInterfaceColorPreset(presets, 'custom-1', '   ')).toBe(presets)
  })
})

describe('splash color cache', () => {
  it('stores primary and tertiary surfaces for both themes', () => {
    expect(toSplashColorCache(INTERFACE_COLOR_PRESETS[2].colors)).toEqual({
      light: {
        backgroundPrimary: INTERFACE_COLOR_PRESETS[2].colors.light.backgroundPrimary,
        backgroundTertiary: INTERFACE_COLOR_PRESETS[2].colors.light.backgroundTertiary,
      },
      dark: {
        backgroundPrimary: INTERFACE_COLOR_PRESETS[2].colors.dark.backgroundPrimary,
        backgroundTertiary: INTERFACE_COLOR_PRESETS[2].colors.dark.backgroundTertiary,
      },
    })
  })

  it('reads a valid palette for the active theme', () => {
    expect(splashPaletteFromCache(toSplashColorCache(DEFAULT_INTERFACE_COLORS), 'dark')).toEqual({
      backgroundPrimary: DEFAULT_INTERFACE_COLORS.dark.backgroundPrimary,
      backgroundTertiary: DEFAULT_INTERFACE_COLORS.dark.backgroundTertiary,
    })
  })

  it('rejects invalid cache values', () => {
    expect(splashPaletteFromCache(null, 'light')).toBeNull()
    expect(splashPaletteFromCache({ light: { backgroundPrimary: 'red', backgroundTertiary: '#ddd0ee' } }, 'light')).toBeNull()
  })
})

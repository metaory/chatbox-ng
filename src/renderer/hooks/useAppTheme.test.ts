// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import { DEFAULT_INTERFACE_COLORS } from '@shared/theme-colors'
import { getThemeDesign } from './useAppTheme'

describe('getThemeDesign', () => {
  it('uses the interface brand color for MUI primary controls', () => {
    expect(getThemeDesign('light').palette?.primary).toEqual({
      main: DEFAULT_INTERFACE_COLORS.light.brand,
      contrastText: '#000000',
    })
    expect(getThemeDesign('dark').palette?.primary).toEqual({
      main: DEFAULT_INTERFACE_COLORS.dark.brand,
      contrastText: '#000000',
    })
    expect(getThemeDesign('light', '#d97757').palette?.primary).toEqual({ main: '#d97757', contrastText: '#000000' })
  })

  it('thickens outlined MUI Paper to the shared border token', () => {
    expect(getThemeDesign('light').components?.MuiPaper?.styleOverrides?.outlined).toEqual({
      borderWidth: 'var(--chatbox-border-width)',
      borderColor: 'var(--chatbox-border-primary)',
    })
  })
})

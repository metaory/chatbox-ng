// @vitest-environment jsdom

import { describe, expect, it } from 'vitest'
import { getThemeDesign } from './useAppTheme'

describe('getThemeDesign', () => {
  it('uses the interface brand color for MUI primary controls', () => {
    expect(getThemeDesign('light').palette?.primary).toEqual({ main: '#228be6' })
    expect(getThemeDesign('dark').palette?.primary).toEqual({ main: '#228be6' })
    expect(getThemeDesign('light', '#d97757').palette?.primary).toEqual({ main: '#d97757' })
  })
})

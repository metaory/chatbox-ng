/**
 * @vitest-environment jsdom
 */

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@/test-utils'

const mocks = vi.hoisted(() => ({
  initialize: vi.fn(),
  render: vi.fn(),
}))

vi.mock('mermaid', () => ({
  default: {
    initialize: mocks.initialize,
    render: mocks.render,
  },
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('@/packages/navigator', () => ({
  copyToClipboard: vi.fn(),
}))

vi.mock('@/packages/pic_utils', () => ({
  svgCodeToBase64: vi.fn(),
  svgToPngBase64: vi.fn(),
}))

vi.mock('@/platform', () => ({
  default: { type: 'desktop' },
}))

vi.mock('@/stores/uiStore', () => ({
  useUIStore: () => vi.fn(),
}))

vi.mock('../stores/toastActions', () => ({
  add: vi.fn(),
}))

import { MessageMermaid } from './Mermaid'

describe('MessageMermaid', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mocks.initialize.mockReset()
    mocks.render.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('shows the source and error reason when rendering fails', async () => {
    const source = 'graph TD\nA --> B'
    mocks.render.mockRejectedValue(new Error('structuredClone is not a function'))

    render(<MessageMermaid source={source} theme="light" />)

    expect(await screen.findByText('structuredClone is not a function')).toBeTruthy()
    expect(document.querySelector('code')?.textContent).toBe(source)
    expect(mocks.initialize).toHaveBeenCalledWith({ theme: 'default', suppressErrorRendering: true })
  })
})

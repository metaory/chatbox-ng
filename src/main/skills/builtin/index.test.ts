import { describe, expect, it } from 'vitest'
import { builtinSkills } from './index'

describe('builtinSkills', () => {
  it('only includes practical built-in skills', () => {
    expect(builtinSkills.map((item) => item.metadata.name)).toEqual([
      'data-analysis',
      'chatbox-product-info',
      'vibedrop',
      'frontend-design',
    ])
  })

  it('includes Chatbox product information skill', () => {
    const skill = builtinSkills.find((item) => item.metadata.name === 'chatbox-product-info')

    expect(skill).toBeDefined()
    expect(skill?.metadata.description).toContain('pricing')
    expect(skill?.body).toContain('https://chatbox-unbundled.pages.dev/')
    expect(skill?.body).toContain('https://github.com/metaory/chatbox-unbundled')
    expect(skill?.body).toContain('["settings", "get", "<key>"]')
    expect(skill?.body).not.toContain('["settings", "set"')
    expect(skill?.body).toContain('guide the user to change it manually')
    expect(skill?.body).toContain('["chats", "read", "<session-id>"]')
    expect(skill?.body).toContain('automated user-role notification')
  })

  it('keeps data analysis aligned with the sandbox harness', () => {
    const skill = builtinSkills.find((item) => item.metadata.name === 'data-analysis')

    expect(skill).toBeDefined()
    expect(skill?.body).toContain('code_execution')
    expect(skill?.body).toContain('Node.js, PowerShell on Windows, or Bash')
    expect(skill?.body).toContain('create_download')
    expect(skill?.body).toContain('Python, pandas, matplotlib, R, and system package managers are not available')
  })

  it('includes VibeDrop static hosting skill', () => {
    const skill = builtinSkills.find((item) => item.metadata.name === 'vibedrop')

    expect(skill).toBeDefined()
    expect(skill?.metadata.description).toContain('Deploy any static site')
    expect(skill?.body).toContain('vibedrop deploy ./dist')
    expect(skill?.body).toContain('https://app.vibedrop.cc/claim')
  })
})

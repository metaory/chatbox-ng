import { describe, expect, test } from 'vitest'
import { modelMatchesSearch } from './chatboxCatalog'

describe('modelMatchesSearch', () => {
  test('matches search against provider, model id, and model name', () => {
    const model = { modelId: 'gpt-4.1', modelName: 'GPT 4.1' }
    expect(modelMatchesSearch(model, 'openai', 'OpenAI')).toBe(true)
    expect(modelMatchesSearch(model, '4.1')).toBe(true)
    expect(modelMatchesSearch(model, 'gpt')).toBe(true)
    expect(modelMatchesSearch(model, 'missing')).toBe(false)
  })
})

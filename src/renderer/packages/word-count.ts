import { countWord as sharedCountWord } from '../../shared/utils/word_count'

export function countWord(data: string): number {
  try {
    return sharedCountWord(data)
  } catch {
    return -1
  }
}

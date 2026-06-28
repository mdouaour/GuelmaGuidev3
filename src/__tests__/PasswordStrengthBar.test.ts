import { describe, it, expect } from 'vitest'
import { getPasswordStrengthInfo } from '@/components/PasswordStrengthBar'

const t = (key: string) => {
  const labels: Record<string, string> = {
    score_0: 'Weak',
    score_1: 'Fair',
    score_2: 'Good',
    score_3: 'Strong',
    score_4: 'Very Strong',
  }
  return labels[key] ?? key
}

describe('getPasswordStrengthInfo', () => {
  it('returns weak for score 0', () => {
    const result = getPasswordStrengthInfo(0, t)
    expect(result.label).toBe('Weak')
    expect(result.color).toBe('bg-rose-500')
    expect(result.width).toBe('w-1/5')
  })

  it('returns fair for score 1', () => {
    const result = getPasswordStrengthInfo(1, t)
    expect(result.label).toBe('Fair')
    expect(result.color).toBe('bg-orange-500')
    expect(result.width).toBe('w-2/5')
  })

  it('returns good for score 2', () => {
    const result = getPasswordStrengthInfo(2, t)
    expect(result.label).toBe('Good')
    expect(result.color).toBe('bg-yellow-500')
    expect(result.width).toBe('w-3/5')
  })

  it('returns strong for score 3', () => {
    const result = getPasswordStrengthInfo(3, t)
    expect(result.label).toBe('Strong')
    expect(result.color).toBe('bg-emerald-500')
    expect(result.width).toBe('w-4/5')
  })

  it('returns very strong for score 4', () => {
    const result = getPasswordStrengthInfo(4, t)
    expect(result.label).toBe('Very Strong')
    expect(result.color).toBe('bg-emerald-600')
    expect(result.width).toBe('w-full')
  })
})

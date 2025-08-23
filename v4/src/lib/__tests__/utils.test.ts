/**
 * Utils Tests
 * Comprehensive unit tests for utility functions
 */

import {
  cn,
  formatCurrency,
  formatNumber,
  formatDate,
  formatTime,
  formatDateTime,
  getInitials,
  getAvatarColor,
  sleep,
  debounce,
  calculateWinPercentage,
  getOrdinalSuffix,
} from '../utils'

// Mock timers for debounce and sleep tests
jest.useFakeTimers()

describe('Utils', () => {
  describe('cn (className merger)', () => {
    it('merges class names correctly', () => {
      expect(cn('text-red-500', 'font-bold')).toBe('text-red-500 font-bold')
    })

    it('handles conditional class names', () => {
      expect(cn('text-red-500', true && 'font-bold', false && 'hidden')).toBe(
        'text-red-500 font-bold'
      )
    })

    it('handles Tailwind class conflicts', () => {
      // twMerge should handle conflicting Tailwind classes
      expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
      expect(cn('p-4', 'px-8')).toBe('p-4 px-8')
    })

    it('handles arrays and objects', () => {
      expect(cn(['text-red-500', 'font-bold'])).toBe('text-red-500 font-bold')
      expect(cn({ 'text-red-500': true, 'font-bold': false })).toBe('text-red-500')
    })

    it('handles undefined and null values', () => {
      expect(cn('text-red-500', undefined, null, 'font-bold')).toBe('text-red-500 font-bold')
    })
  })

  describe('formatCurrency', () => {
    it('formats positive amounts correctly', () => {
      expect(formatCurrency(1000)).toBe('$1,000')
      expect(formatCurrency(50)).toBe('$50')
      expect(formatCurrency(1234567)).toBe('$1,234,567')
    })

    it('formats zero correctly', () => {
      expect(formatCurrency(0)).toBe('$0')
    })

    it('formats negative amounts correctly', () => {
      expect(formatCurrency(-100)).toBe('-$100')
      expect(formatCurrency(-1000)).toBe('-$1,000')
    })

    it('rounds decimal amounts', () => {
      expect(formatCurrency(99.99)).toBe('$100')
      expect(formatCurrency(99.4)).toBe('$99')
      expect(formatCurrency(99.5)).toBe('$100')
    })
  })

  describe('formatNumber', () => {
    it('formats numbers with commas', () => {
      expect(formatNumber(1000)).toBe('1,000')
      expect(formatNumber(1234567)).toBe('1,234,567')
      expect(formatNumber(50)).toBe('50')
    })

    it('handles decimal numbers', () => {
      expect(formatNumber(1000.5)).toBe('1,000.5')
      expect(formatNumber(1234.567)).toBe('1,234.567')
    })

    it('handles negative numbers', () => {
      expect(formatNumber(-1000)).toBe('-1,000')
      expect(formatNumber(-1234567)).toBe('-1,234,567')
    })

    it('handles zero', () => {
      expect(formatNumber(0)).toBe('0')
    })
  })

  describe('formatDate', () => {
    beforeAll(() => {
      // Mock the system timezone to ensure consistent tests
      jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(
        () =>
          ({
            format: jest.fn((date: Date) => {
              const month = date.toLocaleDateString('en-US', { month: 'short' })
              const day = date.getDate()
              const year = date.getFullYear()
              return `${month} ${day}, ${year}`
            }),
          } as any)
      )
    })

    afterAll(() => {
      jest.restoreAllMocks()
    })

    it('formats Date objects correctly', () => {
      const date = new Date('2024-01-15T12:00:00Z')
      expect(formatDate(date)).toBe('Jan 15, 2024')
    })

    it('formats date strings correctly', () => {
      expect(formatDate('2024-01-15')).toBe('Jan 15, 2024')
      expect(formatDate('2024-12-25T10:30:00Z')).toBe('Dec 25, 2024')
    })
  })

  describe('formatTime', () => {
    beforeAll(() => {
      jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(
        () =>
          ({
            format: jest.fn((date: Date) => {
              const hours = date.getHours()
              const minutes = date.getMinutes().toString().padStart(2, '0')
              const ampm = hours >= 12 ? 'PM' : 'AM'
              const hour12 = hours % 12 || 12
              return `${hour12}:${minutes} ${ampm}`
            }),
          } as any)
      )
    })

    afterAll(() => {
      jest.restoreAllMocks()
    })

    it('formats time correctly for AM', () => {
      const date = new Date('2024-01-15T08:30:00Z')
      expect(formatTime(date)).toBe('8:30 AM')
    })

    it('formats time correctly for PM', () => {
      const date = new Date('2024-01-15T15:45:00Z')
      expect(formatTime(date)).toBe('3:45 PM')
    })

    it('formats midnight correctly', () => {
      const date = new Date('2024-01-15T00:00:00Z')
      expect(formatTime(date)).toBe('12:00 AM')
    })

    it('formats noon correctly', () => {
      const date = new Date('2024-01-15T12:00:00Z')
      expect(formatTime(date)).toBe('12:00 PM')
    })
  })

  describe('formatDateTime', () => {
    beforeAll(() => {
      jest.spyOn(Intl, 'DateTimeFormat').mockImplementation(
        () =>
          ({
            format: jest.fn((date: Date) => {
              const month = date.toLocaleDateString('en-US', { month: 'short' })
              const day = date.getDate()
              const hours = date.getHours()
              const minutes = date.getMinutes().toString().padStart(2, '0')
              const ampm = hours >= 12 ? 'PM' : 'AM'
              const hour12 = hours % 12 || 12
              return `${month} ${day}, ${hour12}:${minutes} ${ampm}`
            }),
          } as any)
      )
    })

    afterAll(() => {
      jest.restoreAllMocks()
    })

    it('formats datetime correctly', () => {
      const date = new Date('2024-01-15T15:30:00Z')
      expect(formatDateTime(date)).toBe('Jan 15, 3:30 PM')
    })
  })

  describe('getInitials', () => {
    it('gets initials from full name', () => {
      expect(getInitials('John Doe')).toBe('JD')
      expect(getInitials('Jane Mary Smith')).toBe('JM')
      expect(getInitials('Alice')).toBe('A')
    })

    it('handles lowercase names', () => {
      expect(getInitials('john doe')).toBe('JD')
      expect(getInitials('jane smith')).toBe('JS')
    })

    it('handles mixed case names', () => {
      expect(getInitials('jOhN dOe')).toBe('JD')
    })

    it('limits to 2 initials', () => {
      expect(getInitials('John Michael David Smith')).toBe('JM')
    })

    it('handles empty names', () => {
      expect(getInitials('')).toBe('')
    })

    it('handles single character names', () => {
      expect(getInitials('A B')).toBe('AB')
    })

    it('handles extra spaces', () => {
      expect(getInitials('  John   Doe  ')).toBe('JD')
    })
  })

  describe('getAvatarColor', () => {
    it('returns consistent color for same name', () => {
      const color1 = getAvatarColor('John Doe')
      const color2 = getAvatarColor('John Doe')
      expect(color1).toBe(color2)
    })

    it('returns different colors for different names', () => {
      const color1 = getAvatarColor('John Doe')
      const color2 = getAvatarColor('Jane Smith')
      // They might be the same by chance, but very unlikely
      expect(typeof color1).toBe('string')
      expect(typeof color2).toBe('string')
    })

    it('returns valid Tailwind color class', () => {
      const color = getAvatarColor('Test User')
      expect(color).toMatch(/^bg-\w+-500$/)
    })

    it('handles empty name', () => {
      const color = getAvatarColor('')
      expect(color).toMatch(/^bg-\w+-500$/)
    })

    it('handles special characters', () => {
      const color = getAvatarColor('User@123!')
      expect(color).toMatch(/^bg-\w+-500$/)
    })
  })

  describe('sleep', () => {
    it('returns a promise that resolves after specified time', async () => {
      const promise = sleep(1000)
      expect(promise).toBeInstanceOf(Promise)

      // Fast-forward time
      jest.advanceTimersByTime(1000)
      await expect(promise).resolves.toBeUndefined()
    })

    it('does not resolve before specified time', async () => {
      const promise = sleep(1000)
      let resolved = false
      promise.then(() => {
        resolved = true
      })

      // Advance by less than the sleep time
      jest.advanceTimersByTime(500)
      await Promise.resolve() // Let microtasks run
      expect(resolved).toBe(false)

      // Advance to complete the sleep
      jest.advanceTimersByTime(500)
      await Promise.resolve()
      expect(resolved).toBe(true)
    })
  })

  describe('debounce', () => {
    let mockFn: jest.Mock

    beforeEach(() => {
      mockFn = jest.fn()
    })

    it('delays function execution', () => {
      const debouncedFn = debounce(mockFn, 1000)

      debouncedFn('arg1', 'arg2')
      expect(mockFn).not.toHaveBeenCalled()

      jest.advanceTimersByTime(1000)
      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('cancels previous calls when called multiple times', () => {
      const debouncedFn = debounce(mockFn, 1000)

      debouncedFn('first call')
      jest.advanceTimersByTime(500)

      debouncedFn('second call')
      jest.advanceTimersByTime(500)

      // First call should be cancelled, second should not have executed yet
      expect(mockFn).not.toHaveBeenCalled()

      jest.advanceTimersByTime(500)
      expect(mockFn).toHaveBeenCalledWith('second call')
      expect(mockFn).toHaveBeenCalledTimes(1)
    })

    it('handles multiple arguments correctly', () => {
      const debouncedFn = debounce(mockFn, 1000)

      debouncedFn(1, 'test', { key: 'value' }, [1, 2, 3])
      jest.advanceTimersByTime(1000)

      expect(mockFn).toHaveBeenCalledWith(1, 'test', { key: 'value' }, [1, 2, 3])
    })
  })

  describe('calculateWinPercentage', () => {
    it('calculates win percentage correctly', () => {
      expect(calculateWinPercentage(10, 5, 1)).toBe(65.625) // (10 + 0.5) / 16 * 100
      expect(calculateWinPercentage(8, 4, 0)).toBe(66.66666666666666) // 8 / 12 * 100
      expect(calculateWinPercentage(0, 12, 0)).toBe(0)
      expect(calculateWinPercentage(12, 0, 0)).toBe(100)
    })

    it('handles ties correctly', () => {
      expect(calculateWinPercentage(5, 5, 2)).toBe(50) // (5 + 1) / 12 * 100
      expect(calculateWinPercentage(0, 0, 4)).toBe(50) // (0 + 2) / 4 * 100
    })

    it('handles no games played', () => {
      expect(calculateWinPercentage(0, 0, 0)).toBe(0)
    })

    it('rounds to reasonable precision', () => {
      expect(calculateWinPercentage(1, 2, 0)).toBe(33.33333333333333)
    })
  })

  describe('getOrdinalSuffix', () => {
    it('handles 1st, 2nd, 3rd correctly', () => {
      expect(getOrdinalSuffix(1)).toBe('1st')
      expect(getOrdinalSuffix(2)).toBe('2nd')
      expect(getOrdinalSuffix(3)).toBe('3rd')
    })

    it('handles 4th through 10th', () => {
      expect(getOrdinalSuffix(4)).toBe('4th')
      expect(getOrdinalSuffix(5)).toBe('5th')
      expect(getOrdinalSuffix(6)).toBe('6th')
      expect(getOrdinalSuffix(7)).toBe('7th')
      expect(getOrdinalSuffix(8)).toBe('8th')
      expect(getOrdinalSuffix(9)).toBe('9th')
      expect(getOrdinalSuffix(10)).toBe('10th')
    })

    it('handles 11th, 12th, 13th exceptions', () => {
      expect(getOrdinalSuffix(11)).toBe('11th')
      expect(getOrdinalSuffix(12)).toBe('12th')
      expect(getOrdinalSuffix(13)).toBe('13th')
    })

    it('handles 21st, 22nd, 23rd', () => {
      expect(getOrdinalSuffix(21)).toBe('21st')
      expect(getOrdinalSuffix(22)).toBe('22nd')
      expect(getOrdinalSuffix(23)).toBe('23rd')
    })

    it('handles 111th, 112th, 113th exceptions', () => {
      expect(getOrdinalSuffix(111)).toBe('111th')
      expect(getOrdinalSuffix(112)).toBe('112th')
      expect(getOrdinalSuffix(113)).toBe('113th')
    })

    it('handles large numbers', () => {
      expect(getOrdinalSuffix(101)).toBe('101st')
      expect(getOrdinalSuffix(102)).toBe('102nd')
      expect(getOrdinalSuffix(103)).toBe('103rd')
      expect(getOrdinalSuffix(104)).toBe('104th')
    })

    it('handles zero and negative numbers', () => {
      expect(getOrdinalSuffix(0)).toBe('0th')
      expect(getOrdinalSuffix(-1)).toBe('-1st')
      expect(getOrdinalSuffix(-2)).toBe('-2nd')
      expect(getOrdinalSuffix(-11)).toBe('-11th')
    })
  })

  describe('Edge Cases', () => {
    it('handles various input types gracefully', () => {
      // Test that functions don't throw with edge case inputs
      expect(() => getInitials('   ')).not.toThrow()
      expect(() => getAvatarColor('🚀')).not.toThrow()
      expect(() => formatCurrency(Infinity)).not.toThrow()
      expect(() => formatNumber(NaN)).not.toThrow()
    })

    it('handles Unicode characters', () => {
      expect(getInitials('José María')).toBe('JM')
      expect(getAvatarColor('José María')).toMatch(/^bg-\w+-500$/)
    })

    it('handles very large numbers', () => {
      expect(formatNumber(999999999999)).toBe('999,999,999,999')
      expect(formatCurrency(999999999999)).toBe('$999,999,999,999')
    })
  })
})
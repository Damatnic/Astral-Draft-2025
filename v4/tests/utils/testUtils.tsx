import React from 'react'

// Simple placeholder for test utils
export const renderWithProviders = (ui: React.ReactElement) => {
  return { render: () => ui }
}

export const createMockSession = () => ({
  user: { id: '1', email: 'test@test.com', name: 'Test User' },
  expires: '2024-12-31'
})

export const waitForAsyncOperation = (ms = 100) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export const createMockApiResponse = <T,>(data: T, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
  text: async () => JSON.stringify(data),
} as Response)

// Re-export testing library utilities
export * from '@testing-library/react'
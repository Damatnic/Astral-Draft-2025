import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'

import HomePage from './page'

describe('HomePage', () => {
  it('renders the welcome message', () => {
    render(<HomePage />)
    
    const heading = screen.getByRole('heading', { level: 1 })
    expect(heading).toHaveTextContent('Welcome to Astral Draft V4')
  })

  it('renders the feature cards', () => {
    render(<HomePage />)
    
    expect(screen.getByText('Real-time Drafts')).toBeInTheDocument()
    expect(screen.getByText('Advanced Analytics')).toBeInTheDocument()
    expect(screen.getByText('Social Features')).toBeInTheDocument()
  })

  it('renders the action buttons', () => {
    render(<HomePage />)
    
    expect(screen.getByRole('button', { name: 'Get Started' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Learn More' })).toBeInTheDocument()
  })
})
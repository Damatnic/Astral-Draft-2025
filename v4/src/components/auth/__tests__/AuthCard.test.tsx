/**
 * AuthCard Component Tests
 * Comprehensive unit tests for the authentication card wrapper
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AuthCard } from '../AuthCard'

// Mock Next.js Link component
jest.mock('next/link', () => {
  return function MockLink({ children, href, ...props }: any) {
    return <a href={href} {...props}>{children}</a>
  }
})

// Mock Card components
jest.mock('../../ui/Card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardHeader: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardTitle: ({ children, className }: any) => <h1 className={className}>{children}</h1>,
}))

describe('AuthCard Component', () => {
  const defaultProps = {
    title: 'Test Title',
    children: <div>Test Content</div>,
  }

  describe('Rendering', () => {
    it('renders with required props', () => {
      render(<AuthCard {...defaultProps} />)
      
      expect(screen.getByText('Test Title')).toBeInTheDocument()
      expect(screen.getByText('Test Content')).toBeInTheDocument()
    })

    it('renders Astral Draft logo and brand name', () => {
      render(<AuthCard {...defaultProps} />)
      
      expect(screen.getByText('Astral Draft')).toBeInTheDocument()
      expect(screen.getByText('A')).toBeInTheDocument() // Logo text
    })

    it('renders title in card header', () => {
      const title = 'Sign In to Your Account'
      render(<AuthCard {...defaultProps} title={title} />)
      
      const titleElement = screen.getByText(title)
      expect(titleElement).toBeInTheDocument()
      expect(titleElement.tagName).toBe('H1')
    })

    it('renders children in card content', () => {
      const children = (
        <div>
          <input placeholder="Email" />
          <button>Submit</button>
        </div>
      )
      
      render(<AuthCard {...defaultProps}>{children}</AuthCard>)
      
      expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument()
    })
  })

  describe('Optional Props', () => {
    it('renders subtitle when provided', () => {
      const subtitle = 'Please enter your credentials to continue'
      render(<AuthCard {...defaultProps} subtitle={subtitle} />)
      
      expect(screen.getByText(subtitle)).toBeInTheDocument()
    })

    it('does not render subtitle when not provided', () => {
      render(<AuthCard {...defaultProps} />)
      
      // Should not find any element with subtitle text
      const subtitleElement = screen.queryByText(/please enter/i)
      expect(subtitleElement).not.toBeInTheDocument()
    })

    it('renders footer when provided', () => {
      const footer = (
        <div>
          Need help? <a href="/support">Contact Support</a>
        </div>
      )
      
      render(<AuthCard {...defaultProps} footer={footer} />)
      
      expect(screen.getByText('Need help?')).toBeInTheDocument()
      expect(screen.getByText('Contact Support')).toBeInTheDocument()
    })

    it('does not render footer when not provided', () => {
      render(<AuthCard {...defaultProps} />)
      
      // Should not find footer container
      const footerContainer = screen.queryByText('Need help?')
      expect(footerContainer).not.toBeInTheDocument()
    })
  })

  describe('Layout and Styling', () => {
    it('applies correct layout classes', () => {
      const { container } = render(<AuthCard {...defaultProps} />)
      
      const mainContainer = container.firstChild
      expect(mainContainer).toHaveClass(
        'min-h-screen',
        'flex',
        'items-center',
        'justify-center',
        'bg-gray-50',
        'py-12',
        'px-4'
      )
    })

    it('applies responsive padding classes', () => {
      const { container } = render(<AuthCard {...defaultProps} />)
      
      const mainContainer = container.firstChild
      expect(mainContainer).toHaveClass('sm:px-6', 'lg:px-8')
    })

    it('centers content with max width', () => {
      render(<AuthCard {...defaultProps} />)
      
      const contentWrapper = screen.getByText('Test Title').closest('.max-w-md')
      expect(contentWrapper).toHaveClass('max-w-md', 'w-full', 'space-y-8')
    })

    it('applies shadow to card', () => {
      render(<AuthCard {...defaultProps} />)
      
      // Check if Card component receives shadow class
      const cardElement = screen.getByText('Test Title').closest('div')
      expect(cardElement).toHaveClass('shadow-lg')
    })
  })

  describe('Logo and Branding', () => {
    it('links logo to home page', () => {
      render(<AuthCard {...defaultProps} />)
      
      const logoLink = screen.getByText('Astral Draft').closest('a')
      expect(logoLink).toHaveAttribute('href', '/')
    })

    it('renders logo with correct styling', () => {
      render(<AuthCard {...defaultProps} />)
      
      const logoElement = screen.getByText('A')
      expect(logoElement).toBeInTheDocument()
      
      const logoContainer = logoElement.closest('div')
      expect(logoContainer).toHaveClass(
        'w-8',
        'h-8',
        'bg-gradient-to-r',
        'from-blue-600',
        'to-purple-600',
        'rounded-lg',
        'flex',
        'items-center',
        'justify-center'
      )
    })

    it('renders brand name with correct styling', () => {
      render(<AuthCard {...defaultProps} />)
      
      const brandName = screen.getByText('Astral Draft')
      expect(brandName).toHaveClass('text-2xl', 'font-bold', 'text-gray-900')
    })
  })

  describe('Accessibility', () => {
    it('provides proper heading structure', () => {
      render(<AuthCard {...defaultProps} title="Sign In" />)
      
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveTextContent('Sign In')
    })

    it('maintains logical tab order', async () => {
      const user = userEvent.setup()
      
      render(
        <AuthCard {...defaultProps}>
          <input placeholder="Email" />
          <input placeholder="Password" />
          <button>Submit</button>
        </AuthCard>
      )
      
      const logoLink = screen.getByText('Astral Draft').closest('a')
      const emailInput = screen.getByPlaceholderText('Email')
      const passwordInput = screen.getByPlaceholderText('Password')
      const submitButton = screen.getByRole('button')
      
      // Test tab navigation
      expect(document.body).toHaveFocus()
      
      await user.tab()
      expect(logoLink).toHaveFocus()
      
      await user.tab()
      expect(emailInput).toHaveFocus()
      
      await user.tab()
      expect(passwordInput).toHaveFocus()
      
      await user.tab()
      expect(submitButton).toHaveFocus()
    })

    it('supports screen readers with proper text content', () => {
      render(
        <AuthCard
          title="Create Account"
          subtitle="Join thousands of fantasy football players"
          footer={<div>Already have an account? <a href="/login">Sign In</a></div>}
        >
          <form>Registration form</form>
        </AuthCard>
      )
      
      // All text should be accessible to screen readers
      expect(screen.getByText('Astral Draft')).toBeInTheDocument()
      expect(screen.getByText('Create Account')).toBeInTheDocument()
      expect(screen.getByText('Join thousands of fantasy football players')).toBeInTheDocument()
      expect(screen.getByText('Registration form')).toBeInTheDocument()
      expect(screen.getByText('Already have an account?')).toBeInTheDocument()
    })

    it('provides accessible link text', () => {
      render(<AuthCard {...defaultProps} />)
      
      const logoLink = screen.getByRole('link')
      expect(logoLink).toHaveTextContent('Astral Draft')
      expect(logoLink).toHaveAttribute('href', '/')
    })
  })

  describe('Responsive Design', () => {
    it('applies responsive spacing classes', () => {
      const { container } = render(<AuthCard {...defaultProps} />)
      
      const mainContainer = container.firstChild
      expect(mainContainer).toHaveClass('px-4', 'sm:px-6', 'lg:px-8')
    })

    it('maintains proper spacing on mobile and desktop', () => {
      render(<AuthCard {...defaultProps} />)
      
      const contentContainer = screen.getByText('Test Title').closest('.space-y-8')
      expect(contentContainer).toHaveClass('space-y-8')
      
      const cardContent = screen.getByText('Test Content').closest('div')
      expect(cardContent).toHaveClass('space-y-6')
    })
  })

  describe('Content Structure', () => {
    it('renders complex children correctly', () => {
      const complexChildren = (
        <div>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" />
          </div>
          <button type="submit">Sign In</button>
        </div>
      )
      
      render(<AuthCard {...defaultProps}>{complexChildren}</AuthCard>)
      
      expect(screen.getByLabelText('Email')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument()
    })

    it('renders complex footer correctly', () => {
      const complexFooter = (
        <div>
          <p>By signing up, you agree to our <a href="/terms">Terms of Service</a></p>
          <p>Need help? <a href="/support">Contact Support</a></p>
        </div>
      )
      
      render(<AuthCard {...defaultProps} footer={complexFooter} />)
      
      expect(screen.getByText(/By signing up/)).toBeInTheDocument()
      expect(screen.getByText('Terms of Service')).toBeInTheDocument()
      expect(screen.getByText('Contact Support')).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('handles empty title gracefully', () => {
      render(<AuthCard {...defaultProps} title="" />)
      
      const titleElement = screen.getByRole('heading', { level: 1 })
      expect(titleElement).toBeInTheDocument()
      expect(titleElement).toBeEmptyDOMElement()
    })

    it('handles long title text', () => {
      const longTitle = 'This is a very long title that might wrap to multiple lines'
      render(<AuthCard {...defaultProps} title={longTitle} />)
      
      expect(screen.getByText(longTitle)).toBeInTheDocument()
    })

    it('handles long subtitle text', () => {
      const longSubtitle = 'This is a very long subtitle that provides detailed information about the authentication process and might wrap to multiple lines'
      render(<AuthCard {...defaultProps} subtitle={longSubtitle} />)
      
      expect(screen.getByText(longSubtitle)).toBeInTheDocument()
    })
  })
})
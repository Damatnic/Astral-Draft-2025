/**
 * Button Component Tests
 * Comprehensive unit tests for the Button component
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button, buttonVariants } from '../Button'

describe('Button Component', () => {
  describe('Rendering', () => {
    it('renders button with default props', () => {
      render(<Button>Click me</Button>)
      
      const button = screen.getByRole('button', { name: /click me/i })
      expect(button).toBeInTheDocument()
      expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center')
    })

    it('renders button with custom text', () => {
      const buttonText = 'Custom Button Text'
      render(<Button>{buttonText}</Button>)
      
      expect(screen.getByRole('button', { name: buttonText })).toBeInTheDocument()
    })

    it('applies custom className', () => {
      const customClass = 'custom-button-class'
      render(<Button className={customClass}>Button</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass(customClass)
    })

    it('forwards ref correctly', () => {
      const ref = React.createRef<HTMLButtonElement>()
      render(<Button ref={ref}>Button</Button>)
      
      expect(ref.current).toBeInstanceOf(HTMLButtonElement)
    })
  })

  describe('Variants', () => {
    it.each([
      ['default', 'bg-primary'],
      ['destructive', 'bg-destructive'],
      ['outline', 'border'],
      ['secondary', 'bg-secondary'],
      ['ghost', 'hover:bg-accent'],
      ['link', 'text-primary'],
    ])('renders %s variant with correct classes', (variant, expectedClass) => {
      render(<Button variant={variant as any}>Button</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass(expectedClass)
    })
  })

  describe('Sizes', () => {
    it.each([
      ['default', 'h-9'],
      ['sm', 'h-8'],
      ['lg', 'h-10'],
      ['icon', 'h-9', 'w-9'],
    ])('renders %s size with correct classes', (size, ...expectedClasses) => {
      render(<Button size={size as any}>Button</Button>)
      
      const button = screen.getByRole('button')
      expectedClasses.forEach(className => {
        expect(button).toHaveClass(className)
      })
    })
  })

  describe('States', () => {
    it('renders disabled state', () => {
      render(<Button disabled>Disabled Button</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50')
    })

    it('renders loading state', () => {
      render(<Button loading>Loading Button</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      
      // Check for loading spinner
      const spinner = button.querySelector('svg')
      expect(spinner).toBeInTheDocument()
      expect(spinner).toHaveClass('animate-spin')
    })

    it('disables button when loading is true', () => {
      render(<Button loading>Loading</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
    })

    it('shows loading spinner with correct classes', () => {
      render(<Button loading>Loading</Button>)
      
      const spinner = screen.getByRole('button').querySelector('svg')
      expect(spinner).toHaveClass('mr-2', 'h-4', 'w-4', 'animate-spin')
    })
  })

  describe('Interactions', () => {
    it('handles click events', async () => {
      const handleClick = jest.fn()
      const user = userEvent.setup()
      
      render(<Button onClick={handleClick}>Click me</Button>)
      
      const button = screen.getByRole('button')
      await user.click(button)
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('does not trigger click when disabled', async () => {
      const handleClick = jest.fn()
      const user = userEvent.setup()
      
      render(<Button disabled onClick={handleClick}>Disabled</Button>)
      
      const button = screen.getByRole('button')
      await user.click(button)
      
      expect(handleClick).not.toHaveBeenCalled()
    })

    it('does not trigger click when loading', async () => {
      const handleClick = jest.fn()
      const user = userEvent.setup()
      
      render(<Button loading onClick={handleClick}>Loading</Button>)
      
      const button = screen.getByRole('button')
      await user.click(button)
      
      expect(handleClick).not.toHaveBeenCalled()
    })

    it('handles keyboard navigation', () => {
      render(<Button>Keyboard Button</Button>)
      
      const button = screen.getByRole('button')
      button.focus()
      
      expect(button).toHaveFocus()
      expect(button).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2')
    })

    it('handles enter key press', () => {
      const handleClick = jest.fn()
      render(<Button onClick={handleClick}>Enter Button</Button>)
      
      const button = screen.getByRole('button')
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' })
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it('handles space key press', () => {
      const handleClick = jest.fn()
      render(<Button onClick={handleClick}>Space Button</Button>)
      
      const button = screen.getByRole('button')
      fireEvent.keyDown(button, { key: ' ', code: 'Space' })
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
  })

  describe('Props forwarding', () => {
    it('forwards HTML button attributes', () => {
      render(
        <Button
          type="submit"
          name="test-button"
          value="test-value"
          data-testid="custom-button"
        >
          Submit
        </Button>
      )
      
      const button = screen.getByTestId('custom-button')
      expect(button).toHaveAttribute('type', 'submit')
      expect(button).toHaveAttribute('name', 'test-button')
      expect(button).toHaveAttribute('value', 'test-value')
    })

    it('supports aria attributes', () => {
      render(
        <Button
          aria-label="Custom aria label"
          aria-describedby="button-description"
          aria-pressed="true"
        >
          Aria Button
        </Button>
      )
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Custom aria label')
      expect(button).toHaveAttribute('aria-describedby', 'button-description')
      expect(button).toHaveAttribute('aria-pressed', 'true')
    })
  })

  describe('Edge cases', () => {
    it('renders without children', () => {
      render(<Button />)
      
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button).toBeEmptyDOMElement()
    })

    it('renders with complex children', () => {
      render(
        <Button>
          <span>Icon</span>
          <span>Text</span>
        </Button>
      )
      
      const button = screen.getByRole('button')
      expect(button).toHaveTextContent('IconText')
      expect(button.children).toHaveLength(2)
    })

    it('handles both disabled and loading props', () => {
      render(<Button disabled loading>Both States</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeDisabled()
      
      // Should still show loading spinner
      const spinner = button.querySelector('svg')
      expect(spinner).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has correct role', () => {
      render(<Button>Accessible Button</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    it('supports screen reader text', () => {
      render(
        <Button>
          <span className="sr-only">Hidden text for screen readers</span>
          Visible text
        </Button>
      )
      
      const button = screen.getByRole('button')
      expect(button).toHaveTextContent('Hidden text for screen readersVisible text')
    })

    it('maintains focus visibility styles', () => {
      render(<Button>Focus Button</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-2')
    })

    it('communicates disabled state to screen readers', () => {
      render(<Button disabled>Disabled Button</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('disabled')
    })

    it('communicates loading state appropriately', () => {
      render(<Button loading aria-label="Loading, please wait">Loading</Button>)
      
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', 'Loading, please wait')
      expect(button).toBeDisabled()
    })
  })
})

describe('buttonVariants function', () => {
  it('generates correct classes for default variant', () => {
    const classes = buttonVariants()
    expect(classes).toContain('bg-primary')
    expect(classes).toContain('h-9')
  })

  it('generates correct classes for custom variant and size', () => {
    const classes = buttonVariants({ variant: 'destructive', size: 'lg' })
    expect(classes).toContain('bg-destructive')
    expect(classes).toContain('h-10')
  })

  it('includes custom className', () => {
    const customClass = 'my-custom-class'
    const classes = buttonVariants({ className: customClass })
    expect(classes).toContain(customClass)
  })
})
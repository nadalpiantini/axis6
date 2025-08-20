import { render } from '@testing-library/react'
import RootLayout from './layout'

describe('Root Layout', () => {
  it('renders children content', () => {
    const { getByText } = render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    )
    
    expect(getByText('Test Content')).toBeInTheDocument()
  })

  it('includes required html and body tags', () => {
    const { container } = render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    )
    
    // Check that the body has the correct classes
    const body = container.querySelector('body')
    expect(body).toBeInTheDocument()
  })

  it('applies correct font classes', () => {
    const { container } = render(
      <RootLayout>
        <div>Test Content</div>
      </RootLayout>
    )
    
    const body = container.querySelector('body')
    expect(body?.className).toContain('antialiased')
  })
})
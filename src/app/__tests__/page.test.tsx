import { render, screen } from '@testing-library/react'
import Home from '../page'

describe('Home Page', () => {
  it('renders the home page', () => {
    render(<Home />)
    const headings = screen.getAllByText(/AXIS6/i)
    expect(headings.length).toBeGreaterThan(0)
  })

  it('renders the tagline', () => {
    render(<Home />)
    expect(screen.getByText(/Tu Vida Equilibrada/i)).toBeInTheDocument()
  })

  it('renders login and register buttons', () => {
    render(<Home />)
    expect(screen.getByRole('link', { name: /Iniciar Sesión/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Crear Cuenta/i })).toBeInTheDocument()
  })

  it('has correct navigation links', () => {
    render(<Home />)
    const loginLink = screen.getByRole('link', { name: /Iniciar Sesión/i })
    const registerLink = screen.getByRole('link', { name: /Crear Cuenta/i })
    
    expect(loginLink).toHaveAttribute('href', '/login')
    expect(registerLink).toHaveAttribute('href', '/register')
  })
})
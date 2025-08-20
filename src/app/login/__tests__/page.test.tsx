import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Login from '../page'

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithPassword: jest.fn(),
    },
  })),
}))

describe('Login Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders login form', () => {
    render(<Login />)
    
    expect(screen.getByLabelText(/Correo electrónico/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Contraseña/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Iniciar Sesión/i })).toBeInTheDocument()
  })

  it('displays validation errors for empty fields', async () => {
    const user = userEvent.setup()
    render(<Login />)
    
    const submitButton = screen.getByRole('button', { name: /Iniciar Sesión/i })
    await user.click(submitButton)
    
    // Form should not submit with empty fields due to HTML5 validation
    const emailInput = screen.getByLabelText(/Correo electrónico/i) as HTMLInputElement
    expect(emailInput.validity.valid).toBe(false)
  })

  it('accepts valid email and password input', async () => {
    const user = userEvent.setup()
    render(<Login />)
    
    const emailInput = screen.getByLabelText(/Correo electrónico/i)
    const passwordInput = screen.getByLabelText(/Contraseña/i)
    
    await user.type(emailInput, 'test@example.com')
    await user.type(passwordInput, 'password123')
    
    expect(emailInput).toHaveValue('test@example.com')
    expect(passwordInput).toHaveValue('password123')
  })

  it('has a link to register page', () => {
    render(<Login />)
    
    const registerLink = screen.getByRole('link', { name: /¿No tienes cuenta\? Regístrate/i })
    expect(registerLink).toHaveAttribute('href', '/register')
  })

  it('has a back to home link', () => {
    render(<Login />)
    
    const homeLink = screen.getByRole('link', { name: /Volver al inicio/i })
    expect(homeLink).toHaveAttribute('href', '/')
  })
})
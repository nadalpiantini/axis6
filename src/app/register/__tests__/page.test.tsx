import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Register from '../page'

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signUp: jest.fn(),
    },
    from: jest.fn(() => ({
      insert: jest.fn(),
    })),
  })),
}))

describe('Register Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders registration form', () => {
    render(<Register />)
    
    expect(screen.getByLabelText(/Nombre completo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Correo electrónico/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Contraseña/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Crear Cuenta/i })).toBeInTheDocument()
  })

  it('accepts user input in all fields', async () => {
    const user = userEvent.setup()
    render(<Register />)
    
    const nameInput = screen.getByLabelText(/Nombre completo/i)
    const emailInput = screen.getByLabelText(/Correo electrónico/i)
    const passwordInput = screen.getByLabelText(/Contraseña/i)
    
    await user.type(nameInput, 'John Doe')
    await user.type(emailInput, 'john@example.com')
    await user.type(passwordInput, 'securepassword123')
    
    expect(nameInput).toHaveValue('John Doe')
    expect(emailInput).toHaveValue('john@example.com')
    expect(passwordInput).toHaveValue('securepassword123')
  })

  it('validates email format', async () => {
    const user = userEvent.setup()
    render(<Register />)
    
    const emailInput = screen.getByLabelText(/Correo electrónico/i) as HTMLInputElement
    
    await user.type(emailInput, 'invalid-email')
    expect(emailInput.validity.valid).toBe(false)
    
    await user.clear(emailInput)
    await user.type(emailInput, 'valid@email.com')
    expect(emailInput.validity.valid).toBe(true)
  })

  it('has a link to login page', () => {
    render(<Register />)
    
    const loginLink = screen.getByRole('link', { name: /¿Ya tienes cuenta\? Inicia sesión/i })
    expect(loginLink).toHaveAttribute('href', '/login')
  })

  it('has a back to home link', () => {
    render(<Register />)
    
    const homeLink = screen.getByRole('link', { name: /Volver al inicio/i })
    expect(homeLink).toHaveAttribute('href', '/')
  })

  it('requires minimum password length', async () => {
    const user = userEvent.setup()
    render(<Register />)
    
    const passwordInput = screen.getByLabelText(/Contraseña/i) as HTMLInputElement
    
    await user.type(passwordInput, '123')
    expect(passwordInput.value).toBe('123')
    expect(passwordInput.validity.valid).toBe(false) // Too short due to minLength=6
    
    await user.clear(passwordInput)
    await user.type(passwordInput, '123456')
    expect(passwordInput.value).toBe('123456')
    expect(passwordInput.validity.valid).toBe(true) // Valid length
  })
})
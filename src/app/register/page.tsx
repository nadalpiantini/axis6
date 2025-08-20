'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Registrar usuario
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/Santo_Domingo'
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      setSuccess(true)
      
      // Redirigir después de 3 segundos
      setTimeout(() => {
        router.push('/login')
      }, 3000)
      
    } catch (error: any) {
      setError(error.message || 'Error al crear la cuenta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-950 to-navy-900 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-physical to-spiritual bg-clip-text text-transparent mb-2">
            AXIS6
          </h1>
          <p className="text-gray-400">Comienza tu viaje hacia el equilibrio</p>
        </div>

        {/* Register Form */}
        <div className="bg-navy-900/50 backdrop-blur-lg rounded-2xl border border-white/10 p-8">
          <h2 className="text-2xl font-semibold text-white mb-6">Crear Cuenta</h2>
          
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg mb-6"
            >
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-physical/10 border border-physical/20 text-physical px-4 py-3 rounded-lg mb-6"
            >
              ¡Cuenta creada exitosamente! Revisa tu email para confirmar tu cuenta.
            </motion.div>
          )}

          <form onSubmit={handleRegister} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                Nombre
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-navy-800/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-physical focus:ring-1 focus:ring-physical transition-colors"
                placeholder="Tu nombre"
                disabled={loading || success}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-navy-800/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-physical focus:ring-1 focus:ring-physical transition-colors"
                placeholder="tu@email.com"
                disabled={loading || success}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-navy-800/50 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-physical focus:ring-1 focus:ring-physical transition-colors"
                placeholder="Mínimo 6 caracteres"
                disabled={loading || success}
              />
              <p className="mt-1 text-xs text-gray-500">Mínimo 6 caracteres</p>
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full py-3 px-4 bg-gradient-to-r from-physical to-mental text-white font-semibold rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-physical focus:ring-offset-2 focus:ring-offset-navy-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creando cuenta...
                </span>
              ) : success ? (
                'Cuenta creada ✅'
              ) : (
                'Crear Cuenta'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              ¿Ya tienes cuenta?{' '}
              <Link href="/login" className="text-physical hover:text-mental transition-colors">
                Inicia sesión
              </Link>
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10">
            <p className="text-xs text-gray-500 text-center">
              Al registrarte, aceptas comenzar tu viaje de equilibrio en los 6 ejes de la vida: 
              <span className="text-physical"> Físico</span>,
              <span className="text-mental"> Mental</span>,
              <span className="text-emotional"> Emocional</span>,
              <span className="text-social"> Social</span>,
              <span className="text-spiritual"> Espiritual</span> y
              <span className="text-material"> Material</span>.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
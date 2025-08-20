'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'

const categories = [
  { name: 'Física', color: '#A6C26F', icon: '🌿', description: 'Ejercicio, salud y nutrición' },
  { name: 'Mental', color: '#365D63', icon: '🧠', description: 'Aprendizaje y productividad' },
  { name: 'Emocional', color: '#D36C50', icon: '❤️', description: 'Estado de ánimo y estrés' },
  { name: 'Social', color: '#6F3D56', icon: '🤝', description: 'Relaciones y conexiones' },
  { name: 'Espiritual', color: '#2C3E50', icon: '🧿', description: 'Meditación y propósito' },
  { name: 'Material', color: '#C85729', icon: '🎯', description: 'Finanzas y recursos' }
]

export default function HomePage() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-gradient-to-br from-bgPrimary via-marfil to-arena texture-noise concentric-circles">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-marfil/30 to-arena/50" />
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-7xl font-serif font-bold mb-6">
              <span className="bg-gradient-to-r from-physical via-emotional to-social bg-clip-text text-transparent">
                AXIS6
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-textPrimary font-serif italic mb-4">
              &ldquo;Seis ejes. Un solo tú. No rompas tu Axis.&rdquo;
            </p>
            
            <p className="text-lg text-textSecondary mb-12 max-w-2xl mx-auto">
              Alcanza el equilibrio perfecto en las 6 dimensiones de tu vida. 
              Rastrea tu progreso diario, construye hábitos duraderos y conviértete 
              en la mejor versión de ti mismo.
            </p>

            <div className="flex gap-4 justify-center">
              <Link href="/register">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-gradient-to-r from-physical to-mental text-white font-semibold rounded-full text-lg hover:shadow-lg hover:shadow-physical/25 transition-all"
                >
                  Comenzar Ahora
                </motion.button>
              </Link>
              
              <Link href="/login">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-8 py-4 bg-navy-800/50 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-full text-lg hover:bg-navy-700/50 transition-all"
                >
                  Iniciar Sesión
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-4">
            Los 6 Ejes de tu Vida
          </h2>
          <p className="text-center text-gray-400 mb-16 max-w-3xl mx-auto">
            Cada eje representa una dimensión esencial de tu bienestar. 
            Mantén el equilibrio entre todos para alcanzar tu máximo potencial.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index, duration: 0.5 }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                className="relative group"
              >
                <div className="bg-navy-900/50 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:border-white/20 transition-all">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all group-hover:scale-110"
                    style={{ 
                      backgroundColor: `${category.color}20`,
                      borderColor: category.color,
                      borderWidth: '2px'
                    }}
                  >
                    <span className="text-3xl">{category.icon}</span>
                  </div>
                  
                  <h3 
                    className="text-xl font-semibold mb-2"
                    style={{ color: hoveredIndex === index ? category.color : '#ffffff' }}
                  >
                    {category.name}
                  </h3>
                  
                  <p className="text-gray-400">
                    {category.description}
                  </p>
                  
                  {hoveredIndex === index && (
                    <motion.div
                      layoutId="hover-card"
                      className="absolute inset-0 rounded-2xl pointer-events-none"
                      style={{
                        background: `linear-gradient(135deg, ${category.color}10 0%, transparent 100%)`,
                        border: `1px solid ${category.color}30`
                      }}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* How it Works */}
      <div className="bg-navy-900/30 backdrop-blur-sm border-y border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-16">
            ¿Cómo Funciona?
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-physical to-mental rounded-full flex items-center justify-center text-3xl font-bold text-navy-950 mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Check-in Diario</h3>
              <p className="text-gray-400">
                Marca las áreas en las que trabajaste hoy con un simple click
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 0 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-emotional to-social rounded-full flex items-center justify-center text-3xl font-bold text-navy-950 mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Construye Rachas</h3>
              <p className="text-gray-400">
                Mantén tu streak activo y observa tu progreso crecer día a día
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-spiritual to-material rounded-full flex items-center justify-center text-3xl font-bold text-navy-950 mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Alcanza el Balance</h3>
              <p className="text-gray-400">
                Visualiza tu equilibrio y mejora donde más lo necesitas
              </p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-r from-physical/20 via-mental/20 to-spiritual/20 rounded-3xl border border-white/10 p-12 text-center"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Comienza tu Viaje hacia el Equilibrio
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Únete a miles de personas que ya están transformando sus vidas
          </p>
          <Link href="/register">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-10 py-4 bg-gradient-to-r from-physical to-spiritual text-white font-bold rounded-full text-lg hover:shadow-lg hover:shadow-physical/25 transition-all"
            >
              Crear Cuenta Gratis
            </motion.button>
          </Link>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-400">
            <p className="mb-2">© 2024 AXIS6. Todos los derechos reservados.</p>
            <p className="text-sm">
              Hecho con ❤️ para ayudarte a alcanzar tu máximo potencial
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
'use client'

import { motion } from 'framer-motion'

interface AxisIconProps {
  axis: string
  size?: number
  animated?: boolean
  color?: string
}

// SVG personalizado para cada eje siguiendo el sistema ritualizado
const icons = {
  physical: {
    // Movimiento Vivo - Silueta dinámica con latido
    path: (
      <>
        <motion.path
          d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2Z"
          fill="currentColor"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <motion.path
          d="M19 8.5L15.5 7L13.5 9L12 7.5L10.5 9L8.5 7L5 8.5L7.5 10.5L6.5 15L8.5 16L10 13L12 15L14 13L15.5 16L17.5 15L16.5 10.5L19 8.5Z"
          fill="currentColor"
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.path
          d="M10 17L8 22H10L12 19L14 22H16L14 17"
          fill="currentColor"
        />
      </>
    ),
    viewBox: "0 0 24 24"
  },
  mental: {
    // Claridad Interna - Niebla despejándose
    path: (
      <>
        <motion.circle
          cx="12" cy="12" r="9"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.3"
          animate={{ opacity: [0.3, 0.1, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.path
          d="M12 8C14.21 8 16 9.79 16 12C16 14.21 14.21 16 12 16C9.79 16 8 14.21 8 12C8 9.79 9.79 8 12 8Z"
          fill="currentColor"
          animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.circle
          cx="12" cy="12" r="2"
          fill="currentColor"
        />
      </>
    ),
    viewBox: "0 0 24 24"
  },
  art: {
    // Expresión Creadora - Pincel con trazo libre expandiéndose
    path: (
      <>
        <motion.path
          d="M12 2L14 7L19 7L15 11L17 16L12 13L7 16L9 11L5 7L10 7L12 2Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.circle
          cx="12" cy="12" r="3"
          fill="currentColor"
          animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      </>
    ),
    viewBox: "0 0 24 24"
  },
  social: {
    // Vínculo Espejo - Círculos entrelazados con onda
    path: (
      <>
        <motion.circle
          cx="9" cy="12" r="4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          animate={{ x: [0, 2, -2, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.circle
          cx="15" cy="12" r="4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          animate={{ x: [0, -2, 2, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.path
          d="M12 8.5V15.5"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.5"
        />
      </>
    ),
    viewBox: "0 0 24 24"
  },
  spiritual: {
    // Presencia Elevada - Luz vertical con aura pulsante
    path: (
      <>
        <motion.path
          d="M12 2L12 22"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.3"
        />
        <motion.circle
          cx="12" cy="12" r="8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.2"
          animate={{
            r: [8, 10, 8],
            opacity: [0.2, 0.4, 0.2]
          }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.circle
          cx="12" cy="12" r="5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          opacity="0.5"
          animate={{
            r: [5, 6, 5],
            opacity: [0.5, 0.8, 0.5]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.circle
          cx="12" cy="12" r="2"
          fill="currentColor"
          animate={{
            scale: [1, 1.2, 1],
          }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      </>
    ),
    viewBox: "0 0 24 24"
  },
  material: {
    // Sustento Terrenal - Cubo/ancla con vibración
    path: (
      <>
        <motion.rect
          x="7" y="7" width="10" height="10"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          animate={{
            rotate: [0, -2, 2, -2, 2, 0]
          }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatDelay: 2
          }}
        />
        <motion.path
          d="M12 7V2M12 22V17M7 12H2M22 12H17"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.3"
        />
        <motion.circle
          cx="12" cy="12" r="2"
          fill="currentColor"
        />
      </>
    ),
    viewBox: "0 0 24 24"
  }
}

export default function AxisIcon({ axis, size = 24, animated = true, color = "currentColor" }: AxisIconProps) {
  const icon = icons[axis as keyof typeof icons]

  if (!icon) {
    return null
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={icon.viewBox}
      fill="none"
      style={{ color }}
    >
      {animated ? icon.path : (
        <g>
          {icon.path}
        </g>
      )}
    </svg>
  )
}

// Componente para mostrar todos los iconos en una grilla
export function AxisIconGrid() {
  const axes = [
    { key: 'physical', label: 'Movimiento Vivo', color: '#C85729' },
    { key: 'mental', label: 'Claridad Interna', color: '#6B7280' },
    { key: 'art', label: 'Expresión Creadora', color: '#A78BFA' },
    { key: 'social', label: 'Vínculo Espejo', color: '#10B981' },
    { key: 'spiritual', label: 'Presencia Elevada', color: '#4C1D95' },
    { key: 'material', label: 'Sustento Terrenal', color: '#B45309' }
  ]

  return (
    <div className="grid grid-cols-3 gap-6">
      {axes.map((axis) => (
        <motion.div
          key={axis.key}
          className="flex flex-col items-center gap-3 p-4 rounded-xl bg-white/80 backdrop-blur-sm"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <AxisIcon
            axis={axis.key}
            size={48}
            color={axis.color}
          />
          <span className="text-sm font-medium text-gray-700">
            {axis.label}
          </span>
        </motion.div>
      ))}
    </div>
  )
}

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AXIS6 - Equilibrio en 6 Dimensiones',
  description: 'Transforma tu vida alcanzando el equilibrio perfecto en las 6 dimensiones esenciales: Física, Mental, Emocional, Social, Espiritual y Material.',
  keywords: 'bienestar, equilibrio, productividad, salud mental, desarrollo personal, hábitos',
  authors: [{ name: 'AXIS6' }],
  openGraph: {
    title: 'AXIS6 - Equilibrio en 6 Dimensiones',
    description: 'Seis ejes. Un solo tú. No rompas tu Axis.',
    type: 'website',
    locale: 'es_ES',
    url: 'https://axis6.app',
    siteName: 'AXIS6',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${inter.className} antialiased bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
// Simple logger for AXIS6
export const logger = {
  info: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      try {
        console.log(`ℹ️ ${message}`, data || '')
      } catch (e) {
        console.log(`ℹ️ ${message}`)
      }
    }
  },
  error: (message: string, error?: any) => {
    if (process.env.NODE_ENV === 'development') {
      try {
        console.error(`❌ ${message}`, error || '')
      } catch (e) {
        console.error(`❌ ${message}`)
      }
    }
  },
  warn: (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      try {
        console.warn(`⚠️ ${message}`, data || '')
      } catch (e) {
        console.warn(`⚠️ ${message}`)
      }
    }
  }
}

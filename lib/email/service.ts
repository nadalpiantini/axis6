import { Resend } from 'resend'
import { WelcomeEmail } from './templates/welcome'
import { PasswordResetEmail } from './templates/password-reset'
import { WeeklyStatsEmail } from './templates/weekly-stats'

// Initialize Resend only if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export type EmailType = 'welcome' | 'password-reset' | 'weekly-stats' | 'reminder'

export interface EmailData {
  to: string
  type: EmailType
  data: any
}

export interface WelcomeEmailData {
  name: string
  email: string
}

export interface PasswordResetEmailData {
  name: string
  email: string
  resetUrl: string
}

export interface WeeklyStatsEmailData {
  name: string
  email: string
  weeklyStats: {
    totalCheckins: number
    completionRate: number
    currentStreaks: Array<{
      category: string
      streak: number
      color: string
    }>
    bestCategory: string
    weeklyProgress: number
  }
}

class EmailService {
  private fromEmail = process.env.RESEND_FROM_EMAIL || 'noreply@axis6.app'
  
  async sendWelcome(data: WelcomeEmailData) {
    if (!process.env.RESEND_API_KEY) {
      console.log('📧 [DEV] Welcome email would be sent to:', data.email)
      return { success: true, id: 'dev-mode' }
    }

    try {
      const result = await resend!.emails.send({
        from: `AXIS6 <${this.fromEmail}>`,
        to: data.email,
        subject: '¡Bienvenido a AXIS6! Tu viaje de equilibrio comienza ahora',
        react: WelcomeEmail({ name: data.name }),
        tags: [
          { name: 'category', value: 'authentication' },
          { name: 'type', value: 'welcome' }
        ]
      })

      console.log('📧 Welcome email sent:', result.data?.id)
      return { success: true, id: result.data?.id }
    } catch (error: any) {
      console.error('❌ Failed to send welcome email:', error)
      return { success: false, error: error.message }
    }
  }

  async sendPasswordReset(data: PasswordResetEmailData) {
    if (!process.env.RESEND_API_KEY) {
      console.log('📧 [DEV] Password reset email would be sent to:', data.email)
      console.log('📧 [DEV] Reset URL:', data.resetUrl)
      return { success: true, id: 'dev-mode' }
    }

    try {
      const result = await resend!.emails.send({
        from: `AXIS6 Security <${this.fromEmail}>`,
        to: data.email,
        subject: 'Restablece tu contraseña de AXIS6',
        react: PasswordResetEmail({ 
          name: data.name, 
          resetUrl: data.resetUrl 
        }),
        tags: [
          { name: 'category', value: 'security' },
          { name: 'type', value: 'password-reset' }
        ]
      })

      console.log('📧 Password reset email sent:', result.data?.id)
      return { success: true, id: result.data?.id }
    } catch (error: any) {
      console.error('❌ Failed to send password reset email:', error)
      return { success: false, error: error.message }
    }
  }

  async sendWeeklyStats(data: WeeklyStatsEmailData) {
    if (!process.env.RESEND_API_KEY) {
      console.log('📧 [DEV] Weekly stats email would be sent to:', data.email)
      return { success: true, id: 'dev-mode' }
    }

    try {
      const result = await resend!.emails.send({
        from: `AXIS6 Stats <${this.fromEmail}>`,
        to: data.email,
        subject: `📊 Tu resumen semanal AXIS6 - ${data.weeklyStats.totalCheckins} check-ins`,
        react: WeeklyStatsEmail({
          name: data.name,
          stats: data.weeklyStats
        }),
        tags: [
          { name: 'category', value: 'engagement' },
          { name: 'type', value: 'weekly-stats' }
        ]
      })

      console.log('📧 Weekly stats email sent:', result.data?.id)
      return { success: true, id: result.data?.id }
    } catch (error: any) {
      console.error('❌ Failed to send weekly stats email:', error)
      return { success: false, error: error.message }
    }
  }

  async sendTestEmail(to: string) {
    if (!process.env.RESEND_API_KEY) {
      console.log('📧 [DEV] Test email would be sent to:', to)
      return { success: true, id: 'dev-mode' }
    }

    try {
      const result = await resend!.emails.send({
        from: `AXIS6 Test <${this.fromEmail}>`,
        to,
        subject: 'AXIS6 Email Configuration Test',
        html: `
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: system-ui, sans-serif;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1e293b; margin: 0; font-size: 28px;">AXIS6</h1>
              <p style="color: #64748b; margin: 5px 0 0 0;">Seis ejes. Un solo tú.</p>
            </div>
            
            <div style="background: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
              <h2 style="color: #0f172a; margin: 0 0 16px 0; font-size: 20px;">🎉 Email Configuration Successful!</h2>
              <p style="color: #334155; margin: 0; line-height: 1.6;">
                This is a test email to verify that your AXIS6 email configuration is working correctly. 
                If you received this email, your Resend integration is properly set up!
              </p>
            </div>
            
            <div style="text-align: center; padding: 20px 0; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; margin: 0; font-size: 14px;">
                Sent from AXIS6 - Your wellness tracking companion
              </p>
            </div>
          </div>
        `,
        tags: [
          { name: 'category', value: 'testing' },
          { name: 'type', value: 'configuration-test' }
        ]
      })

      console.log('📧 Test email sent:', result.data?.id)
      return { success: true, id: result.data?.id }
    } catch (error: any) {
      console.error('❌ Failed to send test email:', error)
      return { success: false, error: error.message }
    }
  }
}

// Singleton instance
export const emailService = new EmailService()

// Environment validation
export const isEmailConfigured = () => {
  return !!(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL)
}

export const getEmailConfig = () => {
  return {
    apiKey: !!process.env.RESEND_API_KEY,
    fromEmail: process.env.RESEND_FROM_EMAIL || 'noreply@axis6.app',
    configured: isEmailConfigured()
  }
}
import { Resend } from 'resend'
import { WelcomeEmail } from './templates/welcome'
import { PasswordResetEmail } from './templates/password-reset'
import { WeeklyStatsEmail } from './templates/weekly-stats'
import { NotificationEmail } from './templates/notification'
import { reportError, reportEvent } from '@/lib/monitoring/error-tracking'
import { logger } from '@/lib/logger'

// Initialize Resend only if API key is available
const resend = process.env['RESEND_API_KEY'] ? new Resend(process.env['RESEND_API_KEY']) : null

export type EmailType = 'welcome' | 'password-reset' | 'weekly-stats' | 'notification' | 'reminder'

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

export interface NotificationEmailData {
  name: string
  email: string
  type: 'streak-milestone' | 'weekly-reminder' | 'goal-completed' | 'system-update'
  title: string
  message: string
  actionText?: string
  actionUrl?: string
  data?: Record<string, any>
}

class EmailService {
  private fromEmail = process.env['RESEND_FROM_EMAIL'] || 'noreply@axis6.app'
  
  async sendWelcome(data: WelcomeEmailData) {
    if (!process.env['RESEND_API_KEY']) {
      logger.info('Email service in development mode', { type: 'welcome', to: data.email })
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

      logger.info('Welcome email sent successfully', { 
        emailId: result.data?.id, 
        to: data.email,
        name: data.name 
      })
      
      reportEvent('email_sent', {
        type: 'welcome',
        emailId: result.data?.id,
        recipient: data.email.split('@')[1], // Domain only for privacy
      })

      return { success: true, id: result.data?.id }
    } catch (error: any) {
      logger.error('Failed to send welcome email', {
        error,
        to: data.email,
        name: data.name
      })
      
      reportError(error, 'high', {
        component: 'EmailService',
        action: 'send_welcome',
        metadata: {
          emailType: 'welcome',
          recipient: data.email.split('@')[1],
          error: error.message
        }
      })

      return { success: false, error: error.message }
    }
  }

  async sendPasswordReset(data: PasswordResetEmailData) {
    if (!process.env['RESEND_API_KEY']) {
      logger.info('Password reset email would be sent (DEV)', { email: data.email, resetUrl: data.resetUrl })
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

      logger.info('Password reset email sent', { emailId: result.data?.id })
      return { success: true, id: result.data?.id }
    } catch (error: any) {
      logger.error('Failed to send password reset email', error)
      return { success: false, error: error.message }
    }
  }

  async sendWeeklyStats(data: WeeklyStatsEmailData) {
    if (!process.env['RESEND_API_KEY']) {
      logger.info('Weekly stats email would be sent (DEV)', { email: data.email })
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

      logger.info('Weekly stats email sent', { emailId: result.data?.id })
      return { success: true, id: result.data?.id }
    } catch (error: any) {
      logger.error('Failed to send weekly stats email', error)
      return { success: false, error: error.message }
    }
  }

  async sendNotification(data: NotificationEmailData) {
    if (!process.env['RESEND_API_KEY']) {
      logger.info('Email service in development mode', { 
        type: 'notification', 
        notificationType: data.type,
        to: data.email 
      })
      return { success: true, id: 'dev-mode' }
    }

    try {
      const subject = getNotificationSubject(data.type, data.title)
      
      const result = await resend!.emails.send({
        from: `AXIS6 <${this.fromEmail}>`,
        to: data.email,
        subject,
        react: NotificationEmail({
          name: data.name,
          type: data.type,
          title: data.title,
          message: data.message,
          actionText: data.actionText,
          actionUrl: data.actionUrl,
          data: data.data
        }),
        tags: [
          { name: 'category', value: 'engagement' },
          { name: 'type', value: 'notification' },
          { name: 'notification_type', value: data.type }
        ]
      })

      logger.info('Notification email sent successfully', { 
        emailId: result.data?.id, 
        to: data.email,
        notificationType: data.type,
        title: data.title
      })
      
      reportEvent('email_sent', {
        type: 'notification',
        notificationType: data.type,
        emailId: result.data?.id,
        recipient: data.email.split('@')[1],
      })

      return { success: true, id: result.data?.id }
    } catch (error: any) {
      logger.error('Failed to send notification email', {
        error,
        to: data.email,
        notificationType: data.type,
        title: data.title
      })
      
      reportError(error, 'high', {
        component: 'EmailService',
        action: 'send_notification',
        metadata: {
          emailType: 'notification',
          notificationType: data.type,
          recipient: data.email.split('@')[1],
          error: error.message
        }
      })

      return { success: false, error: error.message }
    }
  }

  async sendTestEmail(to: string) {
    if (!process.env['RESEND_API_KEY']) {
      logger.info('Email service in development mode', { type: 'test', to })
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

      logger.info('Test email sent successfully', { emailId: result.data?.id, to })
      return { success: true, id: result.data?.id }
    } catch (error: any) {
      logger.error('Failed to send test email', { error, to })
      return { success: false, error: error.message }
    }
  }
}

// Helper function for notification subjects
function getNotificationSubject(type: string, title: string): string {
  const subjects = {
    'streak-milestone': `🔥 ${title} - ¡Nueva racha alcanzada en AXIS6!`,
    'weekly-reminder': `📊 ${title} - Tu progreso semanal en AXIS6`,
    'goal-completed': `🎯 ${title} - ¡Meta completada en AXIS6!`,
    'system-update': `📢 ${title} - Actualización de AXIS6`
  }
  return subjects[type as keyof typeof subjects] || `AXIS6 - ${title}`
}

// Singleton instance
export const emailService = new EmailService()

// Environment validation
export const isEmailConfigured = () => {
  return !!(process.env['RESEND_API_KEY'] && process.env['RESEND_FROM_EMAIL'])
}

export const getEmailConfig = () => {
  return {
    apiKey: !!process.env['RESEND_API_KEY'],
    fromEmail: process.env['RESEND_FROM_EMAIL'] || 'noreply@axis6.app',
    configured: isEmailConfigured()
  }
}
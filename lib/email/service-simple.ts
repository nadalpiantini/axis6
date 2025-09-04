import { Resend } from 'resend'
import { logger } from '@/lib/logger'
// Initialize Resend with API key
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
export interface EmailOptions {
  to: string
  type: 'welcome' | 'password-reset' | 'notification' | 'test'
  data: {
    name?: string
    email?: string
    resetUrl?: string
    title?: string
    message?: string
  }
}
export async function sendEmail(options: EmailOptions) {
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'hello@axis6.app'
  if (!resend) {
    logger.info('Email would be sent (DEV MODE)', {
      to: options.to,
      type: options.type,
      data: options.data
    })
    return { success: true, id: 'dev-mode' }
  }
  try {
    let subject = ''
    let html = ''
    switch (options.type) {
      case 'welcome':
        subject = '¡Bienvenido a AXIS6! 🎯'
        html = getWelcomeEmailHtml(options.data.name || 'Usuario')
        break
      case 'password-reset':
        subject = 'Restablecer contraseña - AXIS6'
        html = getPasswordResetHtml(options.data.name || 'Usuario', options.data.resetUrl || '')
        break
      case 'notification':
        subject = options.data.title || 'Notificación de AXIS6'
        html = getNotificationHtml(options.data.name || 'Usuario', options.data.message || '')
        break
      case 'test':
        subject = '🎉 Test de email AXIS6'
        html = getTestEmailHtml()
        break
    }
    const result = await resend.emails.send({
      from: `AXIS6 <${fromEmail}>`,
      to: options.to,
      subject,
      html,
      tags: [
        { name: 'type', value: options.type },
        { name: 'app', value: 'axis6' }
      ]
    })
    logger.info('Email sent successfully', { emailId: result.data?.id })
    return { success: true, id: result.data?.id }
  } catch (error: any) {
    logger.error('Failed to send email', error)
    return { success: false, error: error.message }
  }
}
// Email Templates
function getWelcomeEmailHtml(name: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
      <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1);">
              <!-- Header -->
              <tr>
                <td style="padding: 40px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                  <h1 style="margin: 0; color: white; font-size: 32px; font-weight: 700;">AXIS6</h1>
                  <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Six axes. One you. Don't break your Axis.</p>
                </td>
              </tr>
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="margin: 0 0 20px 0; color: #1a202c; font-size: 24px;">¡Hola ${name}! 👋</h2>
                  <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    Bienvenido a AXIS6, tu compañero personal para alcanzar el equilibrio perfecto en las 6 dimensiones esenciales de tu vida.
                  </p>
                  <div style="background: #f7fafc; border-radius: 12px; padding: 24px; margin: 30px 0;">
                    <h3 style="margin: 0 0 16px 0; color: #2d3748; font-size: 18px;">Tus 6 Dimensiones:</h3>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="50%" style="padding: 8px 0;">
                          <span style="display: inline-block; width: 12px; height: 12px; background: #9f7aea; border-radius: 50%; margin-right: 8px;"></span>
                          <span style="color: #4a5568;">🧘 Espiritual</span>
                        </td>
                        <td width="50%" style="padding: 8px 0;">
                          <span style="display: inline-block; width: 12px; height: 12px; background: #4299e1; border-radius: 50%; margin-right: 8px;"></span>
                          <span style="color: #4a5568;">🧠 Mental</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="display: inline-block; width: 12px; height: 12px; background: #f56565; border-radius: 50%; margin-right: 8px;"></span>
                          <span style="color: #4a5568;">❤️ Emocional</span>
                        </td>
                        <td style="padding: 8px 0;">
                          <span style="display: inline-block; width: 12px; height: 12px; background: #48bb78; border-radius: 50%; margin-right: 8px;"></span>
                          <span style="color: #4a5568;">👥 Social</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <span style="display: inline-block; width: 12px; height: 12px; background: #ed8936; border-radius: 50%; margin-right: 8px;"></span>
                          <span style="color: #4a5568;">💪 Físico</span>
                        </td>
                        <td style="padding: 8px 0;">
                          <span style="display: inline-block; width: 12px; height: 12px; background: #ecc94b; border-radius: 50%; margin-right: 8px;"></span>
                          <span style="color: #4a5568;">💼 Material</span>
                        </td>
                      </tr>
                    </table>
                  </div>
                  <div style="text-align: center; margin: 40px 0;">
                    <a href="https://axis6.app/dashboard" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Comenzar ahora</a>
                  </div>
                  <p style="color: #718096; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                    Comienza con solo 5 minutos al día. Marca tus check-ins diarios, mantén tus rachas y observa cómo tu vida se transforma.
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="padding: 30px; background: #f7fafc; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="margin: 0; color: #718096; font-size: 14px;">
                    © 2024 AXIS6. Todos los derechos reservados.
                  </p>
                  <p style="margin: 10px 0 0 0; color: #a0aec0; font-size: 12px;">
                    Este email fue enviado a ${name}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}
function getPasswordResetHtml(name: string, resetUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <body style="margin: 0; padding: 20px; font-family: -apple-system, sans-serif; background: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px;">
        <h1 style="color: #1a202c; margin: 0 0 20px 0;">Restablecer contraseña</h1>
        <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
          Hola ${name},<br><br>
          Recibimos una solicitud para restablecer tu contraseña en AXIS6.
          Haz clic en el siguiente enlace para crear una nueva contraseña:
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px;">
            Restablecer contraseña
          </a>
        </div>
        <p style="color: #718096; font-size: 14px;">
          Si no solicitaste este cambio, puedes ignorar este email.
        </p>
      </div>
    </body>
    </html>
  `
}
function getNotificationHtml(name: string, message: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <body style="margin: 0; padding: 20px; font-family: -apple-system, sans-serif; background: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px;">
        <h2 style="color: #1a202c;">Hola ${name},</h2>
        <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">${message}</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://axis6.app/dashboard" style="display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 6px;">
            Ver en AXIS6
          </a>
        </div>
      </div>
    </body>
    </html>
  `
}
function getTestEmailHtml(): string {
  return `
    <!DOCTYPE html>
    <html>
    <body style="margin: 0; padding: 20px; font-family: -apple-system, sans-serif; background: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; text-align: center;">
        <h1 style="color: #667eea; margin: 0 0 20px 0;">🎉 ¡Test exitoso!</h1>
        <p style="color: #4a5568; font-size: 16px; line-height: 1.6;">
          Tu configuración de email con Resend está funcionando correctamente.
          <br><br>
          AXIS6 ahora puede enviar emails de:
        </p>
        <ul style="list-style: none; padding: 0; margin: 20px 0;">
          <li style="padding: 8px; color: #48bb78;">✅ Bienvenida</li>
          <li style="padding: 8px; color: #48bb78;">✅ Restablecimiento de contraseña</li>
          <li style="padding: 8px; color: #48bb78;">✅ Notificaciones</li>
          <li style="padding: 8px; color: #48bb78;">✅ Recordatorios</li>
        </ul>
        <p style="color: #718096; font-size: 14px; margin-top: 30px;">
          Enviado desde AXIS6 con ❤️
        </p>
      </div>
    </body>
    </html>
  `
}

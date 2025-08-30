import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import * as React from 'react'

interface NotificationEmailProps {
  name: string
  type: 'streak-milestone' | 'weekly-reminder' | 'goal-completed' | 'system-update'
  title: string
  message: string
  actionText?: string
  actionUrl?: string
  data?: Record<string, any>
}

const baseUrl = process.env['NEXT_PUBLIC_APP_URL'] || 'https://axis6.app'

export const NotificationEmail = ({
  name = 'Usuario',
  type = 'weekly-reminder',
  title,
  message,
  actionText,
  actionUrl,
  data = {}
}: NotificationEmailProps) => {
  const previewText = getPreviewText(type, title)
  const { emoji, color, bgColor } = getNotificationStyle(type)

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Img
              src={`${baseUrl}/logo-email.png`}
              width="40"
              height="40"
              alt="AXIS6"
              style={logo}
            />
            <Text style={brandText}>AXIS6</Text>
            <Text style={tagline}>Seis ejes. Un solo tú.</Text>
          </Section>

          {/* Main Content */}
          <Section style={{ ...notificationBox, backgroundColor: bgColor }}>
            <Text style={notificationEmoji}>{emoji}</Text>
            <Text style={{ ...heading, color }}>{title}</Text>
            <Text style={paragraph}>{message}</Text>

            {/* Dynamic content based on notification type */}
            {type === 'streak-milestone' && data.streak && (
              <Section style={statsSection}>
                <Text style={statsText}>
                  🔥 <strong>{data.streak} días</strong> consecutivos
                </Text>
                <Text style={statsSubtext}>
                  ¡Increíble consistencia! Sigue así.
                </Text>
              </Section>
            )}

            {type === 'weekly-reminder' && data.completionRate && (
              <Section style={statsSection}>
                <Text style={statsText}>
                  📊 <strong>{data.completionRate}%</strong> completado esta semana
                </Text>
                <Text style={statsSubtext}>
                  {data.completionRate >= 70
                    ? '¡Excelente progreso!'
                    : 'Aún hay tiempo para mejorar'
                  }
                </Text>
              </Section>
            )}

            {/* Action Button */}
            {actionText && actionUrl && (
              <Section style={buttonContainer}>
                <Button
                  style={{ ...button, backgroundColor: color }}
                  href={actionUrl}
                >
                  {actionText}
                </Button>
              </Section>
            )}
          </Section>

          {/* Weekly Progress (if available) */}
          {data.weeklyProgress && (
            <Section style={progressSection}>
              <Text style={sectionTitle}>Tu progreso esta semana</Text>
              <Hr style={divider} />

              {data.weeklyProgress.map((item: any, index: number) => (
                <div key={index} style={progressItem}>
                  <Text style={progressCategory}>{item.category}</Text>
                  <div style={progressBarContainer}>
                    <div
                      style={{
                        ...progressBar,
                        width: `${item.percentage}%`,
                        backgroundColor: item.color || '#8b5cf6'
                      }}
                    />
                  </div>
                  <Text style={progressText}>{item.count}/7 días</Text>
                </div>
              ))}
            </Section>
          )}

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Sigue construyendo tu equilibrio en{' '}
              <Link href={baseUrl} style={footerLink}>
                AXIS6
              </Link>
            </Text>
            <Text style={footerSubtext}>
              Si no deseas recibir estas notificaciones, puedes{' '}
              <Link href={`${baseUrl}/settings`} style={footerLink}>
                gestionar tus preferencias
              </Link>
              {' '}en cualquier momento.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Helper functions
function getPreviewText(type: string, title: string): string {
  const previews = {
    'streak-milestone': `🔥 ${title} - ¡Nueva racha alcanzada!`,
    'weekly-reminder': `📊 ${title} - Tu progreso semanal`,
    'goal-completed': `🎯 ${title} - ¡Meta completada!`,
    'system-update': `📢 ${title} - Actualización de AXIS6`
  }
  return previews[type as keyof typeof previews] || title
}

function getNotificationStyle(type: string) {
  const styles = {
    'streak-milestone': { emoji: '🔥', color: '#dc2626', bgColor: '#fef2f2' },
    'weekly-reminder': { emoji: '📊', color: '#7c3aed', bgColor: '#f3f4f6' },
    'goal-completed': { emoji: '🎯', color: '#059669', bgColor: '#ecfdf5' },
    'system-update': { emoji: '📢', color: '#2563eb', bgColor: '#eff6ff' }
  }
  return styles[type as keyof typeof styles] || styles['weekly-reminder']
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  borderRadius: '8px',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
}

const header = {
  padding: '32px 32px 16px',
  textAlign: 'center' as const,
}

const logo = {
  margin: '0 auto 8px',
  borderRadius: '8px',
}

const brandText = {
  fontSize: '28px',
  fontWeight: 'bold',
  color: '#1e293b',
  margin: '0',
  lineHeight: '1.2',
}

const tagline = {
  fontSize: '14px',
  color: '#64748b',
  margin: '4px 0 0 0',
}

const notificationBox = {
  padding: '32px',
  margin: '0 32px',
  borderRadius: '12px',
  textAlign: 'center' as const,
  border: '1px solid #e2e8f0',
}

const notificationEmoji = {
  fontSize: '48px',
  margin: '0 0 16px 0',
  lineHeight: '1',
}

const heading = {
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 16px 0',
  lineHeight: '1.3',
}

const paragraph = {
  fontSize: '16px',
  lineHeight: '1.6',
  color: '#374151',
  margin: '0 0 24px 0',
}

const statsSection = {
  backgroundColor: 'rgba(255, 255, 255, 0.8)',
  padding: '20px',
  borderRadius: '8px',
  margin: '20px 0',
}

const statsText = {
  fontSize: '20px',
  fontWeight: 'bold',
  color: '#1f2937',
  margin: '0 0 8px 0',
  textAlign: 'center' as const,
}

const statsSubtext = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '0',
  textAlign: 'center' as const,
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0 0 0',
}

const button = {
  fontSize: '16px',
  fontWeight: '600',
  color: '#ffffff',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  width: '200px',
  padding: '12px 24px',
  borderRadius: '8px',
  margin: '0 auto',
}

const progressSection = {
  padding: '32px',
  margin: '0 32px',
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
}

const sectionTitle = {
  fontSize: '18px',
  fontWeight: 'bold',
  color: '#1e293b',
  margin: '0 0 16px 0',
}

const divider = {
  borderColor: '#e2e8f0',
  margin: '16px 0 24px 0',
}

const progressItem = {
  marginBottom: '16px',
}

const progressCategory = {
  fontSize: '14px',
  fontWeight: '600',
  color: '#374151',
  margin: '0 0 4px 0',
}

const progressBarContainer = {
  height: '8px',
  backgroundColor: '#e5e7eb',
  borderRadius: '4px',
  overflow: 'hidden',
  margin: '0 0 4px 0',
}

const progressBar = {
  height: '100%',
  borderRadius: '4px',
  transition: 'width 0.3s ease',
}

const progressText = {
  fontSize: '12px',
  color: '#6b7280',
  margin: '0',
  textAlign: 'right' as const,
}

const footer = {
  padding: '32px',
  textAlign: 'center' as const,
}

const footerText = {
  fontSize: '14px',
  color: '#6b7280',
  margin: '0 0 8px 0',
  lineHeight: '1.5',
}

const footerSubtext = {
  fontSize: '12px',
  color: '#9ca3af',
  margin: '0',
  lineHeight: '1.5',
}

const footerLink = {
  color: '#8b5cf6',
  textDecoration: 'none',
  fontWeight: '500',
}

export default NotificationEmail

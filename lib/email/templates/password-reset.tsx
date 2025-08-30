import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Tailwind
} from '@react-email/components'

interface PasswordResetEmailProps {
  name?: string
  resetUrl: string
}

export const PasswordResetEmail = ({
  name = 'Usuario',
  resetUrl
}: PasswordResetEmailProps) => {
  const baseUrl = process.env['NEXT_PUBLIC_APP_URL'] || 'https://axis6.app'

  return (
    <Html>
      <Head />
      <Preview>Restablece tu contraseña de AXIS6 de forma segura.</Preview>
      <Tailwind>
        <Body className="bg-slate-50 font-sans">
          <Container className="mx-auto py-8 px-4 max-w-xl">
            {/* Header */}
            <Section className="text-center mb-8">
              <Heading className="text-3xl font-bold text-slate-900 mb-2">
                AXIS6
              </Heading>
              <Text className="text-slate-600 text-sm m-0">
                Seguridad de tu cuenta
              </Text>
            </Section>

            {/* Main Content */}
            <Section className="bg-white rounded-2xl p-8 mb-6 border border-slate-200">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 text-2xl">🔐</span>
                </div>
                <Heading className="text-2xl font-semibold text-slate-900 mb-2">
                  Restablece tu contraseña
                </Heading>
                <Text className="text-slate-600 mb-0">
                  Hola {name}
                </Text>
              </div>

              <Text className="text-slate-700 mb-6 leading-relaxed">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta AXIS6.
                Si fuiste tú quien solicitó este cambio, puedes crear una nueva contraseña haciendo clic en el botón de abajo.
              </Text>

              {/* Call to Action */}
              <div className="text-center mb-6">
                <Button
                  href={resetUrl}
                  className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg inline-block no-underline"
                >
                  Restablecer mi contraseña
                </Button>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                <Text className="text-amber-800 text-sm mb-2 font-medium">
                  ⚠️ Información importante:
                </Text>
                <ul className="text-amber-700 text-sm space-y-1 m-0 pl-4">
                  <li>Este enlace es válido por 1 hora</li>
                  <li>Solo puede ser usado una vez</li>
                  <li>Si no solicitaste este cambio, ignora este email</li>
                </ul>
              </div>
            </Section>

            {/* Security Notice */}
            <Section className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
              <Heading className="text-lg font-semibold text-red-900 mb-3">
                🚨 ¿No solicitaste este cambio?
              </Heading>
              <Text className="text-red-800 text-sm mb-4">
                Si no solicitaste restablecer tu contraseña, tu cuenta podría estar en riesgo.
                Te recomendamos:
              </Text>
              <ul className="text-red-800 text-sm space-y-1 m-0 pl-4">
                <li>No hagas clic en el enlace de arriba</li>
                <li>Cambia tu contraseña inmediatamente</li>
                <li>Revisa la actividad reciente de tu cuenta</li>
                <li>Contacta a nuestro soporte si necesitas ayuda</li>
              </ul>
            </Section>

            {/* Alternative Access */}
            <Section className="text-center mb-6">
              <Text className="text-slate-600 text-sm mb-2">
                ¿El botón no funciona? Copia y pega este enlace en tu navegador:
              </Text>
              <div className="bg-slate-100 p-3 rounded-lg">
                <Link href={resetUrl} className="text-blue-600 text-sm break-all">
                  {resetUrl}
                </Link>
              </div>
            </Section>

            {/* Support Information */}
            <Section className="bg-slate-100 rounded-xl p-6 mb-6">
              <Heading className="text-lg font-semibold text-slate-900 mb-3">
                💬 ¿Necesitas ayuda?
              </Heading>
              <Text className="text-slate-700 text-sm mb-3">
                Si tienes problemas para restablecer tu contraseña o tienes preguntas sobre la seguridad de tu cuenta,
                nuestro equipo de soporte está aquí para ayudarte.
              </Text>
              <Link href={`${baseUrl}/support`} className="text-blue-600 text-sm font-medium">
                Contactar Soporte →
              </Link>
            </Section>

            {/* Footer */}
            <Section className="text-center pt-6 border-t border-slate-200">
              <Text className="text-slate-600 text-sm mb-2">
                Este email fue enviado desde AXIS6 por motivos de seguridad.
              </Text>
              <Text className="text-slate-500 text-xs mb-0">
                Si no solicitaste este cambio, puedes ignorar este mensaje de forma segura.
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export default PasswordResetEmail

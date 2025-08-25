import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Tailwind
} from '@react-email/components'

interface WelcomeEmailProps {
  name?: string
}

export const WelcomeEmail = ({ name = 'Usuario' }: WelcomeEmailProps) => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://axis6.app'
  
  return (
    <Html>
      <Head />
      <Preview>¡Bienvenido a AXIS6! Tu viaje de equilibrio comienza ahora.</Preview>
      <Tailwind>
        <Body className="bg-slate-50 font-sans">
          <Container className="mx-auto py-8 px-4 max-w-xl">
            {/* Header */}
            <Section className="text-center mb-8">
              <Heading className="text-3xl font-bold text-slate-900 mb-2">
                AXIS6
              </Heading>
              <Text className="text-slate-600 text-sm m-0">
                Seis ejes. Un solo tú. No rompas tu Axis.
              </Text>
            </Section>

            {/* Welcome Message */}
            <Section className="bg-white rounded-2xl p-8 mb-6 border border-slate-200">
              <Heading className="text-2xl font-semibold text-slate-900 mb-4 text-center">
                ¡Bienvenido, {name}!
              </Heading>
              
              <Text className="text-slate-700 mb-6 leading-relaxed">
                Nos emociona tenerte en AXIS6. Has dado el primer paso hacia una vida más equilibrada, 
                y estamos aquí para acompañarte en cada momento de tu viaje.
              </Text>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 mb-6">
                <Heading className="text-lg font-semibold text-slate-900 mb-3">
                  🎯 ¿Qué puedes hacer en AXIS6?
                </Heading>
                <ul className="space-y-2 text-slate-700 m-0 pl-0">
                  <li>✅ Realizar check-ins diarios en 6 dimensiones de bienestar</li>
                  <li>🔥 Construir y mantener rachas poderosas</li>
                  <li>📊 Visualizar tu progreso con análisis detallados</li>
                  <li>🏆 Desbloquear logros y celebrar tus hitos</li>
                  <li>🎨 Personalizar tu experiencia según tus objetivos</li>
                </ul>
              </div>
            </Section>

            {/* The 6 Dimensions */}
            <Section className="bg-white rounded-2xl p-8 mb-6 border border-slate-200">
              <Heading className="text-xl font-semibold text-slate-900 mb-4 text-center">
                Los 6 Ejes de tu Bienestar
              </Heading>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-green-600 text-lg">💪</span>
                  </div>
                  <Text className="text-sm font-medium text-slate-900 mb-1">Físico</Text>
                  <Text className="text-xs text-slate-600 m-0">Ejercicio y salud</Text>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-blue-600 text-lg">🧠</span>
                  </div>
                  <Text className="text-sm font-medium text-slate-900 mb-1">Mental</Text>
                  <Text className="text-xs text-slate-600 m-0">Aprendizaje y productividad</Text>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-red-600 text-lg">❤️</span>
                  </div>
                  <Text className="text-sm font-medium text-slate-900 mb-1">Emocional</Text>
                  <Text className="text-xs text-slate-600 m-0">Estado de ánimo</Text>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-purple-600 text-lg">👥</span>
                  </div>
                  <Text className="text-sm font-medium text-slate-900 mb-1">Social</Text>
                  <Text className="text-xs text-slate-600 m-0">Relaciones y conexiones</Text>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-indigo-600 text-lg">🧘</span>
                  </div>
                  <Text className="text-sm font-medium text-slate-900 mb-1">Espiritual</Text>
                  <Text className="text-xs text-slate-600 m-0">Meditación y propósito</Text>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-orange-600 text-lg">🎯</span>
                  </div>
                  <Text className="text-sm font-medium text-slate-900 mb-1">Propósito</Text>
                  <Text className="text-xs text-slate-600 m-0">Metas y logros</Text>
                </div>
              </div>
            </Section>

            {/* Call to Action */}
            <Section className="text-center mb-6">
              <Button
                href={`${baseUrl}/dashboard`}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg inline-block no-underline"
              >
                Comenzar mi primer check-in
              </Button>
            </Section>

            {/* Quick Tips */}
            <Section className="bg-slate-100 rounded-xl p-6 mb-6">
              <Heading className="text-lg font-semibold text-slate-900 mb-3">
                💡 Consejos para comenzar
              </Heading>
              <ul className="space-y-2 text-slate-700 text-sm m-0 pl-0">
                <li>🌅 Haz tu check-in a la misma hora cada día</li>
                <li>📝 Usa las notas para reflexionar sobre tu día</li>
                <li>🎯 Comienza con metas pequeñas y alcanzables</li>
                <li>🔥 Celebra cada racha, sin importar cuán pequeña sea</li>
              </ul>
            </Section>

            {/* Footer */}
            <Section className="text-center pt-6 border-t border-slate-200">
              <Text className="text-slate-600 text-sm mb-2">
                ¿Necesitas ayuda? Estamos aquí para ti.
              </Text>
              <Link href={`${baseUrl}/support`} className="text-blue-600 text-sm">
                Centro de Ayuda
              </Link>
              <Text className="text-slate-500 text-xs mt-4 mb-0">
                AXIS6 - Tu compañero de bienestar
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export default WelcomeEmail
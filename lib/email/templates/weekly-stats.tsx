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

interface WeeklyStatsEmailProps {
  name?: string
  stats: {
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

export const WeeklyStatsEmail = ({ 
  name = 'Usuario',
  stats
}: WeeklyStatsEmailProps) => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://axis6.app'
  
  const getEncouragementMessage = (completionRate: number) => {
    if (completionRate >= 90) return "¡Increíble! Estás en fuego 🔥"
    if (completionRate >= 70) return "¡Excelente progreso! Sigue así 💪"
    if (completionRate >= 50) return "¡Buen trabajo! Vas por buen camino 🎯"
    if (completionRate >= 30) return "Cada paso cuenta, sigue adelante 🌱"
    return "Un nuevo día es una nueva oportunidad ✨"
  }

  const getProgressColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-500'
    if (rate >= 60) return 'bg-blue-500'
    if (rate >= 40) return 'bg-yellow-500'
    return 'bg-gray-400'
  }
  
  return (
    <Html>
      <Head />
      <Preview>{`Tu resumen semanal AXIS6 - ${stats.totalCheckins} check-ins completados`}</Preview>
      <Tailwind>
        <Body className="bg-slate-50 font-sans">
          <Container className="mx-auto py-8 px-4 max-w-xl">
            {/* Header */}
            <Section className="text-center mb-8">
              <Heading className="text-3xl font-bold text-slate-900 mb-2">
                AXIS6
              </Heading>
              <Text className="text-slate-600 text-sm m-0">
                Tu resumen semanal está listo
              </Text>
            </Section>

            {/* Greeting */}
            <Section className="text-center mb-6">
              <div className="text-4xl mb-3">📊</div>
              <Heading className="text-2xl font-semibold text-slate-900 mb-2">
                ¡Hola, {name}!
              </Heading>
              <Text className="text-slate-600 text-lg">
                {getEncouragementMessage(stats.completionRate)}
              </Text>
            </Section>

            {/* Main Stats */}
            <Section className="bg-white rounded-2xl p-8 mb-6 border border-slate-200">
              <Heading className="text-xl font-semibold text-slate-900 mb-6 text-center">
                Tu semana en números
              </Heading>
              
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {stats.totalCheckins}
                  </div>
                  <Text className="text-slate-600 text-sm m-0">
                    Check-ins totales
                  </Text>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {Math.round(stats.completionRate)}%
                  </div>
                  <Text className="text-slate-600 text-sm m-0">
                    Tasa de completitud
                  </Text>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <Text className="text-sm font-medium text-slate-900">Progreso semanal</Text>
                  <Text className="text-sm text-slate-600">{Math.round(stats.completionRate)}%</Text>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(stats.completionRate)}`}
                    style={{ width: `${Math.min(stats.completionRate, 100)}%` }}
                  ></div>
                </div>
              </div>
            </Section>

            {/* Current Streaks */}
            {stats.currentStreaks.length > 0 && (
              <Section className="bg-white rounded-2xl p-8 mb-6 border border-slate-200">
                <Heading className="text-xl font-semibold text-slate-900 mb-4">
                  🔥 Rachas activas
                </Heading>
                
                <div className="space-y-3">
                  {stats.currentStreaks.map((streak, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded-full mr-3"
                          style={{ backgroundColor: streak.color }}
                        ></div>
                        <Text className="font-medium text-slate-900 m-0">
                          {streak.category}
                        </Text>
                      </div>
                      <div className="text-right">
                        <Text className="text-lg font-bold text-orange-600 m-0">
                          {streak.streak}
                        </Text>
                        <Text className="text-xs text-slate-600 m-0">
                          días
                        </Text>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Best Category */}
            {stats.bestCategory && (
              <Section className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-8 mb-6 border border-purple-100">
                <div className="text-center">
                  <div className="text-4xl mb-3">🏆</div>
                  <Heading className="text-lg font-semibold text-slate-900 mb-2">
                    Categoría destacada
                  </Heading>
                  <Text className="text-2xl font-bold text-purple-600 mb-2">
                    {stats.bestCategory}
                  </Text>
                  <Text className="text-slate-600 text-sm m-0">
                    ¡Tu mejor desempeño esta semana!
                  </Text>
                </div>
              </Section>
            )}

            {/* Motivational Section */}
            <Section className="bg-white rounded-2xl p-8 mb-6 border border-slate-200">
              <Heading className="text-xl font-semibold text-slate-900 mb-4">
                💡 Para la próxima semana
              </Heading>
              
              <div className="space-y-3 text-slate-700 text-sm">
                {stats.completionRate >= 80 ? (
                  <>
                    <Text className="m-0">• Mantén este ritmo excepcional</Text>
                    <Text className="m-0">• Considera añadir nuevos desafíos personales</Text>
                    <Text className="m-0">• Comparte tu éxito con otros para inspirarlos</Text>
                  </>
                ) : stats.completionRate >= 50 ? (
                  <>
                    <Text className="m-0">• Identifica qué días son más difíciles y prepárate</Text>
                    <Text className="m-0">• Establece recordatorios para los check-ins</Text>
                    <Text className="m-0">• Celebra tus pequeñas victorias diarias</Text>
                  </>
                ) : (
                  <>
                    <Text className="m-0">• Empieza con una sola categoría cada día</Text>
                    <Text className="m-0">• Crea una rutina sencilla y sostenible</Text>
                    <Text className="m-0">• Recuerda: la consistencia es más importante que la perfección</Text>
                  </>
                )}
              </div>
            </Section>

            {/* Call to Action */}
            <Section className="text-center mb-6">
              <Button
                href={`${baseUrl}/dashboard`}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg inline-block no-underline"
              >
                Ver mi dashboard
              </Button>
            </Section>

            {/* Weekly Quote/Tip */}
            <Section className="bg-slate-100 rounded-xl p-6 mb-6">
              <div className="text-center">
                <div className="text-2xl mb-3">🌟</div>
                <Text className="text-slate-800 font-medium italic mb-2">
                  "El éxito es la suma de pequeños esfuerzos repetidos día tras día."
                </Text>
                <Text className="text-slate-600 text-sm m-0">
                  - Robert Collier
                </Text>
              </div>
            </Section>

            {/* Footer */}
            <Section className="text-center pt-6 border-t border-slate-200">
              <Text className="text-slate-600 text-sm mb-4">
                ¿Quieres cambiar la frecuencia de estos emails?
              </Text>
              <div className="space-x-4">
                <Link href={`${baseUrl}/settings/notifications`} className="text-blue-600 text-sm">
                  Configurar notificaciones
                </Link>
                <span className="text-slate-400">•</span>
                <Link href={`${baseUrl}/analytics`} className="text-blue-600 text-sm">
                  Ver análisis completo
                </Link>
              </div>
              <Text className="text-slate-500 text-xs mt-4 mb-0">
                AXIS6 - Mantén tu equilibrio, una semana a la vez
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

export default WeeklyStatsEmail
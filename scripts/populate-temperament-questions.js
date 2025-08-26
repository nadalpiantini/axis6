#!/usr/bin/env node
/**
 * AXIS6 Temperament Questions Populator
 * Fixes empty questions table that causes profile page crashes
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const temperamentQuestions = [
  {
    question_text: {
      "en": "When working on a project, you prefer to:",
      "es": "Cuando trabajas en un proyecto, prefieres:"
    },
    question_type: "work_style",
    options: [
      {
        text: { "en": "Work with a team and brainstorm ideas", "es": "Trabajar con un equipo e intercambiar ideas" },
        temperament: "sanguine",
        weight: 1.0
      },
      {
        text: { "en": "Take charge and lead the project", "es": "Tomar el control y liderar el proyecto" },
        temperament: "choleric", 
        weight: 1.0
      },
      {
        text: { "en": "Plan carefully and work methodically", "es": "Planificar cuidadosamente y trabajar metódicamente" },
        temperament: "melancholic",
        weight: 1.0
      },
      {
        text: { "en": "Support others and maintain harmony", "es": "Apoyar a otros y mantener la armonía" },
        temperament: "phlegmatic",
        weight: 1.0
      }
    ],
    order_index: 1
  },
  {
    question_text: {
      "en": "In social situations, you tend to:",
      "es": "En situaciones sociales, tiendes a:"
    },
    question_type: "social",
    options: [
      {
        text: { "en": "Be the center of attention and entertain others", "es": "Ser el centro de atención y entretener a otros" },
        temperament: "sanguine",
        weight: 1.0
      },
      {
        text: { "en": "Take control of conversations and guide them", "es": "Tomar control de las conversaciones y dirigirlas" },
        temperament: "choleric",
        weight: 1.0
      },
      {
        text: { "en": "Listen carefully and contribute thoughtfully", "es": "Escuchar cuidadosamente y contribuir reflexivamente" },
        temperament: "melancholic",
        weight: 1.0
      },
      {
        text: { "en": "Stay calm and keep conversations peaceful", "es": "Mantener la calma y las conversaciones pacíficas" },
        temperament: "phlegmatic", 
        weight: 1.0
      }
    ],
    order_index: 2
  },
  {
    question_text: {
      "en": "When making decisions, you:",
      "es": "Cuando tomas decisiones, tú:"
    },
    question_type: "decision_making",
    options: [
      {
        text: { "en": "Go with your gut feeling and decide quickly", "es": "Sigues tu instinto y decides rápidamente" },
        temperament: "sanguine",
        weight: 1.0
      },
      {
        text: { "en": "Make decisive choices based on efficiency", "es": "Tomas decisiones decisivas basadas en eficiencia" },
        temperament: "choleric",
        weight: 1.0
      },
      {
        text: { "en": "Analyze all options thoroughly before deciding", "es": "Analizas todas las opciones minuciosamente antes de decidir" },
        temperament: "melancholic",
        weight: 1.0
      },
      {
        text: { "en": "Seek consensus and avoid rushing decisions", "es": "Buscas consenso y evitas tomar decisiones apresuradas" },
        temperament: "phlegmatic",
        weight: 1.0
      }
    ],
    order_index: 3
  },
  {
    question_text: {
      "en": "When facing stress, you typically:",
      "es": "Cuando enfrentas estrés, típicamente:"
    },
    question_type: "stress_response",
    options: [
      {
        text: { "en": "Talk it out with friends and stay optimistic", "es": "Hablas con amigos y te mantienes optimista" },
        temperament: "sanguine",
        weight: 1.0
      },
      {
        text: { "en": "Take immediate action to solve the problem", "es": "Tomas acción inmediata para resolver el problema" },
        temperament: "choleric",
        weight: 1.0
      },
      {
        text: { "en": "Withdraw and think through solutions carefully", "es": "Te retiras y piensas soluciones cuidadosamente" },
        temperament: "melancholic",
        weight: 1.0
      },
      {
        text: { "en": "Stay calm and wait for the situation to improve", "es": "Te mantienes calmado y esperas que la situación mejore" },
        temperament: "phlegmatic",
        weight: 1.0
      }
    ],
    order_index: 4
  },
  {
    question_text: {
      "en": "Your approach to goal setting is:",
      "es": "Tu enfoque para establecer metas es:"
    },
    question_type: "goal_setting",
    options: [
      {
        text: { "en": "Set exciting goals and share them with everyone", "es": "Establecer metas emocionantes y compartirlas con todos" },
        temperament: "sanguine",
        weight: 1.0
      },
      {
        text: { "en": "Set ambitious goals and pursue them aggressively", "es": "Establecer metas ambiciosas y perseguirlas agresivamente" },
        temperament: "choleric",
        weight: 1.0
      },
      {
        text: { "en": "Set detailed, realistic goals with clear plans", "es": "Establecer metas detalladas y realistas con planes claros" },
        temperament: "melancholic",
        weight: 1.0
      },
      {
        text: { "en": "Set modest goals and work toward them steadily", "es": "Establecer metas modestas y trabajar hacia ellas constantemente" },
        temperament: "phlegmatic",
        weight: 1.0
      }
    ],
    order_index: 5
  }
]

async function populateQuestions() {
  console.log('📋 AXIS6 Temperament Questions Populator\n')
  
  try {
    // Check current state
    const { data: existingQuestions, error: checkError } = await supabase
      .from('axis6_temperament_questions')
      .select('id', { count: 'exact' })
    
    if (checkError) throw checkError
    
    console.log(`Current questions in database: ${existingQuestions?.length || 0}`)
    
    if ((existingQuestions?.length || 0) > 0) {
      console.log('⚠️  Questions already exist. Do you want to replace them?')
      console.log('Run with --force to replace existing questions')
      
      if (!process.argv.includes('--force')) {
        return
      }
      
      // Delete existing questions
      const { error: deleteError } = await supabase
        .from('axis6_temperament_questions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
      
      if (deleteError) throw deleteError
      console.log('🗑️  Deleted existing questions')
    }
    
    // Insert new questions
    console.log('📝 Inserting temperament questions...')
    
    for (let i = 0; i < temperamentQuestions.length; i++) {
      const question = temperamentQuestions[i]
      
      const { data, error } = await supabase
        .from('axis6_temperament_questions')
        .insert([{
          question_text: question.question_text,
          question_type: question.question_type,
          options: question.options,
          order_index: question.order_index,
          is_active: true
        }])
        .select()
      
      if (error) {
        console.error(`❌ Failed to insert question ${i + 1}:`, error.message)
        throw error
      }
      
      console.log(`✅ Question ${i + 1}: "${question.question_text.en.substring(0, 50)}..."`)
    }
    
    // Verify insertion
    const { data: newQuestions, error: verifyError } = await supabase
      .from('axis6_temperament_questions')
      .select('id', { count: 'exact' })
      .eq('is_active', true)
    
    if (verifyError) throw verifyError
    
    console.log(`\n🎉 SUCCESS! Inserted ${newQuestions?.length || 0} questions`)
    
    if (newQuestions?.length === temperamentQuestions.length) {
      console.log('✅ All questions inserted successfully')
      console.log('🚀 Profile page temperament questionnaire should now work!')
    } else {
      console.log('⚠️  Some questions may be missing')
    }
    
    console.log('\nQuestions ready for:')
    console.log('- Temperament assessment')
    console.log('- Personality profiling') 
    console.log('- AI-enhanced recommendations')
    
  } catch (error) {
    console.error('❌ Failed to populate questions:', error.message)
    process.exit(1)
  }
}

populateQuestions()
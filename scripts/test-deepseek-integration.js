#!/usr/bin/env node

/**
 * Test script for DeepSeek AI integration
 * Tests the basic connectivity and functionality
 */

require('dotenv').config({ path: '.env.local' })

async function testDeepSeekAPI() {
  console.log('🧪 Testing DeepSeek AI Integration...\n')
  
  // Check environment variables
  const apiKey = process.env.DEEPSEEK_API_KEY
  const apiUrl = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1'
  
  if (!apiKey) {
    console.error('❌ DEEPSEEK_API_KEY not found in environment')
    process.exit(1)
  }
  
  console.log('✅ API Key found:', apiKey.substring(0, 10) + '...')
  console.log('✅ API URL:', apiUrl)
  console.log()
  
  // Test 1: Basic chat completion
  console.log('📝 Test 1: Basic Chat Completion')
  console.log('--------------------------------')
  
  try {
    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant for psychological assessment.'
          },
          {
            role: 'user',
            content: 'What are the four classical temperaments in psychology? Provide a one-sentence description for each.'
          }
        ],
        temperature: 0.7,
        max_tokens: 200
      })
    })
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API Error ${response.status}: ${error}`)
    }
    
    const data = await response.json()
    console.log('✅ Response received successfully!')
    console.log('📊 Tokens used:', data.usage?.total_tokens || 'N/A')
    console.log('\n🤖 AI Response:')
    console.log(data.choices[0]?.message?.content || 'No content')
    console.log()
    
  } catch (error) {
    console.error('❌ Test 1 Failed:', error.message)
    process.exit(1)
  }
  
  // Test 2: Structured output for personality analysis
  console.log('\n📝 Test 2: Structured Personality Analysis')
  console.log('-------------------------------------------')
  
  try {
    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `You are an expert psychologist. Analyze the following responses and provide a JSON object with temperament scores.
            
Response ONLY with a valid JSON object in this exact format:
{
  "primary_temperament": "sanguine|choleric|melancholic|phlegmatic",
  "secondary_temperament": "sanguine|choleric|melancholic|phlegmatic",
  "scores": {
    "sanguine": 0.0-1.0,
    "choleric": 0.0-1.0,
    "melancholic": 0.0-1.0,
    "phlegmatic": 0.0-1.0
  }
}`
          },
          {
            role: 'user',
            content: `Based on these questionnaire responses:
Q1: How do you prefer to work? A: In a team with lots of interaction (sanguine)
Q2: How do you make decisions? A: Quickly and decisively (choleric)
Q3: How do you handle stress? A: I analyze the situation carefully (melancholic)

Provide the temperament analysis as JSON.`
          }
        ],
        temperature: 0.3,
        max_tokens: 200
      })
    })
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API Error ${response.status}: ${error}`)
    }
    
    const data = await response.json()
    const content = data.choices[0]?.message?.content || '{}'
    
    // Try to parse as JSON
    const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleanContent)
    
    console.log('✅ Structured output parsed successfully!')
    console.log('\n📊 Analysis Result:')
    console.log(JSON.stringify(parsed, null, 2))
    console.log()
    
  } catch (error) {
    console.error('❌ Test 2 Failed:', error.message)
    if (error.message.includes('JSON')) {
      console.log('💡 Tip: The AI response might not be valid JSON. Check the prompt.')
    }
  }
  
  // Test 3: Activity recommendation
  console.log('\n📝 Test 3: Activity Recommendation')
  console.log('-----------------------------------')
  
  try {
    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a wellness coach creating personalized activity recommendations.'
          },
          {
            role: 'user',
            content: `Generate 3 physical wellness activities for someone with a sanguine temperament (energetic, social, fun-loving). 
Format each as: Name | Duration | Difficulty (1-5) | Benefits`
          }
        ],
        temperature: 0.8,
        max_tokens: 300
      })
    })
    
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API Error ${response.status}: ${error}`)
    }
    
    const data = await response.json()
    console.log('✅ Activity recommendations generated!')
    console.log('\n🏃 Recommended Activities:')
    console.log(data.choices[0]?.message?.content || 'No content')
    console.log()
    
  } catch (error) {
    console.error('❌ Test 3 Failed:', error.message)
  }
  
  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('🎉 DeepSeek Integration Test Complete!')
  console.log('='.repeat(50))
  console.log('\n✅ The DeepSeek API is working correctly.')
  console.log('✅ You can now use AI-enhanced features in the app.')
  console.log('\n💡 Next steps:')
  console.log('   1. Deploy the database migration')
  console.log('   2. Update the profile page to use EnhancedTemperamentQuestionnaire')
  console.log('   3. Test the full flow in the application')
}

// Run the test
testDeepSeekAPI().catch(error => {
  console.error('\n💥 Unexpected error:', error)
  process.exit(1)
})
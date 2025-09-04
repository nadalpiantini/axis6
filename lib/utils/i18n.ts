/**
 * Internationalization utilities for AXIS6
 * Handles safe text extraction from multilingual JSONB objects
 */

export type MultilingualText = Record<string, string> | string | null | undefined

/**
 * Safely extracts localized text from multilingual objects
 * Handles JSONB objects with {en, es} structure from database
 * 
 * @param text - Multilingual object, string, or null/undefined
 * @param preferredLang - Preferred language code (default: 'en')
 * @param fallback - Fallback text if no valid text found
 * @returns Safe string for React rendering
 */
export function getLocalizedText(
  text: MultilingualText,
  preferredLang: string = 'en',
  fallback: string = ''
): string {
  // Handle null/undefined
  if (!text) return fallback

  // If already a string, return as-is
  if (typeof text === 'string') return text

  // Handle multilingual object
  if (typeof text === 'object' && text !== null) {
    // Try preferred language first
    if (text[preferredLang] && typeof text[preferredLang] === 'string') {
      return text[preferredLang]
    }

    // Fallback to English
    if (text.en && typeof text.en === 'string') {
      return text.en
    }

    // Fallback to Spanish
    if (text.es && typeof text.es === 'string') {
      return text.es
    }

    // Fallback to any available language
    const availableLanguages = Object.keys(text)
    for (const lang of availableLanguages) {
      if (text[lang] && typeof text[lang] === 'string') {
        return text[lang]
      }
    }
  }

  // No valid text found, return fallback
  return fallback
}

/**
 * Gets category name with defensive programming
 * Specifically for AXIS6 category objects from database
 */
export function getCategoryName(
  category: { name?: MultilingualText; slug?: string } | null | undefined,
  language: string = 'en'
): string {
  if (!category) return 'Unknown Category'
  
  // Handle edge cases where category might have different structure
  const name = getLocalizedText(category.name, language, category.slug || 'Unknown')
  
  // Final safety check to ensure we always return a string
  return typeof name === 'string' ? name : 'Unknown Category'
}

/**
 * Emergency function to fix any object accidentally passed to JSX
 * Use this as a last resort defensive measure
 */
export function safeRenderText(value: unknown): string {
  if (value === null || value === undefined) return ''
  
  if (typeof value === 'string') return value
  
  if (typeof value === 'number') return String(value)
  
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  
  // If it's an object that looks like multilingual text
  if (typeof value === 'object' && value !== null) {
    const obj = value as Record<string, unknown>
    
    // Try common language keys
    if (typeof obj.en === 'string') return obj.en
    if (typeof obj.es === 'string') return obj.es
    if (typeof obj.fr === 'string') return obj.fr
    
    // If it has a reasonable toString method
    if (Object.prototype.toString.call(value) !== '[object Object]') {
      return String(value)
    }
  }
  
  // Last resort - return a safe fallback
  return '[Invalid Text]'
}

/**
 * Gets category description with defensive programming
 */
export function getCategoryDescription(
  category: { description?: MultilingualText } | null | undefined,
  language: string = 'en'
): string {
  if (!category) return ''
  
  return getLocalizedText(category.description, language, '')
}
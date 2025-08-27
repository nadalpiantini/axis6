'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronDown,
  Info,
  Check,
  AlertTriangle,
  Loader2,
  Save,
  RotateCcw,
  HelpCircle
} from 'lucide-react'
import { useState } from 'react'

interface SettingsSectionProps {
  title: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  children: React.ReactNode
  className?: string
  collapsible?: boolean
  defaultExpanded?: boolean
  actions?: React.ReactNode
  helpText?: string
  isLoading?: boolean
  hasChanges?: boolean
  onSave?: () => void
  onReset?: () => void
}

export function SettingsSection({
  title,
  description,
  icon: Icon,
  children,
  className = '',
  collapsible = false,
  defaultExpanded = true,
  actions,
  helpText,
  isLoading = false,
  hasChanges = false,
  onSave,
  onReset
}: SettingsSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [showHelp, setShowHelp] = useState(false)

  return (
    <div className={`glass rounded-2xl border border-white/10 ${className}`}>
      {/* Section Header */}
      <div 
        className={`p-6 ${collapsible ? 'cursor-pointer' : ''} ${!isExpanded && collapsible ? 'border-b-0' : ''}`}
        onClick={collapsible ? () => setIsExpanded(!isExpanded) : undefined}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {Icon && (
              <div className="p-2 rounded-lg bg-white/10">
                <Icon className="w-5 h-5 text-purple-400" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold">{title}</h2>
                {helpText && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowHelp(!showHelp)
                    }}
                    className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                    aria-label="Help"
                  >
                    <HelpCircle className="w-4 h-4 text-gray-400" />
                  </button>
                )}
                {isLoading && (
                  <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                )}
              </div>
              {description && (
                <p className="text-gray-400 text-sm mt-1">{description}</p>
              )}
              
              {/* Help text */}
              <AnimatePresence>
                {showHelp && helpText && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3"
                  >
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <div className="flex gap-2">
                        <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        <p className="text-blue-300 text-sm">{helpText}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Save/Reset Actions */}
            {hasChanges && (onSave || onReset) && (
              <div className="flex items-center gap-2">
                {onReset && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onReset()
                    }}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    aria-label="Reset changes"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
                {onSave && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onSave()
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors font-medium"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                )}
              </div>
            )}

            {/* Custom Actions */}
            {actions && (
              <div onClick={(e) => e.stopPropagation()}>
                {actions}
              </div>
            )}

            {/* Collapse Toggle */}
            {collapsible && (
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Section Content */}
      <AnimatePresence>
        {(!collapsible || isExpanded) && (
          <motion.div
            initial={collapsible ? { opacity: 0, height: 0 } : false}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-white/10"
          >
            <div className="p-6">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Reusable setting item components
export function SettingItem({
  label,
  description,
  value,
  onChange,
  type = 'text',
  options = [],
  disabled = false,
  error,
  success,
  required = false,
  placeholder,
  className = ''
}: {
  label: string
  description?: string
  value: any
  onChange: (value: any) => void
  type?: 'text' | 'select' | 'toggle' | 'number' | 'textarea' | 'email' | 'password'
  options?: { value: any; label: string; disabled?: boolean }[]
  disabled?: boolean
  error?: string
  success?: string
  required?: boolean
  placeholder?: string
  className?: string
}) {
  const inputId = `setting-${label.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <label htmlFor={inputId} className="block font-medium text-white">
            {label}
            {required && <span className="text-red-400 ml-1">*</span>}
          </label>
          {description && (
            <p className="text-sm text-gray-400 mt-1">{description}</p>
          )}
        </div>
        
        <div className="w-64">
          {type === 'toggle' && (
            <button
              id={inputId}
              onClick={() => onChange(!value)}
              disabled={disabled}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                value
                  ? 'bg-purple-500'
                  : 'bg-gray-600'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  value ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          )}

          {type === 'select' && (
            <select
              id={inputId}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
            >
              {options.map((option) => (
                <option 
                  key={option.value} 
                  value={option.value}
                  disabled={option.disabled}
                  className="bg-gray-800 text-white"
                >
                  {option.label}
                </option>
              ))}
            </select>
          )}

          {type === 'textarea' && (
            <textarea
              id={inputId}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              placeholder={placeholder}
              rows={3}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none disabled:opacity-50"
            />
          )}

          {['text', 'number', 'email', 'password'].includes(type) && (
            <input
              id={inputId}
              type={type}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              disabled={disabled}
              placeholder={placeholder}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:opacity-50"
            />
          )}
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 text-green-400 text-sm">
          <Check className="w-4 h-4" />
          {success}
        </div>
      )}
    </div>
  )
}

// Reusable setting group
export function SettingGroup({
  title,
  description,
  children,
  className = ''
}: {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h3 className="text-lg font-medium text-white">{title}</h3>
        {description && (
          <p className="text-sm text-gray-400 mt-1">{description}</p>
        )}
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  )
}
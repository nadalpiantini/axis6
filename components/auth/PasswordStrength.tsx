'use client'

import { Check, X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface PasswordStrengthProps {
  password: string
  showRequirements?: boolean
}

interface PasswordRequirement {
  label: string
  test: (password: string) => boolean
}

const requirements: PasswordRequirement[] = [
  {
    label: 'At least 8 characters',
    test: (password: string) => password.length >= 8
  },
  {
    label: 'Contains uppercase letter',
    test: (password: string) => /[A-Z]/.test(password)
  },
  {
    label: 'Contains lowercase letter',
    test: (password: string) => /[a-z]/.test(password)
  },
  {
    label: 'Contains number',
    test: (password: string) => /\d/.test(password)
  },
  {
    label: 'Contains special character',
    test: (password: string) => /[!@#$%^&*(),.?":{}|<>]/.test(password)
  }
]

export function PasswordStrength({ password, showRequirements = true }: PasswordStrengthProps) {
  const [strength, setStrength] = useState(0)
  const [strengthLabel, setStrengthLabel] = useState<string>('None')
  const [strengthColor, setStrengthColor] = useState<string>('bg-gray-600')

  useEffect(() => {
    if (!password) {
      setStrength(0)
      setStrengthLabel('None')
      setStrengthColor('bg-gray-600')
      return
    }

    let score = 0
    requirements.forEach(req => {
      if (req.test(password)) {
        score++
      }
    })

    setStrength(score)

    // Set label and color based on score
    if (score === 0) {
      setStrengthLabel('None')
      setStrengthColor('bg-gray-600')
    } else if (score <= 2) {
      setStrengthLabel('Weak')
      setStrengthColor('bg-red-500')
    } else if (score <= 3) {
      setStrengthLabel('Fair')
      setStrengthColor('bg-orange-500')
    } else if (score <= 4) {
      setStrengthLabel('Good')
      setStrengthColor('bg-yellow-500')
    } else {
      setStrengthLabel('Strong')
      setStrengthColor('bg-green-500')
    }
  }, [password])

  const strengthPercentage = (strength / requirements.length) * 100

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-400">Password strength</span>
          <span className={`font-medium ${
            strengthLabel === 'Strong' ? 'text-green-400' :
            strengthLabel === 'Good' ? 'text-yellow-400' :
            strengthLabel === 'Fair' ? 'text-orange-400' :
            strengthLabel === 'Weak' ? 'text-red-400' :
            'text-gray-400'
          }`}>
            {strengthLabel}
          </span>
        </div>

        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${strengthColor}`}
            style={{ width: `${strengthPercentage}%` }}
          />
        </div>
      </div>

      {showRequirements && password && (
        <div className="space-y-1">
          {requirements.map((req, index) => {
            const isMet = req.test(password)
            return (
              <div
                key={index}
                className={`flex items-center gap-2 text-xs transition-all duration-200 ${
                  isMet ? 'text-green-400' : 'text-gray-500'
                }`}
              >
                {isMet ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <X className="w-3 h-3" />
                )}
                <span>{req.label}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

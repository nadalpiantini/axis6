'use client'
import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Activity, Brain, Heart, Users, Sparkles, Briefcase, Clock, Globe, Lock, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import { handleError } from '@/lib/error/standardErrorHandler'
import { useCSRF } from '@/lib/hooks/useCSRF'
import { AXIS_OPTIONS } from '@/lib/constants/axis-options'
import { MINUTE_OPTIONS } from '@/lib/constants/minute-options'
import { PRIVACY_OPTIONS } from '@/lib/constants/privacy-options'
import { MICRO_SUGGESTIONS } from '@/lib/constants/micro-suggestions'

interface QuickActionComposerProps {
  isOpen: boolean
  onClose: () => void
  isMorningWindow?: boolean
  onSuccess?: () => void
}
export function QuickActionComposer({
  isOpen,
  onClose,
  isMorningWindow = false,
  onSuccess
}: QuickActionComposerProps) {
  const { secureFetch } = useCSRF()
  const [selectedAxis, setSelectedAxis] = useState<string>('')
  const [winText, setWinText] = useState('')
  const [minutes, setMinutes] = useState<number | null>(null)
  const [privacy, setPrivacy] = useState('public')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const handleSubmit = async () => {
    if (!selectedAxis || !winText.trim()) {
      toast.error('Please select an axis and describe your micro win')
      return
    }
    if (winText.length > 140) {
      toast.error('Micro win must be 140 characters or less')
      return
    }
    setIsSubmitting(true)
    try {
      const response = await secureFetch('/api/micro-wins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          axis: selectedAxis,
          winText,
          minutes,
          privacy,
          isMorning: isMorningWindow
        })
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to record micro win')
      }
      toast.success(data.message || 'Micro win recorded!')
      // Reset form
      setSelectedAxis('')
      setWinText('')
      setMinutes(null)
      setPrivacy('public')
      onSuccess?.()
    } catch (error) {
      handleError(error, {
      operation: 'general_operation', component: 'QuickActionComposer',
        userMessage: 'Operation failed. Please try again.'
      })
      toast.error(error instanceof Error ? error.message : 'Failed to record micro win')
    } finally {
      setIsSubmitting(false)
    }
  }
  const handleSuggestionClick = (suggestion: string) => {
    setWinText(suggestion)
  }
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-navy-800 border-navy-700">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            {isMorningWindow ? '🌅 Morning Micro Win' : '✨ Quick Micro Win'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {/* Axis Selection */}
          <div>
            <Label className="text-sm font-medium text-navy-200 mb-3 block">
              Choose One Axis
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {AXIS_OPTIONS.map((axis) => {
                const Icon = axis.icon
                return (
                  <button
                    key={axis.value}
                    onClick={() => setSelectedAxis(axis.value)}
                    className={`
                      p-3 rounded-lg border-2 transition-all duration-200
                      ${selectedAxis === axis.value
                        ? 'border-white bg-navy-700'
                        : 'border-navy-600 hover:border-navy-500 bg-navy-800/50'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 mx-auto mb-1 ${
                      selectedAxis === axis.value ? 'text-white' : 'text-navy-400'
                    }`} />
                    <p className={`text-xs ${
                      selectedAxis === axis.value ? 'text-white font-medium' : 'text-navy-400'
                    }`}>
                      {axis.label}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
          {/* Win Text */}
          <div>
            <Label className="text-sm font-medium text-navy-200 mb-2 block">
              Tiny Action
            </Label>
            <Textarea
              value={winText}
              onChange={(e) => setWinText(e.target.value)}
              placeholder="What's your micro win?"
              className="bg-navy-900/50 border-navy-600 text-white placeholder:text-navy-400 resize-none h-20"
              maxLength={140}
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-navy-400">
                {winText.length}/140 characters
              </p>
              {winText.length > 120 && (
                <p className="text-xs text-yellow-400">Almost at limit</p>
              )}
            </div>
            {/* Suggestions */}
            <div className="mt-3 flex flex-wrap gap-2">
              {MICRO_SUGGESTIONS.slice(0, 4).map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="text-xs px-2 py-1 rounded-full bg-navy-700/50 text-navy-300 hover:bg-navy-700 hover:text-white transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
          {/* Minutes (Optional) */}
          <div>
            <Label className="text-sm font-medium text-navy-200 mb-2 block">
              Minutes (Optional)
            </Label>
            <div className="flex gap-2">
              {MINUTE_OPTIONS.map((min) => (
                <button
                  key={min}
                  onClick={() => setMinutes(minutes === min ? null : min)}
                  className={`
                    px-3 py-2 rounded-lg border transition-all
                    ${minutes === min
                      ? 'border-white bg-navy-700 text-white'
                      : 'border-navy-600 hover:border-navy-500 text-navy-400'
                    }
                  `}
                >
                  {min}
                </button>
              ))}
            </div>
          </div>
          {/* Privacy */}
          <div>
            <Label className="text-sm font-medium text-navy-200 mb-2 block">
              Privacy
            </Label>
            <RadioGroup value={privacy} onValueChange={setPrivacy}>
              <div className="flex gap-4">
                {PRIVACY_OPTIONS.map((option) => {
                  const Icon = option.icon
                  return (
                    <div key={option.value} className="flex items-center">
                      <RadioGroupItem
                        value={option.value}
                        id={option.value}
                        className="text-white border-navy-600"
                      />
                      <Label
                        htmlFor={option.value}
                        className="ml-2 flex items-center gap-1 text-sm text-navy-300 cursor-pointer"
                      >
                        <Icon className="w-3 h-3" />
                        {option.label}
                      </Label>
                    </div>
                  )
                })}
              </div>
            </RadioGroup>
          </div>
          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!selectedAxis || !winText.trim() || isSubmitting}
            className="w-full bg-gradient-to-r from-navy-600 to-navy-700 hover:from-navy-700 hover:to-navy-800 text-white"
          >
            {isSubmitting ? 'Recording...' : 'Post Micro Win'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

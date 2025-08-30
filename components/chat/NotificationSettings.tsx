'use client'

import { motion } from 'framer-motion'
import { Bell, BellOff, Volume2, VolumeX, Settings, TestTube } from 'lucide-react'
import React, { useState, useEffect } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'
import { notificationService, NotificationPermissionResult } from '@/lib/services/notification-service'
import { cn } from '@/lib/utils'

interface NotificationSettingsProps {
  className?: string
  onClose?: () => void
}

export function NotificationSettings({
  className,
  onClose
}: NotificationSettingsProps) {
  const [permission, setPermission] = useState<NotificationPermissionResult>({
    granted: false,
    denied: false,
    prompt: false,
    supported: false
  })

  const [preferences, setPreferences] = useState({
    enabled: true,
    soundEnabled: true,
    mentionsOnly: false,
    mutedRooms: [] as string[]
  })

  const [isRequestingPermission, setIsRequestingPermission] = useState(false)
  const [isTestingNotification, setIsTestingNotification] = useState(false)

  // Load initial state
  useEffect(() => {
    setPermission(notificationService.getPermissionStatus())
    setPreferences(notificationService.getNotificationPreferences())
  }, [])

  const handleRequestPermission = async () => {
    setIsRequestingPermission(true)

    try {
      const result = await notificationService.requestPermission()
      setPermission(result)

      if (result.granted) {
        // Enable notifications by default when permission is granted
        const newPrefs = { ...preferences, enabled: true }
        setPreferences(newPrefs)
        notificationService.saveNotificationPreferences(newPrefs)
      }
    } finally {
      setIsRequestingPermission(false)
    }
  }

  const handlePreferenceChange = (key: keyof typeof preferences, value: any) => {
    const newPrefs = { ...preferences, [key]: value }
    setPreferences(newPrefs)
    notificationService.saveNotificationPreferences(newPrefs)
  }

  const handleTestNotification = async () => {
    setIsTestingNotification(true)

    try {
      const success = await notificationService.testNotification()
      if (!success) {
        }
    } finally {
      setTimeout(() => setIsTestingNotification(false), 1000)
    }
  }

  const getPermissionBadge = () => {
    if (permission.denied) {
      return (
        <Badge variant="destructive" className="text-xs">
          Blocked
        </Badge>
      )
    }

    if (permission.granted) {
      return (
        <Badge variant="default" className="text-xs bg-green-600">
          Allowed
        </Badge>
      )
    }

    return (
      <Badge variant="secondary" className="text-xs">
        Not Set
      </Badge>
    )
  }

  const getPermissionMessage = () => {
    if (!permission.supported) {
      return {
        title: 'Not Supported',
        message: 'Your browser does not support notifications.',
        color: 'text-neutral-400'
      }
    }

    if (permission.denied) {
      return {
        title: 'Notifications Blocked',
        message: 'Please enable notifications in your browser settings to receive chat notifications.',
        color: 'text-red-400'
      }
    }

    if (permission.granted) {
      return {
        title: 'Notifications Enabled',
        message: 'You will receive notifications for new messages and mentions.',
        color: 'text-green-400'
      }
    }

    return {
      title: 'Enable Notifications',
      message: 'Allow notifications to stay updated on new messages and mentions.',
      color: 'text-yellow-400'
    }
  }

  const permissionInfo = getPermissionMessage()

  return (
    <div className={cn(
      "bg-neutral-800 rounded-lg border border-neutral-700",
      "p-6 space-y-6 max-w-md",
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bell className="h-5 w-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">
            Notifications
          </h3>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            ×
          </Button>
        )}
      </div>

      {/* Permission Status */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-neutral-300">
            Browser Permission
          </span>
          {getPermissionBadge()}
        </div>

        <div className="p-3 bg-neutral-900 rounded-lg">
          <h4 className={cn("text-sm font-medium", permissionInfo.color)}>
            {permissionInfo.title}
          </h4>
          <p className="text-xs text-neutral-400 mt-1">
            {permissionInfo.message}
          </p>
        </div>

        {/* Permission Action */}
        {permission.supported && !permission.granted && !permission.denied && (
          <Button
            onClick={handleRequestPermission}
            disabled={isRequestingPermission}
            className="w-full"
          >
            {isRequestingPermission ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Requesting...
              </>
            ) : (
              <>
                <Bell className="h-4 w-4 mr-2" />
                Enable Notifications
              </>
            )}
          </Button>
        )}

        {/* Test Notification */}
        {permission.granted && (
          <Button
            variant="outline"
            onClick={handleTestNotification}
            disabled={isTestingNotification}
            className="w-full"
          >
            {isTestingNotification ? (
              <>
                <div className="w-4 h-4 border-2 border-neutral-400 border-t-transparent rounded-full animate-spin mr-2" />
                Sending...
              </>
            ) : (
              <>
                <TestTube className="h-4 w-4 mr-2" />
                Test Notification
              </>
            )}
          </Button>
        )}
      </div>

      {/* Notification Preferences */}
      {permission.granted && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-neutral-300">
            Preferences
          </h4>

          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {preferences.enabled ? (
                <Bell className="h-4 w-4 text-green-400" />
              ) : (
                <BellOff className="h-4 w-4 text-neutral-500" />
              )}
              <div>
                <span className="text-sm text-white">
                  Show Notifications
                </span>
                <p className="text-xs text-neutral-400">
                  Receive notifications for messages
                </p>
              </div>
            </div>

            <button
              onClick={() => handlePreferenceChange('enabled', !preferences.enabled)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                preferences.enabled ? "bg-purple-600" : "bg-neutral-600"
              )}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  preferences.enabled ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>

          {/* Sound */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {preferences.soundEnabled ? (
                <Volume2 className="h-4 w-4 text-blue-400" />
              ) : (
                <VolumeX className="h-4 w-4 text-neutral-500" />
              )}
              <div>
                <span className="text-sm text-white">
                  Sound
                </span>
                <p className="text-xs text-neutral-400">
                  Play sound with notifications
                </p>
              </div>
            </div>

            <button
              onClick={() => handlePreferenceChange('soundEnabled', !preferences.soundEnabled)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                preferences.soundEnabled ? "bg-blue-600" : "bg-neutral-600"
              )}
              disabled={!preferences.enabled}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  preferences.soundEnabled ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>

          {/* Mentions Only */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="h-4 w-4 rounded bg-yellow-500 flex items-center justify-center">
                <span className="text-xs text-black font-bold">@</span>
              </div>
              <div>
                <span className="text-sm text-white">
                  Mentions Only
                </span>
                <p className="text-xs text-neutral-400">
                  Only notify when mentioned
                </p>
              </div>
            </div>

            <button
              onClick={() => handlePreferenceChange('mentionsOnly', !preferences.mentionsOnly)}
              className={cn(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                preferences.mentionsOnly ? "bg-yellow-600" : "bg-neutral-600"
              )}
              disabled={!preferences.enabled}
            >
              <span
                className={cn(
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                  preferences.mentionsOnly ? "translate-x-6" : "translate-x-1"
                )}
              />
            </button>
          </div>
        </div>
      )}

      {/* Browser Instructions */}
      {permission.denied && (
        <div className="p-3 bg-red-900/20 border border-red-700/30 rounded-lg">
          <h4 className="text-sm font-medium text-red-400 mb-2">
            How to Enable Notifications
          </h4>
          <ol className="text-xs text-neutral-300 space-y-1 list-decimal list-inside">
            <li>Click the lock icon in your address bar</li>
            <li>Find "Notifications" and select "Allow"</li>
            <li>Refresh this page</li>
          </ol>
        </div>
      )}

      {/* Footer */}
      <div className="pt-3 border-t border-neutral-700">
        <p className="text-xs text-neutral-500 text-center">
          You can change these settings anytime in your browser or chat preferences.
        </p>
      </div>
    </div>
  )
}

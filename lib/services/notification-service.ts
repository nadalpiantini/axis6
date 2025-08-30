/**
 * Browser Push Notification Service
 * Handles browser notifications for chat messages, mentions, and system events
 */

import { logger } from '@/lib/logger'

export interface NotificationOptions {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  tag?: string
  data?: any
  requireInteraction?: boolean
  actions?: NotificationAction[]
  silent?: boolean
  vibrate?: VibratePattern
}

export interface NotificationPermissionResult {
  granted: boolean
  denied: boolean
  prompt: boolean
  supported: boolean
}

export class NotificationService {
  private static instance: NotificationService
  private isSupported = false
  private permission: NotificationPermission = 'default'
  private activeNotifications = new Map<string, Notification>()

  constructor() {
    this.checkSupport()
    this.updatePermissionStatus()
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  /**
   * Check if browser supports notifications
   */
  private checkSupport(): void {
    this.isSupported = 'Notification' in window && 'serviceWorker' in navigator
  }

  /**
   * Update current permission status
   */
  private updatePermissionStatus(): void {
    if (this.isSupported) {
      this.permission = Notification.permission
    }
  }

  /**
   * Get current notification permission status
   */
  getPermissionStatus(): NotificationPermissionResult {
    this.updatePermissionStatus()

    return {
      granted: this.permission === 'granted',
      denied: this.permission === 'denied',
      prompt: this.permission === 'default',
      supported: this.isSupported
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermissionResult> {
    if (!this.isSupported) {
      return this.getPermissionStatus()
    }

    try {
      const permission = await Notification.requestPermission()
      this.permission = permission

      logger.info('Notification permission result:', permission)
      return this.getPermissionStatus()
    } catch (error) {
      logger.error('Failed to request notification permission:', error)
      return this.getPermissionStatus()
    }
  }

  /**
   * Show a notification
   */
  async showNotification(options: NotificationOptions): Promise<boolean> {
    const status = this.getPermissionStatus()

    if (!status.supported) {
      logger.warn('Notifications not supported in this browser')
      return false
    }

    if (!status.granted) {
      logger.warn('Notification permission not granted')
      return false
    }

    try {
      // Use service worker if available, otherwise fallback to direct notification
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready

        if (registration.showNotification) {
          await registration.showNotification(options.title, {
            body: options.body,
            icon: options.icon || '/favicon.ico',
            badge: options.badge || '/favicon.ico',
            image: options.image,
            tag: options.tag,
            data: options.data,
            requireInteraction: options.requireInteraction || false,
            actions: options.actions || [],
            silent: options.silent || false,
            vibrate: options.vibrate
          })

          return true
        }
      }

      // Fallback to direct notification
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        tag: options.tag,
        data: options.data,
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
        vibrate: options.vibrate
      })

      // Track notification for management
      if (options.tag) {
        // Close existing notification with same tag
        const existing = this.activeNotifications.get(options.tag)
        if (existing) {
          existing.close()
        }

        this.activeNotifications.set(options.tag, notification)
      }

      // Handle notification events
      notification.onclick = () => {
        window.focus()
        this.handleNotificationClick(options.data)
        notification.close()
      }

      notification.onclose = () => {
        if (options.tag) {
          this.activeNotifications.delete(options.tag)
        }
      }

      // Auto-close after delay if not requiring interaction
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close()
        }, 5000)
      }

      return true
    } catch (error) {
      logger.error('Failed to show notification:', error)
      return false
    }
  }

  /**
   * Show chat message notification
   */
  async showChatMessageNotification(
    senderName: string,
    message: string,
    roomName: string,
    messageId: string,
    roomId: string
  ): Promise<boolean> {
    return this.showNotification({
      title: `${senderName} in ${roomName}`,
      body: message,
      tag: `chat-message-${messageId}`,
      icon: '/icons/chat-icon-192.png',
      data: {
        type: 'chat_message',
        messageId,
        roomId,
        senderName
      },
      actions: [
        {
          action: 'reply',
          title: 'Reply',
          icon: '/icons/reply-icon.png'
        },
        {
          action: 'mark-read',
          title: 'Mark as Read',
          icon: '/icons/check-icon.png'
        }
      ]
    })
  }

  /**
   * Show mention notification
   */
  async showMentionNotification(
    senderName: string,
    message: string,
    roomName: string,
    messageId: string,
    roomId: string
  ): Promise<boolean> {
    return this.showNotification({
      title: `${senderName} mentioned you`,
      body: `In ${roomName}: ${message}`,
      tag: `mention-${messageId}`,
      icon: '/icons/mention-icon-192.png',
      requireInteraction: true,
      vibrate: [200, 100, 200],
      data: {
        type: 'mention',
        messageId,
        roomId,
        senderName
      },
      actions: [
        {
          action: 'view',
          title: 'View Message',
          icon: '/icons/view-icon.png'
        },
        {
          action: 'reply',
          title: 'Reply',
          icon: '/icons/reply-icon.png'
        }
      ]
    })
  }

  /**
   * Show typing notification
   */
  async showTypingNotification(
    senderName: string,
    roomName: string,
    roomId: string
  ): Promise<boolean> {
    return this.showNotification({
      title: `${senderName} is typing...`,
      body: `In ${roomName}`,
      tag: `typing-${roomId}-${senderName}`,
      silent: true,
      requireInteraction: false,
      data: {
        type: 'typing',
        roomId,
        senderName
      }
    })
  }

  /**
   * Show system notification
   */
  async showSystemNotification(
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info'
  ): Promise<boolean> {
    const icons = {
      info: '/icons/info-icon-192.png',
      success: '/icons/success-icon-192.png',
      warning: '/icons/warning-icon-192.png',
      error: '/icons/error-icon-192.png'
    }

    return this.showNotification({
      title,
      body: message,
      icon: icons[type],
      tag: `system-${type}-${Date.now()}`,
      data: {
        type: 'system',
        level: type
      }
    })
  }

  /**
   * Handle notification click events
   */
  private handleNotificationClick(data: any): void {
    if (!data) return

    switch (data.type) {
      case 'chat_message':
      case 'mention':
        // Navigate to the chat room
        if (data.roomId) {
          window.location.href = `/chat/rooms/${data.roomId}?message=${data.messageId}`
        }
        break

      case 'typing':
        // Navigate to the chat room
        if (data.roomId) {
          window.location.href = `/chat/rooms/${data.roomId}`
        }
        break

      case 'system':
        // Just focus the window for system notifications
        window.focus()
        break
    }
  }

  /**
   * Close notification by tag
   */
  closeNotification(tag: string): void {
    const notification = this.activeNotifications.get(tag)
    if (notification) {
      notification.close()
      this.activeNotifications.delete(tag)
    }
  }

  /**
   * Close all active notifications
   */
  closeAllNotifications(): void {
    this.activeNotifications.forEach(notification => {
      notification.close()
    })
    this.activeNotifications.clear()
  }

  /**
   * Get notification preferences from localStorage
   */
  getNotificationPreferences(): {
    enabled: boolean
    soundEnabled: boolean
    mentionsOnly: boolean
    mutedRooms: string[]
  } {
    try {
      const prefs = localStorage.getItem('axis6_notification_preferences')
      if (prefs) {
        return JSON.parse(prefs)
      }
    } catch (error) {
      logger.error('Failed to load notification preferences:', error)
    }

    return {
      enabled: true,
      soundEnabled: true,
      mentionsOnly: false,
      mutedRooms: []
    }
  }

  /**
   * Save notification preferences to localStorage
   */
  saveNotificationPreferences(preferences: {
    enabled: boolean
    soundEnabled: boolean
    mentionsOnly: boolean
    mutedRooms: string[]
  }): void {
    try {
      localStorage.setItem('axis6_notification_preferences', JSON.stringify(preferences))
    } catch (error) {
      logger.error('Failed to save notification preferences:', error)
    }
  }

  /**
   * Check if notifications should be shown for a room
   */
  shouldNotify(roomId: string, type: 'message' | 'mention' | 'typing' = 'message'): boolean {
    const prefs = this.getNotificationPreferences()

    if (!prefs.enabled) return false
    if (prefs.mutedRooms.includes(roomId)) return false
    if (prefs.mentionsOnly && type === 'message') return false

    // Don't show typing notifications if document is visible
    if (type === 'typing' && !document.hidden) return false

    return this.getPermissionStatus().granted
  }

  /**
   * Test notifications
   */
  async testNotification(): Promise<boolean> {
    return this.showNotification({
      title: 'AXIS6 Notifications',
      body: 'Notifications are working correctly! 🎉',
      icon: '/favicon.ico',
      tag: 'test-notification',
      data: {
        type: 'test'
      }
    })
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance()

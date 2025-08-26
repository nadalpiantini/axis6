/**
 * Service Worker for AXIS6 Chat Notifications
 * Handles background push notifications and notification actions
 */

const CACHE_NAME = 'axis6-notifications-v1'
const NOTIFICATION_ICON = '/favicon.ico'

// Install service worker
self.addEventListener('install', (event) => {
  console.log('AXIS6 notification service worker installing...')
  self.skipWaiting()
})

// Activate service worker
self.addEventListener('activate', (event) => {
  console.log('AXIS6 notification service worker activating...')
  event.waitUntil(self.clients.claim())
})

// Handle notification display
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event)
  
  const notification = event.notification
  const action = event.action
  const data = notification.data || {}
  
  // Close the notification
  notification.close()
  
  // Handle different actions
  switch (action) {
    case 'reply':
      handleReplyAction(data)
      break
      
    case 'mark-read':
      handleMarkReadAction(data)
      break
      
    case 'view':
    default:
      handleViewAction(data)
      break
  }
})

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event)
  
  // Could track analytics here
  const data = event.notification.data || {}
  if (data.type === 'mention') {
    // Track mention dismissal
    console.log('Mention notification dismissed')
  }
})

// Handle push messages (for future web push implementation)
self.addEventListener('push', (event) => {
  console.log('Push message received:', event)
  
  if (!event.data) return
  
  try {
    const data = event.data.json()
    
    event.waitUntil(
      showPushNotification(data)
    )
  } catch (error) {
    console.error('Failed to parse push message:', error)
  }
})

/**
 * Handle reply action
 */
function handleReplyAction(data) {
  const url = getNotificationUrl(data, 'reply')
  
  return self.clients.matchAll({ type: 'window' }).then((clients) => {
    // Find existing window with the chat
    const existingClient = clients.find(client => {
      return client.url.includes('/chat/rooms/') && client.url.includes(data.roomId)
    })
    
    if (existingClient) {
      // Focus existing window and trigger reply
      return existingClient.focus().then(() => {
        existingClient.postMessage({
          type: 'reply_to_message',
          messageId: data.messageId,
          roomId: data.roomId
        })
      })
    } else {
      // Open new window
      return self.clients.openWindow(url)
    }
  })
}

/**
 * Handle mark as read action
 */
function handleMarkReadAction(data) {
  // Make API call to mark message as read
  return fetch(`/api/chat/rooms/${data.roomId}/messages/${data.messageId}/read`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  }).then((response) => {
    if (response.ok) {
      console.log('Message marked as read')
      
      // Notify open windows
      return self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach(client => {
          client.postMessage({
            type: 'message_read',
            messageId: data.messageId,
            roomId: data.roomId
          })
        })
      })
    } else {
      console.error('Failed to mark message as read')
    }
  }).catch((error) => {
    console.error('Error marking message as read:', error)
  })
}

/**
 * Handle view action (default)
 */
function handleViewAction(data) {
  const url = getNotificationUrl(data)
  
  return self.clients.matchAll({ type: 'window' }).then((clients) => {
    // Find existing AXIS6 window
    const existingClient = clients.find(client => {
      return client.url.includes(self.location.origin)
    })
    
    if (existingClient) {
      // Focus existing window and navigate
      return existingClient.focus().then(() => {
        existingClient.postMessage({
          type: 'navigate_to',
          url: url
        })
      })
    } else {
      // Open new window
      return self.clients.openWindow(url)
    }
  })
}

/**
 * Get appropriate URL for notification
 */
function getNotificationUrl(data, action = 'view') {
  const baseUrl = self.location.origin
  
  switch (data.type) {
    case 'chat_message':
    case 'mention':
      if (action === 'reply') {
        return `${baseUrl}/chat/rooms/${data.roomId}?reply=${data.messageId}`
      }
      return `${baseUrl}/chat/rooms/${data.roomId}?message=${data.messageId}`
      
    case 'typing':
      return `${baseUrl}/chat/rooms/${data.roomId}`
      
    default:
      return `${baseUrl}/chat`
  }
}

/**
 * Show push notification
 */
async function showPushNotification(data) {
  const options = {
    body: data.body,
    icon: data.icon || NOTIFICATION_ICON,
    badge: data.badge || NOTIFICATION_ICON,
    image: data.image,
    data: data,
    requireInteraction: data.requireInteraction || false,
    actions: data.actions || [],
    tag: data.tag,
    vibrate: data.vibrate,
    silent: data.silent || false
  }
  
  return self.registration.showNotification(data.title, options)
}

/**
 * Handle messages from main thread
 */
self.addEventListener('message', (event) => {
  const { type, data } = event.data || {}
  
  switch (type) {
    case 'skip_waiting':
      self.skipWaiting()
      break
      
    case 'show_notification':
      event.waitUntil(
        showPushNotification(data)
      )
      break
      
    case 'close_notification':
      // Close notification by tag
      self.registration.getNotifications({ tag: data.tag }).then((notifications) => {
        notifications.forEach(notification => notification.close())
      })
      break
      
    default:
      console.log('Unknown message type:', type)
  }
})

/**
 * Background sync for failed operations
 */
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event.tag)
  
  switch (event.tag) {
    case 'retry-notification':
      event.waitUntil(retryFailedNotifications())
      break
  }
})

/**
 * Retry failed notifications
 */
async function retryFailedNotifications() {
  // Implementation for retrying failed notification operations
  console.log('Retrying failed notifications...')
}
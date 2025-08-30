'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

import { chatRealtimeManager } from '@/lib/supabase/chat-realtime'
import { realtimeManager } from '@/lib/supabase/realtime-manager'
import { useSupabaseUser } from '@/lib/hooks/useSupabaseUser'
import { logger } from '@/lib/logger'

interface ChatSystemState {
  isInitialized: boolean
  isConnected: boolean
  error: string | null
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
}

interface ChatSystemContextType {
  state: ChatSystemState
  reconnect: () => Promise<void>
  disconnect: () => Promise<void>
}

const ChatSystemContext = createContext<ChatSystemContextType | null>(null)

interface ChatSystemProviderProps {
  children: React.ReactNode
  autoConnect?: boolean
}

/**
 * Chat System Provider
 * Manages chat system initialization and real-time connection state
 */
export function ChatSystemProvider({ 
  children, 
  autoConnect = true 
}: ChatSystemProviderProps) {
  const { user } = useSupabaseUser()
  const [state, setState] = useState<ChatSystemState>({
    isInitialized: false,
    isConnected: false,
    error: null,
    connectionStatus: 'disconnected'
  })

  // Initialize chat system when user is available
  useEffect(() => {
    if (!user || !autoConnect) return

    let mounted = true

    const initializeChatSystem = async () => {
      try {
        setState(prev => ({ 
          ...prev, 
          connectionStatus: 'connecting',
          error: null 
        }))

        // Wait for authentication
        const isAuth = await realtimeManager.waitForAuth(5000)
        if (!isAuth) {
          throw new Error('Authentication timeout')
        }

        if (!mounted) return

        setState(prev => ({
          ...prev,
          isInitialized: true,
          isConnected: true,
          connectionStatus: 'connected'
        }))

        logger.info('Chat system initialized successfully')

      } catch (error) {
        logger.error('Chat system initialization failed:', error)
        
        if (mounted) {
          setState(prev => ({
            ...prev,
            error: (error as Error).message,
            connectionStatus: 'error'
          }))
        }
      }
    }

    initializeChatSystem()

    return () => {
      mounted = false
    }
  }, [user, autoConnect])

  // Connection status monitoring
  useEffect(() => {
    if (!state.isInitialized) return

    const checkConnectionStatus = () => {
      const realtimeState = realtimeManager.getState()
      
      setState(prev => ({
        ...prev,
        isConnected: realtimeState.isConnected,
        connectionStatus: realtimeState.isConnected ? 'connected' : 'disconnected'
      }))
    }

    // Check every 30 seconds
    const interval = setInterval(checkConnectionStatus, 30000)
    
    // Initial check
    checkConnectionStatus()

    return () => clearInterval(interval)
  }, [state.isInitialized])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.isInitialized) {
        chatRealtimeManager.cleanup()
      }
    }
  }, [state.isInitialized])

  const reconnect = async (): Promise<void> => {
    if (!user) return

    try {
      setState(prev => ({ 
        ...prev, 
        connectionStatus: 'connecting',
        error: null 
      }))

      // Reset realtime manager failure count
      realtimeManager.resetFailureCount()

      // Wait a bit for connection
      await new Promise(resolve => setTimeout(resolve, 1000))

      setState(prev => ({
        ...prev,
        isConnected: true,
        connectionStatus: 'connected'
      }))

      logger.info('Chat system reconnected')
    } catch (error) {
      logger.error('Chat system reconnection failed:', error)
      setState(prev => ({
        ...prev,
        error: (error as Error).message,
        connectionStatus: 'error'
      }))
    }
  }

  const disconnect = async (): Promise<void> => {
    try {
      chatRealtimeManager.cleanup()
      
      setState(prev => ({
        ...prev,
        isConnected: false,
        connectionStatus: 'disconnected'
      }))

      logger.info('Chat system disconnected')
    } catch (error) {
      logger.error('Chat system disconnection failed:', error)
    }
  }

  const contextValue: ChatSystemContextType = {
    state,
    reconnect,
    disconnect
  }

  return (
    <ChatSystemContext.Provider value={contextValue}>
      {children}
    </ChatSystemContext.Provider>
  )
}

/**
 * Hook to access chat system context
 */
export function useChatSystem(): ChatSystemContextType {
  const context = useContext(ChatSystemContext)
  
  if (!context) {
    throw new Error('useChatSystem must be used within ChatSystemProvider')
  }

  return context
}

/**
 * Chat Connection Status Component
 * Shows current connection status with reconnect option
 */
export function ChatConnectionStatus({ className }: { className?: string }) {
  const { state, reconnect } = useChatSystem()

  if (!state.isInitialized) return null

  const statusConfig = {
    connecting: { 
      color: 'text-yellow-400', 
      bg: 'bg-yellow-400/10', 
      text: 'Connecting...',
      showReconnect: false
    },
    connected: { 
      color: 'text-green-400', 
      bg: 'bg-green-400/10', 
      text: 'Connected',
      showReconnect: false
    },
    disconnected: { 
      color: 'text-neutral-400', 
      bg: 'bg-neutral-400/10', 
      text: 'Disconnected',
      showReconnect: true
    },
    error: { 
      color: 'text-red-400', 
      bg: 'bg-red-400/10', 
      text: 'Connection Error',
      showReconnect: true
    }
  }

  const config = statusConfig[state.connectionStatus]

  return (
    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${config.bg} ${className}`}>
      <div className={`w-2 h-2 rounded-full ${config.color.replace('text-', 'bg-')}`} />
      <span className={`text-sm font-medium ${config.color}`}>
        {config.text}
      </span>
      {config.showReconnect && (
        <button
          onClick={reconnect}
          className="text-xs text-purple-400 hover:text-purple-300 underline ml-2"
        >
          Reconnect
        </button>
      )}
    </div>
  )
}

/**
 * Chat System Status Debug Component
 */
export function ChatSystemDebug() {
  const { state } = useChatSystem()
  const realtimeState = realtimeManager.getState()

  if (process.env.NODE_ENV !== 'development') return null

  return (
    <details className="fixed bottom-4 right-4 bg-neutral-800 rounded p-4 text-xs z-50">
      <summary className="cursor-pointer text-purple-400 mb-2">Chat System Debug</summary>
      <pre className="text-neutral-300 whitespace-pre-wrap">
        {JSON.stringify({
          chatSystem: state,
          realtime: realtimeState,
          chatManager: chatRealtimeManager.getState()
        }, null, 2)}
      </pre>
    </details>
  )
}
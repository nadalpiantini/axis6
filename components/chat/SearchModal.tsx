'use client'

import { motion, AnimatePresence } from 'framer-motion'
import React from 'react'

import { SearchResult } from '@/lib/services/message-search'

import { MessageSearch } from './MessageSearch'


interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  onResultSelect?: (result: SearchResult) => void
}

export function SearchModal({ isOpen, onClose, onResultSelect }: SearchModalProps) {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 lg:p-6"
          style={{
            paddingTop: 'max(env(safe-area-inset-top, 0px), 1rem)',
            paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 1rem)',
            paddingLeft: 'max(env(safe-area-inset-left, 0px), 0.5rem)',
            paddingRight: 'max(env(safe-area-inset-right, 0px), 0.5rem)'
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-[95vw] sm:max-w-[90vw] lg:max-w-2xl max-h-[90vh] sm:max-h-[85vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <MessageSearch
              onClose={onClose}
              onResultSelect={onResultSelect}
              className="w-full h-full"
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
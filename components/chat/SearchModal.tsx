'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSearch } from './MessageSearch'
import { SearchResult } from '@/lib/services/message-search'

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
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20"
        >
          <MessageSearch
            onClose={onClose}
            onResultSelect={onResultSelect}
            className="mx-4 w-full max-w-2xl"
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
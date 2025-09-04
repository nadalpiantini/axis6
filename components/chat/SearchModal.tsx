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
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] sm:w-[calc(100%-4rem)] md:max-w-lg lg:max-w-xl max-h-[85vh] overflow-y-auto z-50"
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

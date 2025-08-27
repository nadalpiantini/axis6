'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react'
import React, { useState, useEffect } from 'react'

import { Button } from '@/components/ui/Button'
import { ChatAttachment } from '@/lib/supabase/chat-storage'
import { cn } from '@/lib/utils'

interface ImageLightboxProps {
  isOpen: boolean
  onClose: () => void
  attachment: ChatAttachment
  imageUrl: string
  className?: string
}

export function ImageLightbox({
  isOpen,
  onClose,
  attachment,
  imageUrl,
  className
}: ImageLightboxProps) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setZoom(1)
      setRotation(0)
      setPosition({ x: 0, y: 0 })
    }
  }, [isOpen])

  // Handle keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return

    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          onClose()
          break
        case '+':
        case '=':
          setZoom(prev => Math.min(prev * 1.2, 5))
          break
        case '-':
          setZoom(prev => Math.max(prev / 1.2, 0.1))
          break
        case '0':
          setZoom(1)
          setPosition({ x: 0, y: 0 })
          setRotation(0)
          break
        case 'r':
        case 'R':
          setRotation(prev => prev + 90)
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isOpen, onClose])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleDownload = async () => {
    try {
      const link = document.createElement('a')
      link.href = imageUrl
      link.download = attachment.file_name
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      // TODO: Replace with proper error handling
    // // TODO: Replace with proper error handling
    // console.error('Failed to download image:', error);
    }
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.2, 5))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.2, 0.1))
  }

  const handleRotate = () => {
    setRotation(prev => prev + 90)
  }

  const handleReset = () => {
    setZoom(1)
    setPosition({ x: 0, y: 0 })
    setRotation(0)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={cn(
            "fixed inset-0 z-50 bg-black/90 flex items-center justify-center",
            "backdrop-blur-sm",
            className
          )}
          onClick={onClose}
        >
          {/* Controls */}
          <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
            <div className="bg-black/50 rounded-lg px-2 py-1">
              <span className="text-white text-sm">
                {Math.round(zoom * 100)}%
              </span>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              className="bg-black/50 text-white hover:bg-black/70"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              className="bg-black/50 text-white hover:bg-black/70"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRotate}
              className="bg-black/50 text-white hover:bg-black/70"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="bg-black/50 text-white hover:bg-black/70"
            >
              <Download className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="bg-black/50 text-white hover:bg-black/70"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Image Info */}
          <div className="absolute top-4 left-4 z-10 bg-black/50 rounded-lg px-3 py-2 text-white">
            <h3 className="font-medium text-sm">{attachment.file_name}</h3>
            <p className="text-xs text-gray-300">
              {attachment.width && attachment.height && (
                <span>{attachment.width} × {attachment.height} • </span>
              )}
              {(attachment.file_size / 1024).toFixed(1)} KB
            </p>
          </div>

          {/* Image Container */}
          <div
            className="relative max-w-[90vw] max-h-[90vh] overflow-hidden"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.img
              src={imageUrl}
              alt={attachment.file_name}
              className={cn(
                "max-w-none object-contain select-none",
                isDragging ? "cursor-grabbing" : zoom > 1 ? "cursor-grab" : "cursor-default"
              )}
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                transformOrigin: 'center'
              }}
              draggable={false}
              onDoubleClick={handleReset}
            />
          </div>

          {/* Instructions */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
            <div className="bg-black/50 rounded-lg px-3 py-2 text-white text-xs space-y-1">
              <p>Double-click to reset • Drag to pan when zoomed</p>
              <p>+ / - to zoom • R to rotate • ESC to close</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
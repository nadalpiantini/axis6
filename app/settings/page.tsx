'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  Edit3, 
  Save, 
  X, 
  Palette, 
  Type,
  RefreshCw,
  Loader2,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  ListPlus,
  BarChart3
} from 'lucide-react'
import { LogoFull } from '@/components/ui/Logo'
import { StandardHeader } from '@/components/layout/StandardHeader'
import { AxisIcon } from '@/components/icons'
import { useCategories, useUser } from '@/lib/react-query/hooks'
import { createClient } from '@/lib/supabase/client'
import { AxisActivitiesModal } from '@/components/settings/AxisActivitiesModal'

interface EditableAxis {
  id: number
  slug: string
  name: string
  description: string
  color: string
  icon: string
  position: number
  isEditing: boolean
}

interface NotificationState {
  show: boolean
  type: 'success' | 'error'
  message: string
}

const AVAILABLE_COLORS = [
  '#65D39A', '#9B8AE6', '#FF8B7D', '#6AA6FF', '#FFB366', '#F97B8B',
  '#A78BFA', '#34D399', '#60A5FA', '#F472B6', '#FBBF24', '#FB7185'
]

const AVAILABLE_ICONS = [
  'activity', 'brain', 'heart', 'users', 'sparkles', 'target',
  'sun', 'moon', 'star', 'zap', 'flame', 'leaf'
]

export default function SettingsPage() {
  const { data: user } = useUser()
  const { data: categories = [], isLoading, error, refetch } = useCategories()
  const [editableAxes, setEditableAxes] = useState<EditableAxis[]>([])
  const [saving, setSaving] = useState(false)
  const [showDropdown, setShowDropdown] = useState<number | null>(null)
  const [activitiesModalAxis, setActivitiesModalAxis] = useState<EditableAxis | null>(null)
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    type: 'success',
    message: ''
  })

  // Initialize editable axes when categories load
  useEffect(() => {
    if (categories.length > 0) {
      setEditableAxes(
        categories.map(cat => ({
          id: cat.id,
          slug: cat.slug,
          name: cat.name?.['en'] || cat.slug,
          description: cat.description?.['en'] || '',
          color: cat.color,
          icon: cat.icon,
          position: cat.position,
          isEditing: false
        }))
      )
    }
  }, [categories])

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ show: true, type, message })
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }))
    }, 4000)
  }

  const toggleEdit = (id: number) => {
    setEditableAxes(prev =>
      prev.map(axis =>
        axis.id === id
          ? { ...axis, isEditing: !axis.isEditing }
          : { ...axis, isEditing: false } // Close other edits
      )
    )
  }

  const updateAxis = (id: number, field: keyof EditableAxis, value: string) => {
    setEditableAxes(prev =>
      prev.map(axis =>
        axis.id === id ? { ...axis, [field]: value } : axis
      )
    )
  }

  const saveAxis = async (id: number) => {
    const axis = editableAxes.find(a => a.id === id)
    if (!axis) return

    setSaving(true)
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from('axis6_categories')
        .update({
          name: { en: axis.name, es: axis.name },
          description: { en: axis.description, es: axis.description },
          color: axis.color,
          icon: axis.icon
        })
        .eq('id', id)

      if (error) throw error

      setEditableAxes(prev =>
        prev.map(a => (a.id === id ? { ...a, isEditing: false } : a))
      )
      
      showNotification('success', `${axis.name} updated successfully!`)
      refetch() // Refresh categories data
      
    } catch (error) {
      // TODO: Replace with proper error handling
    // console.error('Error updating axis:', error);
      showNotification('error', 'Failed to update axis. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const cancelEdit = (id: number) => {
    // Reset to original values
    const originalCategory = categories.find(c => c.id === id)
    if (originalCategory) {
      setEditableAxes(prev =>
        prev.map(axis =>
          axis.id === id
            ? {
                ...axis,
                name: originalCategory.name?.['en'] || originalCategory.slug,
                description: originalCategory.description?.['en'] || '',
                color: originalCategory.color,
                icon: originalCategory.icon,
                isEditing: false
              }
            : axis
        )
      )
    }
  }

  const resetToDefaults = async () => {
    if (!confirm('Are you sure you want to reset all axes to their default settings? This cannot be undone.')) {
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      
      // Reset to default values
      const defaultAxes = [
        { slug: 'physical', name: 'Physical', description: 'Exercise, health, and nutrition', color: '#65D39A', icon: 'activity' },
        { slug: 'mental', name: 'Mental', description: 'Learning, focus, and productivity', color: '#9B8AE6', icon: 'brain' },
        { slug: 'emotional', name: 'Emotional', description: 'Mood and stress management', color: '#FF8B7D', icon: 'heart' },
        { slug: 'social', name: 'Social', description: 'Relationships and connections', color: '#6AA6FF', icon: 'users' },
        { slug: 'spiritual', name: 'Spiritual', description: 'Meditation, gratitude, and purpose', color: '#FFB366', icon: 'sparkles' },
        { slug: 'purpose', name: 'Purpose', description: 'Goals, achievements, and contribution', color: '#F97B8B', icon: 'target' }
      ]

      for (const defaultAxis of defaultAxes) {
        await supabase
          .from('axis6_categories')
          .update({
            name: { en: defaultAxis.name, es: defaultAxis.name },
            description: { en: defaultAxis.description, es: defaultAxis.description },
            color: defaultAxis.color,
            icon: defaultAxis.icon
          })
          .eq('slug', defaultAxis.slug)
      }

      showNotification('success', 'All axes have been reset to default settings!')
      refetch()
      
    } catch (error) {
      // TODO: Replace with proper error handling
    // console.error('Error resetting axes:', error);
      showNotification('error', 'Failed to reset axes. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Settings</h2>
          <p className="text-gray-400 mb-6">Unable to load your axis configuration.</p>
          <button 
            onClick={() => refetch()}
            className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen text-white">
      {/* Header */}
      <StandardHeader
        user={user}
        variant="settings"
        title="Configuración"
        subtitle="Personaliza tu experiencia AXIS6"
        showBackButton={true}
        backUrl="/dashboard"
      />

      {/* Main Settings Container */}
      <div className="max-w-6xl mx-auto px-4 py-8" data-testid="main-settings-container">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-gray-400">Customize your AXIS6 experience and personalize your dimensions</p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-8" data-testid="settings-sections">
          {/* Axis Customization Section */}
          <div className="glass rounded-2xl p-8" data-testid="axis-customization-section">
            <h2 className="text-2xl font-semibold mb-6">Customize Your Axes</h2>
            <p className="text-gray-400 mb-8">
              Personalize each axis with custom names, descriptions, colors, and icons to match your wellness journey.
            </p>

          <div className="grid lg:grid-cols-2 gap-6">
            {editableAxes.map((axis) => (
              <motion.div
                key={axis.id}
                layout
                className={`p-6 rounded-xl border transition-all ${
                  axis.isEditing 
                    ? 'bg-white/10 border-purple-500/50' 
                    : 'bg-white/5 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: axis.color + '20' }}
                    >
                      <AxisIcon 
                        axis={axis.icon}
                        size={24}
                        color={axis.color}
                      />
                    </div>
                    {axis.isEditing ? (
                      <input
                        type="text"
                        value={axis.name}
                        onChange={(e) => updateAxis(axis.id, 'name', e.target.value)}
                        className="bg-white/10 border border-white/20 rounded px-3 py-1 text-white text-lg font-semibold"
                        placeholder="Axis name"
                      />
                    ) : (
                      <h3 className="text-lg font-semibold">{axis.name}</h3>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {axis.isEditing ? (
                      <>
                        <button
                          onClick={() => saveAxis(axis.id)}
                          disabled={saving}
                          className="p-2 text-green-400 hover:bg-green-500/20 rounded-lg transition-colors"
                          aria-label="Save changes"
                        >
                          {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => cancelEdit(axis.id)}
                          className="p-2 text-gray-400 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors"
                          aria-label="Cancel editing"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <div className="relative">
                        <button
                          onClick={() => setShowDropdown(showDropdown === axis.id ? null : axis.id)}
                          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          aria-label="More options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        
                        {/* Dropdown Menu */}
                        {showDropdown === axis.id && (
                          <div className="absolute right-0 top-10 w-48 glass rounded-lg shadow-lg border border-white/10 z-10">
                            <button
                              onClick={() => {
                                toggleEdit(axis.id)
                                setShowDropdown(null)
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center gap-3"
                            >
                              <Edit3 className="w-4 h-4" />
                              Edit Details
                            </button>
                            <button
                              onClick={() => {
                                setActivitiesModalAxis(axis)
                                setShowDropdown(null)
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center gap-3"
                            >
                              <ListPlus className="w-4 h-4" />
                              Customize Activities
                            </button>
                            <button
                              className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center gap-3 text-gray-400 cursor-not-allowed"
                              disabled
                            >
                              <BarChart3 className="w-4 h-4" />
                              View Statistics
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {axis.isEditing ? (
                  <div className="space-y-4">
                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={axis.description}
                        onChange={(e) => updateAxis(axis.id, 'description', e.target.value)}
                        className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white text-sm resize-none"
                        placeholder="Describe this axis"
                        rows={2}
                      />
                    </div>

                    {/* Color Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Palette className="w-4 h-4 inline mr-1" />
                        Color
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {AVAILABLE_COLORS.map((color) => (
                          <button
                            key={color}
                            onClick={() => updateAxis(axis.id, 'color', color)}
                            className={`w-8 h-8 rounded-lg transition-all ${
                              axis.color === color 
                                ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-800' 
                                : 'hover:scale-110'
                            }`}
                            style={{ backgroundColor: color }}
                            aria-label={`Select color ${color}`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Icon Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        <Type className="w-4 h-4 inline mr-1" />
                        Icon
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {AVAILABLE_ICONS.map((icon) => (
                          <button
                            key={icon}
                            onClick={() => updateAxis(axis.id, 'icon', icon)}
                            className={`p-2 rounded-lg transition-all ${
                              axis.icon === icon 
                                ? 'bg-purple-500/30 ring-1 ring-purple-500' 
                                : 'bg-white/10 hover:bg-white/20'
                            }`}
                            aria-label={`Select icon ${icon}`}
                          >
                            <AxisIcon 
                              axis={icon}
                              size={20}
                              color={axis.color}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">{axis.description}</p>
                )}
              </motion.div>
            ))}
            </div>
          </div>

          {/* General Settings Section */}
          <div className="glass rounded-2xl p-8" data-testid="general-settings-section">
            <h2 className="text-2xl font-semibold mb-6">General Settings</h2>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <h3 className="font-medium mb-2">Account Preferences</h3>
                <p className="text-sm text-gray-400">Manage your account settings and preferences</p>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <h3 className="font-medium mb-2">Notifications</h3>
                <p className="text-sm text-gray-400">Control how and when you receive notifications</p>
              </div>
            </div>
          </div>

          {/* Privacy Settings Section */}
          <div className="glass rounded-2xl p-8" data-testid="privacy-settings-section">
            <h2 className="text-2xl font-semibold mb-6">Privacy & Security</h2>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <h3 className="font-medium mb-2">Data Privacy</h3>
                <p className="text-sm text-gray-400">Control your data sharing and privacy preferences</p>
              </div>
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <h3 className="font-medium mb-2">Security Settings</h3>
                <p className="text-sm text-gray-400">Manage your account security and authentication</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <AnimatePresence>
        {notification.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-6 left-1/2 transform z-50"
          >
            <div className={`
              flex items-center gap-3 px-6 py-3 rounded-lg backdrop-blur-md
              ${notification.type === 'success' 
                ? 'bg-green-500/20 border border-green-500/50 text-green-400' 
                : 'bg-red-500/20 border border-red-500/50 text-red-400'
              }
            `}>
              {notification.type === 'success' ? (
                <CheckCircle className="w-5 h-5" />
              ) : (
                <AlertCircle className="w-5 h-5" />
              )}
              <span className="font-medium">{notification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activities Modal */}
      {activitiesModalAxis && user && (
        <AxisActivitiesModal
          isOpen={!!activitiesModalAxis}
          onClose={() => setActivitiesModalAxis(null)}
          userId={user.id}
          axis={activitiesModalAxis}
        />
      )}
    </div>
  )
}
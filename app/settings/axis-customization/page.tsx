'use client'
import { motion } from 'framer-motion'
import {
  Target,
  Settings,
  Zap,
  Eye,
  EyeOff,
  Users,
  Activity,
  Sparkles,
  RotateCcw,
  Save,
  Palette,
  BarChart3,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { SettingsLayout } from '@/components/settings/SettingsLayout'
import { AxisActivitiesModal } from '@/components/settings/AxisActivitiesModal'
import { AxisIcon } from '@/components/icons'
import { useCategories, useUser } from '@/lib/react-query/hooks'
import { useAxisCustomization, useUpdateAxisCustomization } from '@/lib/react-query/hooks/useSettings'
import { usePreferencesStore, useUIStore } from '@/lib/stores/useAppStore'
import { getCategoryName } from '@/lib/utils/i18n'
interface AxisCustomization {
  id: string | number
  name: string
  slug: string
  color: string
  icon: string
  dailyGoal: number
  showInQuickActions: boolean
  priority: number
}
interface NotificationState {
  show: boolean
  type: 'success' | 'error'
  message: string
}
export default function AxisCustomizationPage() {
  const { data: user } = useUser()
  const { data: categories } = useCategories()
  const { data: axisSettings, isLoading: loadingSettings } = useAxisCustomization()
  const updateAxisCustomization = useUpdateAxisCustomization()
  const { showResonance, toggleResonance } = usePreferencesStore()
  // Modal states
  const [isActivitiesModalOpen, setIsActivitiesModalOpen] = useState(false)
  const [selectedAxis, setSelectedAxis] = useState<string>('')
  // Local state for customization
  const [axisSettingsLocal, setAxisSettingsLocal] = useState<Record<string, AxisCustomization>>({})
  const [hexagonSize, setHexagonSize] = useState<'small' | 'medium' | 'large'>('medium')
  const [showCommunityPulse, setShowCommunityPulse] = useState(true)
  const [defaultView, setDefaultView] = useState<'hexagon' | 'list' | 'grid'>('hexagon')
  const [hasChanges, setHasChanges] = useState(false)
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    type: 'success',
    message: ''
  })
  // Initialize settings from categories and API data
  useEffect(() => {
    if (categories?.length && axisSettings) {
      setAxisSettingsLocal(axisSettings.axis_customizations || {})
      setHexagonSize(axisSettings.hexagon_size || 'medium')
      setShowCommunityPulse(axisSettings.show_community_pulse ?? true)
      setDefaultView(axisSettings.default_view || 'hexagon')
    } else if (categories?.length && !loadingSettings) {
      // Initialize with category defaults if no saved settings
      const settings: Record<string, AxisCustomization> = {}
      categories.forEach((cat, index) => {
        settings[cat.slug] = {
          id: cat.id,
          name: getCategoryName(cat, 'en'),
          slug: cat.slug,
          color: cat.color,
          icon: cat.icon,
          dailyGoal: 1,
          showInQuickActions: index < 3,
          priority: index + 1
        }
      })
      setAxisSettingsLocal(settings)
    }
  }, [categories, axisSettings, loadingSettings])
  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ show: true, type, message })
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }))
    }, 4000)
  }
  const handleOpenActivitiesModal = (axisSlug: string) => {
    setSelectedAxis(axisSlug)
    setIsActivitiesModalOpen(true)
  }
  const handleUpdateAxisSetting = (axisSlug: string, updates: Partial<AxisCustomization>) => {
    setAxisSettingsLocal(prev => ({
      ...prev,
      [axisSlug]: { ...prev[axisSlug], ...updates }
    }))
    setHasChanges(true)
  }
  const handleSaveSettings = async () => {
    try {
      await updateAxisCustomization.mutateAsync({
        hexagon_size: hexagonSize,
        show_community_pulse: showCommunityPulse,
        show_resonance: showResonance,
        default_view: defaultView,
        axis_customizations: axisSettingsLocal
      })
      setHasChanges(false)
      showNotification('success', 'Settings saved successfully!')
    } catch (error) {
      console.error('Failed to save settings:', error)
      showNotification('error', 'Failed to save settings. Please try again.')
    }
  }
  const handleResetToDefaults = () => {
    if (categories?.length) {
      const defaultSettings: Record<string, AxisCustomization> = {}
      categories.forEach((cat, index) => {
        defaultSettings[cat.slug] = {
          id: cat.id,
          name: getCategoryName(cat, 'en'),
          slug: cat.slug,
          color: cat.color,
          icon: cat.icon,
          dailyGoal: 1,
          showInQuickActions: index < 3,
          priority: index + 1
        }
      })
      setAxisSettingsLocal(defaultSettings)
      setHexagonSize('medium')
      setShowCommunityPulse(true)
      setDefaultView('hexagon')
      setHasChanges(true)
    }
  }
  const handleHexagonSizeChange = (size: 'small' | 'medium' | 'large') => {
    setHexagonSize(size)
    setHasChanges(true)
  }
  const handleCommunityPulseChange = (enabled: boolean) => {
    setShowCommunityPulse(enabled)
    setHasChanges(true)
  }
  const handleDefaultViewChange = (view: 'hexagon' | 'list' | 'grid') => {
    setDefaultView(view)
    setHasChanges(true)
  }
  const handleResonanceToggle = () => {
    toggleResonance()
    setHasChanges(true)
  }
  if (loadingSettings) {
    return (
      <SettingsLayout currentSection="axis">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        </div>
      </SettingsLayout>
    )
  }
  return (
    <div
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)'
      }}
    >
      <SettingsLayout currentSection="axis">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold mb-2">Axis & Wellness</h1>
            <p className="text-gray-400 text-sm">Customize your wellness tracking experience</p>
          </div>
          {/* Axis Configuration */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <Target className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Axis Settings</h2>
                <p className="text-sm text-gray-400">Configure goals and preferences for each axis</p>
              </div>
            </div>
            <div className="space-y-4">
              {Object.values(axisSettingsLocal).map((axis) => (
                <motion.div
                  key={axis.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2 rounded-lg border"
                        style={{
                          backgroundColor: `${axis.color}20`,
                          borderColor: `${axis.color}40`
                        }}
                      >
                        <AxisIcon axis={axis.slug} className="w-4 h-4" color={axis.color} animated={false} />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{axis.name}</h3>
                        <p className="text-xs text-gray-400">{axis.slug}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenActivitiesModal(axis.slug)}
                      className="min-h-[44px] px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg transition-colors"
                    >
                      <Settings className="w-4 h-4 text-purple-400" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Daily Goal */}
                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-2">
                        Daily Goal
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={axis.dailyGoal}
                        onChange={(e) => handleUpdateAxisSetting(axis.slug, {
                          dailyGoal: parseInt(e.target.value) || 1
                        })}
                        className="w-full px-3 py-2 bg-white/5 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                      />
                    </div>
                    {/* Quick Actions */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">
                          Quick Actions
                        </label>
                        <p className="text-xs text-gray-500">Show in dashboard shortcuts</p>
                      </div>
                      <button
                        onClick={() => handleUpdateAxisSetting(axis.slug, {
                          showInQuickActions: !axis.showInQuickActions
                        })}
                        className={`min-h-[44px] min-w-[44px] p-3 rounded-lg transition-all ${
                          axis.showInQuickActions
                            ? 'bg-purple-500/20 border border-purple-500/40 text-purple-400'
                            : 'bg-white/5 border border-white/20 text-gray-400'
                        }`}
                      >
                        <Zap className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          {/* Hexagon Visualization Settings */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Palette className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Hexagon Display</h2>
                <p className="text-sm text-gray-400">Customize your hexagon visualization</p>
              </div>
            </div>
            <div className="space-y-6">
              {/* Hexagon Size */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Hexagon Size
                </label>
                <div className="flex gap-2">
                  {(['small', 'medium', 'large'] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => handleHexagonSizeChange(size)}
                      className={`min-h-[44px] flex-1 py-2 px-4 rounded-lg transition-all capitalize ${
                        hexagonSize === size
                          ? 'bg-blue-500/20 border border-blue-500/40 text-blue-400'
                          : 'bg-white/5 border border-white/20 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
              {/* Community Resonance */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-white mb-1">Community Resonance</h3>
                  <p className="text-sm text-gray-400">Show resonance dots from other users</p>
                </div>
                <button
                  onClick={handleResonanceToggle}
                  className={`min-h-[44px] min-w-[44px] p-3 rounded-lg transition-all ${
                    showResonance
                      ? 'bg-green-500/20 border border-green-500/40 text-green-400'
                      : 'bg-white/5 border border-white/20 text-gray-400'
                  }`}
                >
                  {showResonance ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
              {/* Community Pulse */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-white mb-1">Community Pulse</h3>
                  <p className="text-sm text-gray-400">Anonymous activity visualization</p>
                </div>
                <button
                  onClick={() => handleCommunityPulseChange(!showCommunityPulse)}
                  className={`min-h-[44px] min-w-[44px] p-3 rounded-lg transition-all ${
                    showCommunityPulse
                      ? 'bg-purple-500/20 border border-purple-500/40 text-purple-400'
                      : 'bg-white/5 border border-white/20 text-gray-400'
                  }`}
                >
                  <Users className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          {/* Dashboard Preferences */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <BarChart3 className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Dashboard Preferences</h2>
                <p className="text-sm text-gray-400">Customize your default dashboard view</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">
                Default View
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['hexagon', 'list', 'grid'] as const).map((view) => (
                  <button
                    key={view}
                    onClick={() => handleDefaultViewChange(view)}
                    className={`min-h-[44px] py-3 px-4 rounded-lg transition-all capitalize ${
                      defaultView === view
                        ? 'bg-orange-500/20 border border-orange-500/40 text-orange-400'
                        : 'bg-white/5 border border-white/20 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {view}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleSaveSettings}
              disabled={!hasChanges || updateAxisCustomization.isPending}
              className={`min-h-[44px] flex-1 flex items-center justify-center gap-2 font-medium py-3 px-6 rounded-lg transition-colors ${
                hasChanges && !updateAxisCustomization.isPending
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              {updateAxisCustomization.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {updateAxisCustomization.isPending ? 'Saving...' : 'Save Changes'}
            </button>
            <button
              onClick={handleResetToDefaults}
              disabled={updateAxisCustomization.isPending}
              className="min-h-[44px] flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/20 text-gray-300 font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              Reset to Defaults
            </button>
          </div>
        </div>
        {/* Activities Modal */}
        {isActivitiesModalOpen && (
          <AxisActivitiesModal
            isOpen={isActivitiesModalOpen}
            onClose={() => setIsActivitiesModalOpen(false)}
            categorySlug={selectedAxis}
          />
        )}
        {/* Notification Toast */}
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
      </SettingsLayout>
    </div>
  )
}
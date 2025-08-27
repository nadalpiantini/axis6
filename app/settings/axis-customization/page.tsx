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
  BarChart3
} from 'lucide-react'
import { useState, useEffect } from 'react'

import { SettingsLayout } from '@/components/settings/SettingsLayout'
import { AxisActivitiesModal } from '@/components/settings/AxisActivitiesModal'
import { AxisIcon } from '@/components/icons'
import { useCategories, useUser } from '@/lib/react-query/hooks'
import { usePreferencesStore, useUIStore } from '@/lib/stores/useAppStore'

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

export default function AxisCustomizationPage() {
  const { data: user } = useUser()
  const { data: categories } = useCategories()
  const { showResonance, toggleResonance } = usePreferencesStore()
  
  // Modal states
  const [isActivitiesModalOpen, setIsActivitiesModalOpen] = useState(false)
  const [selectedAxis, setSelectedAxis] = useState<string>('')
  
  // Local state for customization
  const [axisSettings, setAxisSettings] = useState<Record<string, AxisCustomization>>({})
  const [hexagonSize, setHexagonSize] = useState<'small' | 'medium' | 'large'>('medium')
  const [showCommunityPulse, setShowCommunityPulse] = useState(true)
  const [defaultView, setDefaultView] = useState<'hexagon' | 'list' | 'grid'>('hexagon')

  // Initialize axis settings from categories
  useEffect(() => {
    if (categories?.length) {
      const settings: Record<string, AxisCustomization> = {}
      categories.forEach((cat, index) => {
        settings[cat.slug] = {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          color: cat.color,
          icon: cat.icon,
          dailyGoal: 1, // Default to 1 check-in per day
          showInQuickActions: index < 3, // Show first 3 in quick actions
          priority: index + 1
        }
      })
      setAxisSettings(settings)
    }
  }, [categories])

  const handleOpenActivitiesModal = (axisSlug: string) => {
    setSelectedAxis(axisSlug)
    setIsActivitiesModalOpen(true)
  }

  const handleUpdateAxisSetting = (axisSlug: string, updates: Partial<AxisCustomization>) => {
    setAxisSettings(prev => ({
      ...prev,
      [axisSlug]: { ...prev[axisSlug], ...updates }
    }))
  }

  const handleSaveSettings = async () => {
    // TODO: Implement save to database
    }

  const handleResetToDefaults = () => {
    if (categories?.length) {
      const defaultSettings: Record<string, AxisCustomization> = {}
      categories.forEach((cat, index) => {
        defaultSettings[cat.slug] = {
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          color: cat.color,
          icon: cat.icon,
          dailyGoal: 1,
          showInQuickActions: index < 3,
          priority: index + 1
        }
      })
      setAxisSettings(defaultSettings)
      setHexagonSize('medium')
      setShowCommunityPulse(true)
      setDefaultView('hexagon')
    }
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
              {Object.values(axisSettings).map((axis) => (
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
                        <AxisIcon type={axis.slug as any} className="w-4 h-4" color={axis.color} />
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
                      onClick={() => setHexagonSize(size)}
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
                  onClick={toggleResonance}
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
                  onClick={() => setShowCommunityPulse(!showCommunityPulse)}
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
                    onClick={() => setDefaultView(view)}
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
              className="min-h-[44px] flex-1 flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              <Save className="w-4 h-4" />
              Save Changes
            </button>
            
            <button
              onClick={handleResetToDefaults}
              className="min-h-[44px] flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/20 text-gray-300 font-medium py-3 px-6 rounded-lg transition-colors"
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
      </SettingsLayout>
    </div>
  )
}
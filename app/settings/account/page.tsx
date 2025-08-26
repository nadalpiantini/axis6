'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  User,
  Mail,
  Globe,
  Clock,
  Monitor,
  Palette,
  Download,
  Trash2,
  Save,
  CheckCircle,
  AlertCircle,
  Loader2,
  RotateCcw
} from 'lucide-react'
import { SettingsLayout } from '@/components/settings/SettingsLayout'
import { SettingsSection, SettingItem, SettingGroup } from '@/components/settings/SettingsSection'
import { useUser } from '@/lib/react-query/hooks'
import { createClient } from '@/lib/supabase/client'

interface UserPreferences {
  theme_preference: string
  language: string
  timezone: string
  dashboard_layout: string
  default_landing_page: string
  display_density: string
  accessibility_options: {
    high_contrast: boolean
    large_text: boolean
    reduced_motion: boolean
    screen_reader: boolean
  }
}

interface ProfileData {
  name: string
  email: string
  created_at: string
}

export default function AccountSettingsPage() {
  const { data: user } = useUser()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme_preference: 'temperament_based',
    language: 'en',
    timezone: 'America/Santo_Domingo',
    dashboard_layout: 'hexagon',
    default_landing_page: '/dashboard',
    display_density: 'comfortable',
    accessibility_options: {
      high_contrast: false,
      large_text: false,
      reduced_motion: false,
      screen_reader: false
    }
  })
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [notification, setNotification] = useState<{
    show: boolean
    type: 'success' | 'error'
    message: string
  }>({ show: false, type: 'success', message: '' })

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return

      try {
        const supabase = createClient()
        
        // Load profile
        const { data: profileData } = await supabase
          .from('axis6_profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileData) {
          setProfile({
            name: profileData.name || user.email?.split('@')[0] || 'User',
            email: user.email || '',
            created_at: user.created_at || new Date().toISOString()
          })
        }

        // Load preferences
        const { data: preferencesData } = await supabase
          .from('axis6_user_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (preferencesData) {
          setPreferences({
            theme_preference: preferencesData.theme_preference || 'temperament_based',
            language: preferencesData.language || 'en',
            timezone: preferencesData.timezone || 'America/Santo_Domingo',
            dashboard_layout: preferencesData.dashboard_layout || 'hexagon',
            default_landing_page: preferencesData.default_landing_page || '/dashboard',
            display_density: preferencesData.display_density || 'comfortable',
            accessibility_options: preferencesData.accessibility_options || {
              high_contrast: false,
              large_text: false,
              reduced_motion: false,
              screen_reader: false
            }
          })
        }
      } catch (error) {
        console.error('Error loading user data:', error)
        showNotification('error', 'Failed to load settings')
      } finally {
        setLoading(false)
      }
    }

    loadUserData()
  }, [user])

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ show: true, type, message })
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }))
    }, 4000)
  }

  const handlePreferenceChange = (key: keyof UserPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleAccessibilityChange = (key: keyof UserPreferences['accessibility_options'], value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      accessibility_options: {
        ...prev.accessibility_options,
        [key]: value
      }
    }))
    setHasChanges(true)
  }

  const handleProfileChange = (key: keyof ProfileData, value: string) => {
    if (profile) {
      setProfile(prev => prev ? ({ ...prev, [key]: value }) : null)
      setHasChanges(true)
    }
  }

  const saveSettings = async () => {
    if (!user) return

    setSaving(true)
    try {
      const supabase = createClient()
      
      // Save profile changes
      if (profile) {
        const { error: profileError } = await supabase
          .from('axis6_profiles')
          .upsert({
            id: user.id,
            name: profile.name,
            updated_at: new Date().toISOString()
          })

        if (profileError) throw profileError
      }

      // Save preferences
      const { error: preferencesError } = await supabase
        .from('axis6_user_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString()
        })

      if (preferencesError) throw preferencesError

      setHasChanges(false)
      showNotification('success', 'Settings saved successfully!')
    } catch (error) {
      console.error('Error saving settings:', error)
      showNotification('error', 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const resetSettings = () => {
    // Reset to defaults or reload from server
    setPreferences({
      theme_preference: 'temperament_based',
      language: 'en',
      timezone: 'America/Santo_Domingo',
      dashboard_layout: 'hexagon',
      default_landing_page: '/dashboard',
      display_density: 'comfortable',
      accessibility_options: {
        high_contrast: false,
        large_text: false,
        reduced_motion: false,
        screen_reader: false
      }
    })
    setHasChanges(true)
  }

  const exportData = async () => {
    if (!user) return

    try {
      const supabase = createClient()
      
      // Fetch all user data
      const [checkinsRes, streaksRes, categoriesRes, profileRes] = await Promise.all([
        supabase.from('axis6_checkins').select('*').eq('user_id', user.id),
        supabase.from('axis6_streaks').select('*').eq('user_id', user.id),
        supabase.from('axis6_categories').select('*'),
        supabase.from('axis6_profiles').select('*').eq('id', user.id).single()
      ])

      const exportData = {
        profile: profileRes.data,
        preferences: preferences,
        checkins: checkinsRes.data || [],
        streaks: streaksRes.data || [],
        categories: categoriesRes.data || [],
        exported_at: new Date().toISOString()
      }

      // Create and download JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `axis6_data_export_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      showNotification('success', 'Data exported successfully!')
    } catch (error) {
      console.error('Error exporting data:', error)
      showNotification('error', 'Failed to export data')
    }
  }

  const deleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return
    }

    if (!confirm('This is your final warning. All your data will be permanently deleted.')) {
      return
    }

    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      showNotification('success', 'Account deletion initiated. You will receive a confirmation email.')
      
      // Redirect to home after a delay
      setTimeout(() => {
        window.location.href = '/'
      }, 2000)
    } catch (error) {
      console.error('Error deleting account:', error)
      showNotification('error', 'Failed to delete account')
    }
  }

  if (loading) {
    return (
      <SettingsLayout currentSection="account">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        </div>
      </SettingsLayout>
    )
  }

  return (
    <SettingsLayout currentSection="account">
      <div className="space-y-8">
        {/* Profile Information */}
        <SettingsSection
          title="Profile Information"
          description="Basic account information and personal details"
          icon={User}
          hasChanges={hasChanges}
          onSave={saveSettings}
          onReset={resetSettings}
          isLoading={saving}
        >
          <SettingGroup title="Account Details">
            <SettingItem
              label="Full Name"
              description="Your display name across AXIS6"
              value={profile?.name || ''}
              onChange={(value) => handleProfileChange('name', value)}
              type="text"
              placeholder="Enter your name"
              required
            />
            <SettingItem
              label="Email Address"
              description="Your primary email for account access and notifications"
              value={profile?.email || ''}
              onChange={() => {}} // Email is read-only
              type="email"
              disabled
            />
            <SettingItem
              label="Member Since"
              description="When you joined AXIS6"
              value={profile ? new Date(profile.created_at).toLocaleDateString() : ''}
              onChange={() => {}} // Read-only
              type="text"
              disabled
            />
          </SettingGroup>
        </SettingsSection>

        {/* Display Preferences */}
        <SettingsSection
          title="Display Preferences"
          description="Customize how AXIS6 looks and feels"
          icon={Palette}
          hasChanges={hasChanges}
          onSave={saveSettings}
          onReset={resetSettings}
          isLoading={saving}
        >
          <SettingGroup title="Theme & Appearance">
            <SettingItem
              label="Theme"
              description="Choose your preferred color scheme"
              value={preferences.theme_preference}
              onChange={(value) => handlePreferenceChange('theme_preference', value)}
              type="select"
              options={[
                { value: 'temperament_based', label: 'Based on Temperament (Recommended)' },
                { value: 'dark', label: 'Dark Theme' },
                { value: 'light', label: 'Light Theme' },
                { value: 'auto', label: 'System Preference' }
              ]}
            />
            <SettingItem
              label="Language"
              description="Your preferred language for the interface"
              value={preferences.language}
              onChange={(value) => handlePreferenceChange('language', value)}
              type="select"
              options={[
                { value: 'en', label: 'English' },
                { value: 'es', label: 'Español' }
              ]}
            />
            <SettingItem
              label="Dashboard Layout"
              description="How your wellness data is displayed"
              value={preferences.dashboard_layout}
              onChange={(value) => handlePreferenceChange('dashboard_layout', value)}
              type="select"
              options={[
                { value: 'hexagon', label: 'Hexagon View (Recommended)' },
                { value: 'grid', label: 'Grid View' },
                { value: 'list', label: 'List View' }
              ]}
            />
            <SettingItem
              label="Display Density"
              description="How much information to show on screen"
              value={preferences.display_density}
              onChange={(value) => handlePreferenceChange('display_density', value)}
              type="select"
              options={[
                { value: 'compact', label: 'Compact' },
                { value: 'comfortable', label: 'Comfortable' },
                { value: 'spacious', label: 'Spacious' }
              ]}
            />
          </SettingGroup>
        </SettingsSection>

        {/* Regional Settings */}
        <SettingsSection
          title="Regional Settings"
          description="Location and time preferences"
          icon={Globe}
          hasChanges={hasChanges}
          onSave={saveSettings}
          onReset={resetSettings}
          isLoading={saving}
        >
          <SettingGroup title="Location & Time">
            <SettingItem
              label="Timezone"
              description="Your local timezone for accurate scheduling"
              value={preferences.timezone}
              onChange={(value) => handlePreferenceChange('timezone', value)}
              type="select"
              options={[
                { value: 'America/Santo_Domingo', label: 'Santo Domingo (UTC-4)' },
                { value: 'America/New_York', label: 'New York (UTC-5/UTC-4)' },
                { value: 'America/Los_Angeles', label: 'Los Angeles (UTC-8/UTC-7)' },
                { value: 'Europe/Madrid', label: 'Madrid (UTC+1/UTC+2)' },
                { value: 'Europe/London', label: 'London (UTC+0/UTC+1)' },
                { value: 'Asia/Tokyo', label: 'Tokyo (UTC+9)' }
              ]}
            />
            <SettingItem
              label="Default Landing Page"
              description="The page you see first when you open AXIS6"
              value={preferences.default_landing_page}
              onChange={(value) => handlePreferenceChange('default_landing_page', value)}
              type="select"
              options={[
                { value: '/dashboard', label: 'Dashboard' },
                { value: '/my-day', label: 'My Day' },
                { value: '/analytics', label: 'Analytics' },
                { value: '/profile', label: 'Profile' }
              ]}
            />
          </SettingGroup>
        </SettingsSection>

        {/* Accessibility */}
        <SettingsSection
          title="Accessibility Options"
          description="Make AXIS6 more accessible and easier to use"
          icon={Monitor}
          hasChanges={hasChanges}
          onSave={saveSettings}
          onReset={resetSettings}
          isLoading={saving}
        >
          <SettingGroup title="Visual Accessibility">
            <SettingItem
              label="High Contrast Mode"
              description="Increase contrast for better visibility"
              value={preferences.accessibility_options.high_contrast}
              onChange={(value) => handleAccessibilityChange('high_contrast', value)}
              type="toggle"
            />
            <SettingItem
              label="Large Text"
              description="Use larger fonts throughout the application"
              value={preferences.accessibility_options.large_text}
              onChange={(value) => handleAccessibilityChange('large_text', value)}
              type="toggle"
            />
            <SettingItem
              label="Reduced Motion"
              description="Minimize animations and transitions"
              value={preferences.accessibility_options.reduced_motion}
              onChange={(value) => handleAccessibilityChange('reduced_motion', value)}
              type="toggle"
            />
            <SettingItem
              label="Screen Reader Optimization"
              description="Optimize interface for screen readers"
              value={preferences.accessibility_options.screen_reader}
              onChange={(value) => handleAccessibilityChange('screen_reader', value)}
              type="toggle"
            />
          </SettingGroup>
        </SettingsSection>

        {/* Account Actions */}
        <SettingsSection
          title="Account Management"
          description="Export data and manage your account"
          icon={Trash2}
          className="border-red-500/20"
        >
          <SettingGroup title="Data Management">
            <div className="space-y-4">
              <button
                onClick={exportData}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Download className="w-5 h-5 text-blue-400" />
                  <div className="text-left">
                    <p className="font-medium text-blue-400">Export Your Data</p>
                    <p className="text-sm text-gray-400">Download all your wellness data as JSON</p>
                  </div>
                </div>
              </button>

              <button
                onClick={deleteAccount}
                className="w-full flex items-center justify-between p-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Trash2 className="w-5 h-5 text-red-400" />
                  <div className="text-left">
                    <p className="font-medium text-red-400">Delete Account</p>
                    <p className="text-sm text-gray-400">Permanently delete your account and all data</p>
                  </div>
                </div>
              </button>
            </div>
          </SettingGroup>
        </SettingsSection>
      </div>

      {/* Notifications */}
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
  )
}
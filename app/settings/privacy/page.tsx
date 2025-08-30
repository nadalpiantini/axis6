'use client'

import { motion } from 'framer-motion'
import {
  Shield,
  Eye,
  EyeOff,
  Database,
  Share2,
  Lock,
  Globe,
  Users,
  Brain,
  AlertTriangle,
  CheckCircle,
  Download,
  Trash2,
  Settings,
  Cookie,
  Target,
  BarChart3,
  Microscope,
  Mail,
  Smartphone,
  ExternalLink,
  Info
} from 'lucide-react'
import { useState, useEffect } from 'react'

import { SettingsLayout } from '@/components/settings/SettingsLayout'
import { SettingsSection, SettingItem, SettingGroup } from '@/components/settings/SettingsSection'
import { useUser } from '@/lib/react-query/hooks'

import { handleError } from '@/lib/error/standardErrorHandler'
interface PrivacySettings {
  // Data Collection & Usage
  collect_wellness_data: boolean
  collect_usage_analytics: boolean
  collect_performance_metrics: boolean
  collect_crash_reports: boolean

  // AI & Personalization
  ai_data_analysis: boolean
  ai_insights_generation: boolean
  ai_personalization: boolean
  ai_predictive_modeling: boolean
  share_anonymized_ai_training: boolean

  // Sharing & Visibility
  profile_visibility: 'private' | 'friends' | 'public'
  activity_sharing: boolean
  achievement_sharing: boolean
  streak_visibility: boolean
  mood_data_private: boolean

  // Third-Party Integrations
  allow_integrations: boolean
  share_with_health_apps: boolean
  share_with_fitness_trackers: boolean
  allow_social_logins: boolean

  // Marketing & Communications
  marketing_emails: boolean
  product_announcements: boolean
  survey_invitations: boolean
  beta_program_participation: boolean
  research_participation: boolean

  // Data Retention & Control
  data_retention_period: 'forever' | '1year' | '2years' | '5years'
  auto_delete_inactive: boolean
  export_data_monthly: boolean

  // Cookie & Tracking
  essential_cookies: boolean
  analytics_cookies: boolean
  marketing_cookies: boolean
  personalization_cookies: boolean

  // Advanced Privacy
  ip_address_anonymization: boolean
  location_data_collection: boolean
  device_fingerprinting: boolean
  cross_site_tracking: boolean
}

export default function PrivacySettingsPage() {
  const { data: user } = useUser()
  const [settings, setSettings] = useState<PrivacySettings>({
    // Data Collection & Usage
    collect_wellness_data: true,
    collect_usage_analytics: true,
    collect_performance_metrics: true,
    collect_crash_reports: true,

    // AI & Personalization
    ai_data_analysis: true,
    ai_insights_generation: true,
    ai_personalization: true,
    ai_predictive_modeling: false,
    share_anonymized_ai_training: false,

    // Sharing & Visibility
    profile_visibility: 'private',
    activity_sharing: false,
    achievement_sharing: false,
    streak_visibility: false,
    mood_data_private: true,

    // Third-Party Integrations
    allow_integrations: false,
    share_with_health_apps: false,
    share_with_fitness_trackers: false,
    allow_social_logins: true,

    // Marketing & Communications
    marketing_emails: false,
    product_announcements: true,
    survey_invitations: false,
    beta_program_participation: false,
    research_participation: false,

    // Data Retention & Control
    data_retention_period: '2years',
    auto_delete_inactive: false,
    export_data_monthly: false,

    // Cookie & Tracking
    essential_cookies: true,
    analytics_cookies: true,
    marketing_cookies: false,
    personalization_cookies: true,

    // Advanced Privacy
    ip_address_anonymization: true,
    location_data_collection: false,
    device_fingerprinting: false,
    cross_site_tracking: false
  })

  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleSettingChange = (key: keyof PrivacySettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Here you would save to Supabase
      // await updatePrivacySettings(settings)
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      setHasChanges(false)
    } catch (error) {
      handleError(error, {
      operation: 'settings_operation', component: 'page',

        userMessage: 'Settings operation failed. Please try again.'

      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    // Reset to last saved state or defaults
    setHasChanges(false)
  }

  const visibilityOptions = [
    { value: 'private', label: 'Private - Only you can see your data' },
    { value: 'friends', label: 'Friends - People you connect with can see limited data' },
    { value: 'public', label: 'Public - Anyone can see your public achievements' }
  ]

  const retentionOptions = [
    { value: 'forever', label: 'Keep Forever' },
    { value: '1year', label: '1 Year' },
    { value: '2years', label: '2 Years (Recommended)' },
    { value: '5years', label: '5 Years' }
  ]

  const getPrivacyScore = () => {
    const privacyFactors = [
      !settings.collect_usage_analytics,
      !settings.ai_data_analysis,
      settings.profile_visibility === 'private',
      !settings.allow_integrations,
      !settings.marketing_emails,
      settings.ip_address_anonymization,
      !settings.location_data_collection,
      !settings.device_fingerprinting,
      !settings.cross_site_tracking
    ]
    return Math.round((privacyFactors.filter(Boolean).length / privacyFactors.length) * 100)
  }

  const privacyScore = getPrivacyScore()

  return (
    <SettingsLayout currentSection="privacy">
      {/* Privacy Dashboard */}
      <SettingsSection
        title="Privacy Dashboard"
        description="Your privacy settings and data control overview"
        icon={Shield}
        hasChanges={hasChanges}
        onSave={handleSave}
        onReset={handleReset}
        isLoading={isSaving}
        className="mb-6"
      >
        <div className="grid md:grid-cols-3 gap-6">
          {/* Privacy Score */}
          <div className="md:col-span-1">
            <div className="p-6 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20">
              <div className="text-center">
                <div className="relative w-20 h-20 mx-auto mb-4">
                  <svg className="w-20 h-20 transform -rotate-90">
                    <circle cx="40" cy="40" r="36" stroke="currentColor" strokeWidth="8" fill="none" className="text-gray-700" />
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 36}`}
                      strokeDashoffset={`${2 * Math.PI * 36 * (1 - privacyScore / 100)}`}
                      className="text-green-400"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-green-400">{privacyScore}%</span>
                  </div>
                </div>
                <h3 className="font-semibold text-green-400 mb-1">Privacy Score</h3>
                <p className="text-sm text-gray-400">
                  {privacyScore >= 80 ? 'Excellent' : privacyScore >= 60 ? 'Good' : privacyScore >= 40 ? 'Fair' : 'Low'} privacy protection
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-sm text-gray-400">Data Collected</p>
                  <p className="font-semibold">{[settings.collect_wellness_data, settings.collect_usage_analytics, settings.collect_performance_metrics, settings.collect_crash_reports].filter(Boolean).length}/4 types</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-3">
                <Share2 className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-sm text-gray-400">Data Sharing</p>
                  <p className="font-semibold">{settings.profile_visibility === 'private' ? 'Private' : settings.profile_visibility === 'friends' ? 'Friends Only' : 'Public'}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-3">
                <Brain className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-sm text-gray-400">AI Features</p>
                  <p className="font-semibold">{settings.ai_data_analysis ? 'Enabled' : 'Disabled'}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-3">
                <Cookie className="w-5 h-5 text-orange-400" />
                <div>
                  <p className="text-sm text-gray-400">Cookies</p>
                  <p className="font-semibold">{[settings.analytics_cookies, settings.marketing_cookies, settings.personalization_cookies].filter(Boolean).length}/3 types</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Privacy Recommendations */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-500/20">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-300 mb-2">Privacy Recommendations</h4>
              <ul className="space-y-1 text-sm text-gray-300">
                {privacyScore < 80 && (
                  <>
                    {settings.marketing_emails && <li>• Consider disabling marketing emails for better privacy</li>}
                    {settings.profile_visibility !== 'private' && <li>• Set profile visibility to private for maximum privacy</li>}
                    {!settings.ip_address_anonymization && <li>• Enable IP address anonymization</li>}
                    {settings.location_data_collection && <li>• Disable location data collection if not needed</li>}
                  </>
                )}
                {privacyScore >= 80 && <li>• Your privacy settings look great! You have strong privacy protection.</li>}
              </ul>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Data Collection & Usage */}
      <SettingsSection
        title="Data Collection & Usage"
        description="Control what data AXIS6 collects and how it's used"
        icon={Database}
        className="mb-6"
      >
        <SettingGroup title="Data Collection" description="Choose what types of data we collect to improve your experience">
          <SettingItem
            label="Wellness Data Collection"
            description="Collect your check-ins, mood tracking, and wellness patterns to provide insights"
            type="toggle"
            value={settings.collect_wellness_data}
            onChange={(value) => handleSettingChange('collect_wellness_data', value)}
          />

          <SettingItem
            label="Usage Analytics"
            description="Collect anonymous usage data to improve app performance and user experience"
            type="toggle"
            value={settings.collect_usage_analytics}
            onChange={(value) => handleSettingChange('collect_usage_analytics', value)}
          />

          <SettingItem
            label="Performance Metrics"
            description="Collect performance data to optimize app speed and reliability"
            type="toggle"
            value={settings.collect_performance_metrics}
            onChange={(value) => handleSettingChange('collect_performance_metrics', value)}
          />

          <SettingItem
            label="Crash Reports"
            description="Automatically send crash reports to help us fix bugs and improve stability"
            type="toggle"
            value={settings.collect_crash_reports}
            onChange={(value) => handleSettingChange('collect_crash_reports', value)}
          />
        </SettingGroup>
      </SettingsSection>

      {/* AI & Personalization */}
      <SettingsSection
        title="AI & Personalization"
        description="Control how AI uses your data for personalized experiences"
        icon={Brain}
        className="mb-6"
      >
        <SettingGroup title="AI Data Usage" description="Configure AI features and data analysis permissions">
          <SettingItem
            label="AI Data Analysis"
            description="Allow AI to analyze your wellness data to provide personalized insights and recommendations"
            type="toggle"
            value={settings.ai_data_analysis}
            onChange={(value) => handleSettingChange('ai_data_analysis', value)}
          />

          <SettingItem
            label="AI Insights Generation"
            description="Generate personalized insights, trends, and recommendations based on your data"
            type="toggle"
            value={settings.ai_insights_generation}
            onChange={(value) => handleSettingChange('ai_insights_generation', value)}
          />

          <SettingItem
            label="AI Personalization"
            description="Personalize your app experience, notifications, and content based on AI analysis"
            type="toggle"
            value={settings.ai_personalization}
            onChange={(value) => handleSettingChange('ai_personalization', value)}
          />

          <SettingItem
            label="Predictive Modeling"
            description="Use AI to predict patterns and provide proactive wellness suggestions"
            type="toggle"
            value={settings.ai_predictive_modeling}
            onChange={(value) => handleSettingChange('ai_predictive_modeling', value)}
          />

          <SettingItem
            label="Anonymized AI Training"
            description="Share anonymized data to help improve AI models for all users (no personal information shared)"
            type="toggle"
            value={settings.share_anonymized_ai_training}
            onChange={(value) => handleSettingChange('share_anonymized_ai_training', value)}
          />
        </SettingGroup>
      </SettingsSection>

      {/* Sharing & Visibility */}
      <SettingsSection
        title="Sharing & Visibility"
        description="Control who can see your data and activities"
        icon={Eye}
        className="mb-6"
      >
        <div className="grid md:grid-cols-2 gap-6">
          <SettingGroup title="Profile Visibility" description="Control who can see your profile and activities">
            <SettingItem
              label="Profile Visibility"
              description="Choose who can see your profile information and activities"
              type="select"
              value={settings.profile_visibility}
              onChange={(value) => handleSettingChange('profile_visibility', value)}
              options={visibilityOptions}
            />

            <SettingItem
              label="Activity Sharing"
              description="Share your daily check-ins and activities with others"
              type="toggle"
              value={settings.activity_sharing}
              onChange={(value) => handleSettingChange('activity_sharing', value)}
            />

            <SettingItem
              label="Achievement Sharing"
              description="Share your achievements, milestones, and badges"
              type="toggle"
              value={settings.achievement_sharing}
              onChange={(value) => handleSettingChange('achievement_sharing', value)}
            />
          </SettingGroup>

          <SettingGroup title="Data Privacy" description="Protect sensitive personal data">
            <SettingItem
              label="Streak Visibility"
              description="Show your current streaks on your public profile"
              type="toggle"
              value={settings.streak_visibility}
              onChange={(value) => handleSettingChange('streak_visibility', value)}
            />

            <SettingItem
              label="Keep Mood Data Private"
              description="Never share mood and emotional state data, even in anonymized form"
              type="toggle"
              value={settings.mood_data_private}
              onChange={(value) => handleSettingChange('mood_data_private', value)}
            />
          </SettingGroup>
        </div>
      </SettingsSection>

      {/* Third-Party Integrations */}
      <SettingsSection
        title="Third-Party Integrations"
        description="Control data sharing with external apps and services"
        icon={ExternalLink}
        className="mb-6"
      >
        <SettingGroup title="App Integrations" description="Manage connections with other apps and services">
          <SettingItem
            label="Allow Third-Party Integrations"
            description="Enable connections with fitness trackers, health apps, and other wellness services"
            type="toggle"
            value={settings.allow_integrations}
            onChange={(value) => handleSettingChange('allow_integrations', value)}
          />

          <SettingItem
            label="Health App Sharing"
            description="Share wellness data with Apple Health, Google Fit, and similar health platforms"
            type="toggle"
            value={settings.share_with_health_apps}
            onChange={(value) => handleSettingChange('share_with_health_apps', value)}
            disabled={!settings.allow_integrations}
          />

          <SettingItem
            label="Fitness Tracker Integration"
            description="Connect with fitness trackers like Fitbit, Garmin, and Oura for enhanced insights"
            type="toggle"
            value={settings.share_with_fitness_trackers}
            onChange={(value) => handleSettingChange('share_with_fitness_trackers', value)}
            disabled={!settings.allow_integrations}
          />

          <SettingItem
            label="Social Login Permissions"
            description="Allow signing in with Google, Apple, or other social accounts"
            type="toggle"
            value={settings.allow_social_logins}
            onChange={(value) => handleSettingChange('allow_social_logins', value)}
          />
        </SettingGroup>
      </SettingsSection>

      {/* Marketing & Communications */}
      <SettingsSection
        title="Marketing & Communications"
        description="Control marketing emails and research participation"
        icon={Mail}
        className="mb-6"
      >
        <div className="grid md:grid-cols-2 gap-6">
          <SettingGroup title="Email Preferences" description="Choose what emails you want to receive">
            <SettingItem
              label="Marketing Emails"
              description="Receive promotional emails about new features, tips, and special offers"
              type="toggle"
              value={settings.marketing_emails}
              onChange={(value) => handleSettingChange('marketing_emails', value)}
            />

            <SettingItem
              label="Product Announcements"
              description="Get notified about important product updates and new features"
              type="toggle"
              value={settings.product_announcements}
              onChange={(value) => handleSettingChange('product_announcements', value)}
            />

            <SettingItem
              label="Survey Invitations"
              description="Participate in user research surveys to help improve AXIS6"
              type="toggle"
              value={settings.survey_invitations}
              onChange={(value) => handleSettingChange('survey_invitations', value)}
            />
          </SettingGroup>

          <SettingGroup title="Research & Beta Programs" description="Participate in product development and research">
            <SettingItem
              label="Beta Program Participation"
              description="Get early access to new features and provide feedback"
              type="toggle"
              value={settings.beta_program_participation}
              onChange={(value) => handleSettingChange('beta_program_participation', value)}
            />

            <SettingItem
              label="Research Participation"
              description="Contribute to wellness research studies (data is always anonymized)"
              type="toggle"
              value={settings.research_participation}
              onChange={(value) => handleSettingChange('research_participation', value)}
            />
          </SettingGroup>
        </div>
      </SettingsSection>

      {/* Data Retention & Control */}
      <SettingsSection
        title="Data Retention & Control"
        description="Manage how long your data is stored and control data exports"
        icon={Settings}
        className="mb-6"
      >
        <div className="grid md:grid-cols-2 gap-6">
          <SettingGroup title="Data Retention" description="Control how long we keep your data">
            <SettingItem
              label="Data Retention Period"
              description="How long should we keep your wellness data after account deletion?"
              type="select"
              value={settings.data_retention_period}
              onChange={(value) => handleSettingChange('data_retention_period', value)}
              options={retentionOptions}
            />

            <SettingItem
              label="Auto-Delete Inactive Data"
              description="Automatically delete data from periods of inactivity after 6 months"
              type="toggle"
              value={settings.auto_delete_inactive}
              onChange={(value) => handleSettingChange('auto_delete_inactive', value)}
            />
          </SettingGroup>

          <SettingGroup title="Data Export" description="Download and manage your data">
            <SettingItem
              label="Monthly Data Export"
              description="Automatically email you a monthly export of your data for backup"
              type="toggle"
              value={settings.export_data_monthly}
              onChange={(value) => handleSettingChange('export_data_monthly', value)}
            />

            {/* Data Export Actions */}
            <div className="mt-4 space-y-3">
              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-lg transition-colors">
                <Download className="w-4 h-4" />
                Download My Data
              </button>

              <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
                Delete All My Data
              </button>
            </div>
          </SettingGroup>
        </div>
      </SettingsSection>

      {/* Cookie & Tracking */}
      <SettingsSection
        title="Cookies & Tracking"
        description="Control cookies and tracking technologies"
        icon={Cookie}
        className="mb-6"
        collapsible
        defaultExpanded={false}
      >
        <SettingGroup title="Cookie Preferences" description="Choose which types of cookies we can use">
          <SettingItem
            label="Essential Cookies"
            description="Required cookies for basic app functionality (cannot be disabled)"
            type="toggle"
            value={settings.essential_cookies}
            onChange={(value) => handleSettingChange('essential_cookies', value)}
            disabled={true}
          />

          <SettingItem
            label="Analytics Cookies"
            description="Help us understand how you use the app to improve performance"
            type="toggle"
            value={settings.analytics_cookies}
            onChange={(value) => handleSettingChange('analytics_cookies', value)}
          />

          <SettingItem
            label="Marketing Cookies"
            description="Used to show you relevant ads and measure marketing campaign effectiveness"
            type="toggle"
            value={settings.marketing_cookies}
            onChange={(value) => handleSettingChange('marketing_cookies', value)}
          />

          <SettingItem
            label="Personalization Cookies"
            description="Remember your preferences and customize your experience"
            type="toggle"
            value={settings.personalization_cookies}
            onChange={(value) => handleSettingChange('personalization_cookies', value)}
          />
        </SettingGroup>

        <SettingGroup title="Advanced Tracking Protection" description="Control advanced tracking and fingerprinting">
          <SettingItem
            label="IP Address Anonymization"
            description="Anonymize your IP address in analytics and logs"
            type="toggle"
            value={settings.ip_address_anonymization}
            onChange={(value) => handleSettingChange('ip_address_anonymization', value)}
          />

          <SettingItem
            label="Location Data Collection"
            description="Allow collection of general location data for timezone and regional features"
            type="toggle"
            value={settings.location_data_collection}
            onChange={(value) => handleSettingChange('location_data_collection', value)}
          />

          <SettingItem
            label="Device Fingerprinting"
            description="Use device characteristics to improve security and prevent fraud"
            type="toggle"
            value={settings.device_fingerprinting}
            onChange={(value) => handleSettingChange('device_fingerprinting', value)}
          />

          <SettingItem
            label="Cross-Site Tracking"
            description="Track your activity across different websites for advertising purposes"
            type="toggle"
            value={settings.cross_site_tracking}
            onChange={(value) => handleSettingChange('cross_site_tracking', value)}
          />
        </SettingGroup>
      </SettingsSection>

      {/* Privacy Impact Statement */}
      <div className="p-6 bg-gradient-to-r from-gray-800/50 to-gray-700/50 rounded-xl border border-white/10 mb-6">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
          Your Privacy Choices
        </h3>
        <div className="text-sm text-gray-300 space-y-2">
          <p>
            <strong>What happens when you change these settings:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Disabling AI features will reduce personalization but increase privacy</li>
            <li>Turning off data collection may limit insights and recommendations</li>
            <li>Making your profile private will disable social features</li>
            <li>Disabling analytics helps protect your privacy but limits our ability to improve the app</li>
            <li>Changes take effect immediately and can be modified at any time</li>
          </ul>
          <p className="mt-4 text-xs text-gray-400">
            Last updated: January 2025 • <a href="/privacy-policy" className="text-blue-400 hover:underline">Privacy Policy</a> • <a href="/terms" className="text-blue-400 hover:underline">Terms of Service</a>
          </p>
        </div>
      </div>
    </SettingsLayout>
  )
}

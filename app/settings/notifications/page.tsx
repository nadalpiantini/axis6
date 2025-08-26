'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Bell, 
  Clock, 
  Smartphone, 
  Mail, 
  Zap,
  Brain,
  Target,
  TrendingUp,
  Calendar,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Settings
} from 'lucide-react'
import { SettingsLayout } from '@/components/settings/SettingsLayout'
import { SettingsSection, SettingItem, SettingGroup } from '@/components/settings/SettingsSection'
import { useUser } from '@/lib/react-query/hooks'

interface NotificationPreferences {
  // Delivery Methods
  email_enabled: boolean
  push_enabled: boolean
  in_app_enabled: boolean
  sms_enabled: boolean
  
  // Notification Types
  checkin_reminders: boolean
  streak_alerts: boolean
  goal_achievements: boolean
  weekly_insights: boolean
  mood_check_prompts: boolean
  motivation_messages: boolean
  social_updates: boolean
  system_updates: boolean
  
  // Smart AI Features
  ai_optimal_timing: boolean
  ai_personalized_content: boolean
  ai_frequency_optimization: boolean
  ai_mood_aware: boolean
  
  // Timing Preferences
  quiet_hours_enabled: boolean
  quiet_start_time: string
  quiet_end_time: string
  timezone_aware: boolean
  
  // Frequency Settings
  daily_reminders_limit: number
  weekly_summary: boolean
  monthly_insights: boolean
  
  // Advanced Settings
  notification_sound: string
  vibration_enabled: boolean
  priority_notifications_only: boolean
  batch_notifications: boolean
}

export default function NotificationSettingsPage() {
  const { data: user } = useUser()
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    // Delivery Methods
    email_enabled: true,
    push_enabled: true,
    in_app_enabled: true,
    sms_enabled: false,
    
    // Notification Types
    checkin_reminders: true,
    streak_alerts: true,
    goal_achievements: true,
    weekly_insights: true,
    mood_check_prompts: true,
    motivation_messages: true,
    social_updates: false,
    system_updates: true,
    
    // Smart AI Features
    ai_optimal_timing: true,
    ai_personalized_content: true,
    ai_frequency_optimization: true,
    ai_mood_aware: true,
    
    // Timing Preferences
    quiet_hours_enabled: true,
    quiet_start_time: '22:00',
    quiet_end_time: '07:00',
    timezone_aware: true,
    
    // Frequency Settings
    daily_reminders_limit: 3,
    weekly_summary: true,
    monthly_insights: true,
    
    // Advanced Settings
    notification_sound: 'gentle',
    vibration_enabled: true,
    priority_notifications_only: false,
    batch_notifications: false
  })

  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Here you would save to Supabase
      // await updateNotificationPreferences(preferences)
      console.log('Saving notification preferences:', preferences)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setHasChanges(false)
    } catch (error) {
      console.error('Error saving notification preferences:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    // Reset to last saved state or defaults
    setHasChanges(false)
  }

  const soundOptions = [
    { value: 'gentle', label: 'Gentle Chime' },
    { value: 'bell', label: 'Bell' },
    { value: 'tone', label: 'Tone' },
    { value: 'vibrate', label: 'Vibrate Only' },
    { value: 'silent', label: 'Silent' }
  ]

  const reminderLimitOptions = [
    { value: 1, label: '1 per day' },
    { value: 2, label: '2 per day' },
    { value: 3, label: '3 per day' },
    { value: 5, label: '5 per day' },
    { value: 10, label: '10 per day' },
    { value: 0, label: 'Unlimited' }
  ]

  return (
    <SettingsLayout currentSection="notifications">
      {/* AI-Powered Notifications */}
      <SettingsSection 
        title="Smart Notifications" 
        description="AI-powered notifications that adapt to your habits and preferences"
        icon={Brain}
        hasChanges={hasChanges}
        onSave={handleSave}
        onReset={handleReset}
        isLoading={isSaving}
        helpText="Our AI learns your patterns to send notifications at the perfect time and frequency for maximum effectiveness without disruption."
        className="mb-6"
      >
        <div className="space-y-6">
          <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-purple-300 mb-1">AI Optimization Active</h4>
                <p className="text-sm text-gray-300 mb-3">
                  Your notification timing has improved by 68% based on your engagement patterns
                </p>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-gray-400">Best time for check-ins:</span>
                    <p className="text-purple-300 font-medium">8:30 AM & 7:15 PM</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Engagement rate:</span>
                    <p className="text-green-400 font-medium">+34% this week</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <SettingGroup title="AI Features" description="Let AI optimize your notification experience">
            <SettingItem
              label="Optimal Timing"
              description="AI determines the best times to send notifications based on your activity patterns"
              type="toggle"
              value={preferences.ai_optimal_timing}
              onChange={(value) => handlePreferenceChange('ai_optimal_timing', value)}
            />

            <SettingItem
              label="Personalized Content"
              description="AI customizes notification messages based on your goals and personality"
              type="toggle"
              value={preferences.ai_personalized_content}
              onChange={(value) => handlePreferenceChange('ai_personalized_content', value)}
            />

            <SettingItem
              label="Frequency Optimization"
              description="AI adjusts notification frequency to avoid overwhelming you while maintaining engagement"
              type="toggle"
              value={preferences.ai_frequency_optimization}
              onChange={(value) => handlePreferenceChange('ai_frequency_optimization', value)}
            />

            <SettingItem
              label="Mood-Aware Delivery"
              description="AI considers your mood patterns to send supportive vs motivational messages"
              type="toggle"
              value={preferences.ai_mood_aware}
              onChange={(value) => handlePreferenceChange('ai_mood_aware', value)}
            />
          </SettingGroup>
        </div>
      </SettingsSection>

      {/* Delivery Methods */}
      <SettingsSection 
        title="Delivery Methods" 
        description="Choose how you want to receive notifications"
        icon={Bell}
        className="mb-6"
      >
        <SettingGroup title="Notification Channels" description="Enable or disable notification delivery methods">
          <SettingItem
            label="Push Notifications"
            description="Receive notifications on your device even when the app is closed"
            type="toggle"
            value={preferences.push_enabled}
            onChange={(value) => handlePreferenceChange('push_enabled', value)}
          />

          <SettingItem
            label="Email Notifications"
            description="Receive notifications and summaries via email"
            type="toggle"
            value={preferences.email_enabled}
            onChange={(value) => handlePreferenceChange('email_enabled', value)}
          />

          <SettingItem
            label="In-App Notifications"
            description="Show notifications within the app interface"
            type="toggle"
            value={preferences.in_app_enabled}
            onChange={(value) => handlePreferenceChange('in_app_enabled', value)}
          />

          <SettingItem
            label="SMS Notifications"
            description="Receive critical notifications via SMS (premium feature)"
            type="toggle"
            value={preferences.sms_enabled}
            onChange={(value) => handlePreferenceChange('sms_enabled', value)}
            disabled={!user?.premium}
          />
        </SettingGroup>
      </SettingsSection>

      {/* Notification Types */}
      <SettingsSection 
        title="Notification Types" 
        description="Choose which types of notifications you want to receive"
        icon={Target}
        className="mb-6"
      >
        <div className="grid md:grid-cols-2 gap-6">
          <SettingGroup title="Daily Reminders" description="Stay on track with your daily wellness goals">
            <SettingItem
              label="Check-in Reminders"
              description="Daily prompts to complete your AXIS6 check-ins"
              type="toggle"
              value={preferences.checkin_reminders}
              onChange={(value) => handlePreferenceChange('checkin_reminders', value)}
            />

            <SettingItem
              label="Mood Check Prompts"
              description="Gentle reminders to track your emotional state"
              type="toggle"
              value={preferences.mood_check_prompts}
              onChange={(value) => handlePreferenceChange('mood_check_prompts', value)}
            />

            <SettingItem
              label="Motivation Messages"
              description="Personalized encouragement and wellness tips"
              type="toggle"
              value={preferences.motivation_messages}
              onChange={(value) => handlePreferenceChange('motivation_messages', value)}
            />
          </SettingGroup>

          <SettingGroup title="Achievements & Insights" description="Celebrate your progress and learn from your data">
            <SettingItem
              label="Streak Alerts"
              description="Notifications when you achieve or risk losing streaks"
              type="toggle"
              value={preferences.streak_alerts}
              onChange={(value) => handlePreferenceChange('streak_alerts', value)}
            />

            <SettingItem
              label="Goal Achievements"
              description="Celebrate when you reach milestones and complete goals"
              type="toggle"
              value={preferences.goal_achievements}
              onChange={(value) => handlePreferenceChange('goal_achievements', value)}
            />

            <SettingItem
              label="Weekly Insights"
              description="AI-generated insights about your wellness patterns"
              type="toggle"
              value={preferences.weekly_insights}
              onChange={(value) => handlePreferenceChange('weekly_insights', value)}
            />
          </SettingGroup>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <SettingGroup title="Social & Updates">
            <SettingItem
              label="Social Updates"
              description="Community features and friend activities"
              type="toggle"
              value={preferences.social_updates}
              onChange={(value) => handlePreferenceChange('social_updates', value)}
            />

            <SettingItem
              label="System Updates"
              description="App updates, new features, and important announcements"
              type="toggle"
              value={preferences.system_updates}
              onChange={(value) => handlePreferenceChange('system_updates', value)}
            />
          </SettingGroup>

          <SettingGroup title="Frequency Limits">
            <SettingItem
              label="Daily Reminder Limit"
              description="Maximum number of reminder notifications per day"
              type="select"
              value={preferences.daily_reminders_limit}
              onChange={(value) => handlePreferenceChange('daily_reminders_limit', parseInt(value))}
              options={reminderLimitOptions}
            />
          </SettingGroup>
        </div>
      </SettingsSection>

      {/* Timing & Schedule */}
      <SettingsSection 
        title="Timing & Schedule" 
        description="Control when notifications are delivered"
        icon={Clock}
        className="mb-6"
      >
        <div className="grid md:grid-cols-2 gap-6">
          <SettingGroup title="Quiet Hours" description="Set times when notifications should be silenced">
            <SettingItem
              label="Enable Quiet Hours"
              description="Automatically silence notifications during specified hours"
              type="toggle"
              value={preferences.quiet_hours_enabled}
              onChange={(value) => handlePreferenceChange('quiet_hours_enabled', value)}
            />

            {preferences.quiet_hours_enabled && (
              <>
                <SettingItem
                  label="Quiet Hours Start"
                  description="Time when quiet hours begin"
                  type="text"
                  value={preferences.quiet_start_time}
                  onChange={(value) => handlePreferenceChange('quiet_start_time', value)}
                  placeholder="22:00"
                />

                <SettingItem
                  label="Quiet Hours End"
                  description="Time when quiet hours end"
                  type="text"
                  value={preferences.quiet_end_time}
                  onChange={(value) => handlePreferenceChange('quiet_end_time', value)}
                  placeholder="07:00"
                />
              </>
            )}
          </SettingGroup>

          <SettingGroup title="Schedule Preferences" description="Configure notification timing preferences">
            <SettingItem
              label="Timezone Awareness"
              description="Adjust notification times based on your timezone"
              type="toggle"
              value={preferences.timezone_aware}
              onChange={(value) => handlePreferenceChange('timezone_aware', value)}
            />

            <SettingItem
              label="Weekly Summary"
              description="Receive a weekly summary of your progress"
              type="toggle"
              value={preferences.weekly_summary}
              onChange={(value) => handlePreferenceChange('weekly_summary', value)}
            />

            <SettingItem
              label="Monthly Insights"
              description="Receive detailed monthly insights and trends"
              type="toggle"
              value={preferences.monthly_insights}
              onChange={(value) => handlePreferenceChange('monthly_insights', value)}
            />
          </SettingGroup>
        </div>
      </SettingsSection>

      {/* Advanced Settings */}
      <SettingsSection 
        title="Advanced Settings" 
        description="Fine-tune your notification experience"
        icon={Settings}
        className="mb-6"
        collapsible
        defaultExpanded={false}
      >
        <div className="grid md:grid-cols-2 gap-6">
          <SettingGroup title="Sound & Vibration" description="Customize notification alerts">
            <SettingItem
              label="Notification Sound"
              description="Choose the sound for notifications"
              type="select"
              value={preferences.notification_sound}
              onChange={(value) => handlePreferenceChange('notification_sound', value)}
              options={soundOptions}
            />

            <SettingItem
              label="Vibration"
              description="Enable vibration for notifications on mobile devices"
              type="toggle"
              value={preferences.vibration_enabled}
              onChange={(value) => handlePreferenceChange('vibration_enabled', value)}
            />
          </SettingGroup>

          <SettingGroup title="Behavior Settings" description="Control how notifications are handled">
            <SettingItem
              label="Priority Only"
              description="Only show high-priority notifications (streaks, achievements)"
              type="toggle"
              value={preferences.priority_notifications_only}
              onChange={(value) => handlePreferenceChange('priority_notifications_only', value)}
            />

            <SettingItem
              label="Batch Notifications"
              description="Group similar notifications together to reduce interruptions"
              type="toggle"
              value={preferences.batch_notifications}
              onChange={(value) => handlePreferenceChange('batch_notifications', value)}
            />
          </SettingGroup>
        </div>

        {/* Notification Preview */}
        <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Notification Preview
          </h4>
          <div className="space-y-3">
            <div className="p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-green-500/20">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Great job on your Physical check-in! 🎉</p>
                  <p className="text-sm text-gray-400">You're on a 7-day streak - keep it up!</p>
                </div>
                <span className="text-xs text-gray-500">2 min ago</span>
              </div>
            </div>
            
            <div className="p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-purple-500/20">
                  <Brain className="w-4 h-4 text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">Time for your evening reflection</p>
                  <p className="text-sm text-gray-400">How are you feeling emotionally today?</p>
                </div>
                <span className="text-xs text-gray-500">5 min ago</span>
              </div>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Notification Stats */}
      <SettingsSection 
        title="Notification Analytics" 
        description="Track your notification engagement and optimize your settings"
        icon={TrendingUp}
        className="mb-6"
        collapsible
        defaultExpanded={false}
      >
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">This Week</p>
                <p className="text-2xl font-bold text-green-400">47</p>
                <p className="text-xs text-green-300">notifications sent</p>
              </div>
              <Bell className="w-8 h-8 text-green-400/50" />
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Engagement</p>
                <p className="text-2xl font-bold text-blue-400">89%</p>
                <p className="text-xs text-blue-300">response rate</p>
              </div>
              <Target className="w-8 h-8 text-blue-400/50" />
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Best Time</p>
                <p className="text-2xl font-bold text-purple-400">8:30</p>
                <p className="text-xs text-purple-300">AM optimal</p>
              </div>
              <Clock className="w-8 h-8 text-purple-400/50" />
            </div>
          </div>

          <div className="p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl border border-orange-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Streaks</p>
                <p className="text-2xl font-bold text-orange-400">+12</p>
                <p className="text-xs text-orange-300">helped maintain</p>
              </div>
              <Zap className="w-8 h-8 text-orange-400/50" />
            </div>
          </div>
        </div>

        <div className="mt-6 p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl border border-indigo-500/20">
          <h4 className="font-medium text-indigo-300 mb-2">AI Insights</h4>
          <ul className="space-y-1 text-sm text-gray-300">
            <li>• You respond best to notifications between 8-9 AM and 7-8 PM</li>
            <li>• Motivational messages work better on Mondays and Fridays</li>
            <li>• Your engagement drops by 40% during busy work hours (2-4 PM)</li>
            <li>• Streak alerts have a 94% success rate in preventing streak breaks</li>
          </ul>
        </div>
      </SettingsSection>
    </SettingsLayout>
  )
}
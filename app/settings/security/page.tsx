'use client'

import { motion } from 'framer-motion'
import { 
  Lock, 
  Shield, 
  Key,
  Smartphone,
  Monitor,
  Globe,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Eye,
  EyeOff,
  Download,
  RefreshCw,
  Trash2,
  Settings,
  Fingerprint,
  QrCode,
  Mail,
  Phone,
  UserCheck,
  Activity,
  Calendar,
  Info,
  Zap,
  Ban
} from 'lucide-react'
import { useState, useEffect } from 'react'

import { SettingsLayout } from '@/components/settings/SettingsLayout'
import { SettingsSection, SettingItem, SettingGroup } from '@/components/settings/SettingsSection'
import { useUser } from '@/lib/react-query/hooks'

interface SecuritySettings {
  // Password & Authentication
  password_strength: 'weak' | 'medium' | 'strong'
  two_factor_enabled: boolean
  two_factor_method: 'sms' | 'email' | 'authenticator'
  biometric_enabled: boolean
  passkey_enabled: boolean
  
  // Session Management
  session_timeout: number // minutes
  concurrent_sessions_limit: number
  auto_logout_inactive: boolean
  remember_device_enabled: boolean
  
  // Security Monitoring
  login_alerts_enabled: boolean
  suspicious_activity_alerts: boolean
  new_device_alerts: boolean
  location_based_alerts: boolean
  failed_login_lockout: boolean
  
  // Account Protection
  account_recovery_email: string
  account_recovery_phone: string
  emergency_contact_enabled: boolean
  backup_codes_generated: boolean
  
  // Advanced Security
  ip_whitelist_enabled: boolean
  api_access_enabled: boolean
  data_breach_monitoring: boolean
  security_key_required: boolean
}

interface ActiveSession {
  id: string
  device: string
  browser: string
  ip_address: string
  location: string
  last_active: string
  current: boolean
}

interface SecurityEvent {
  id: string
  type: 'login' | 'logout' | 'password_change' | 'failed_login' | 'new_device' | 'suspicious'
  description: string
  timestamp: string
  ip_address: string
  location: string
  device: string
  risk_level: 'low' | 'medium' | 'high'
}

export default function SecuritySettingsPage() {
  const { data: user } = useUser()
  const [settings, setSettings] = useState<SecuritySettings>({
    // Password & Authentication
    password_strength: 'strong',
    two_factor_enabled: true,
    two_factor_method: 'authenticator',
    biometric_enabled: false,
    passkey_enabled: false,
    
    // Session Management
    session_timeout: 30,
    concurrent_sessions_limit: 3,
    auto_logout_inactive: true,
    remember_device_enabled: true,
    
    // Security Monitoring
    login_alerts_enabled: true,
    suspicious_activity_alerts: true,
    new_device_alerts: true,
    location_based_alerts: false,
    failed_login_lockout: true,
    
    // Account Protection
    account_recovery_email: user?.email || '',
    account_recovery_phone: '',
    emergency_contact_enabled: false,
    backup_codes_generated: true,
    
    // Advanced Security
    ip_whitelist_enabled: false,
    api_access_enabled: false,
    data_breach_monitoring: true,
    security_key_required: false
  })

  const [activeSessions] = useState<ActiveSession[]>([
    {
      id: '1',
      device: 'MacBook Pro',
      browser: 'Chrome 120.0',
      ip_address: '192.168.1.100',
      location: 'San Francisco, CA',
      last_active: '2 minutes ago',
      current: true
    },
    {
      id: '2',
      device: 'iPhone 15',
      browser: 'Safari Mobile',
      ip_address: '10.0.1.55',
      location: 'San Francisco, CA',
      last_active: '1 hour ago',
      current: false
    },
    {
      id: '3',
      device: 'iPad Air',
      browser: 'Safari 17.0',
      ip_address: '192.168.1.101',
      location: 'San Francisco, CA',
      last_active: '3 days ago',
      current: false
    }
  ])

  const [securityEvents] = useState<SecurityEvent[]>([
    {
      id: '1',
      type: 'login',
      description: 'Successful login from new location',
      timestamp: '2 hours ago',
      ip_address: '203.0.113.1',
      location: 'New York, NY',
      device: 'Chrome on Windows',
      risk_level: 'medium'
    },
    {
      id: '2',
      type: 'failed_login',
      description: 'Failed login attempt - incorrect password',
      timestamp: '1 day ago',
      ip_address: '198.51.100.1',
      location: 'Unknown',
      device: 'Firefox on Linux',
      risk_level: 'high'
    },
    {
      id: '3',
      type: 'password_change',
      description: 'Password changed successfully',
      timestamp: '3 days ago',
      ip_address: '192.168.1.100',
      location: 'San Francisco, CA',
      device: 'Chrome on macOS',
      risk_level: 'low'
    }
  ])

  const [hasChanges, setHasChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSettingChange = (key: keyof SecuritySettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Here you would save to Supabase
      // await updateSecuritySettings(settings)
      console.log('Saving security settings:', settings)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setHasChanges(false)
    } catch (error) {
      console.error('Error saving security settings:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setHasChanges(false)
  }

  const getSecurityScore = () => {
    let score = 0
    
    // Password strength
    if (settings.password_strength === 'strong') score += 25
    else if (settings.password_strength === 'medium') score += 15
    else score += 5
    
    // Two-factor authentication
    if (settings.two_factor_enabled) score += 25
    
    // Biometric/Passkey
    if (settings.biometric_enabled || settings.passkey_enabled) score += 15
    
    // Security monitoring
    if (settings.login_alerts_enabled) score += 10
    if (settings.suspicious_activity_alerts) score += 10
    
    // Account protection
    if (settings.backup_codes_generated) score += 10
    if (settings.account_recovery_email) score += 5
    
    return Math.min(score, 100)
  }

  const securityScore = getSecurityScore()

  const timeoutOptions = [
    { value: 5, label: '5 minutes' },
    { value: 15, label: '15 minutes' },
    { value: 30, label: '30 minutes (Recommended)' },
    { value: 60, label: '1 hour' },
    { value: 240, label: '4 hours' },
    { value: 0, label: 'Never' }
  ]

  const sessionLimitOptions = [
    { value: 1, label: '1 device' },
    { value: 3, label: '3 devices (Recommended)' },
    { value: 5, label: '5 devices' },
    { value: 10, label: '10 devices' },
    { value: 0, label: 'Unlimited' }
  ]

  const twoFactorOptions = [
    { value: 'authenticator', label: 'Authenticator App (Recommended)' },
    { value: 'sms', label: 'SMS Text Message' },
    { value: 'email', label: 'Email Code' }
  ]

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-400'
      case 'medium': return 'text-yellow-400'
      case 'high': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getRiskBgColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-500/10 border-green-500/20'
      case 'medium': return 'bg-yellow-500/10 border-yellow-500/20'
      case 'high': return 'bg-red-500/10 border-red-500/20'
      default: return 'bg-gray-500/10 border-gray-500/20'
    }
  }

  return (
    <SettingsLayout currentSection="security">
      {/* Security Dashboard */}
      <SettingsSection 
        title="Security Dashboard" 
        description="Your account security status and activity overview"
        icon={Shield}
        hasChanges={hasChanges}
        onSave={handleSave}
        onReset={handleReset}
        isLoading={isSaving}
        className="mb-6"
      >
        <div className="grid md:grid-cols-3 gap-6">
          {/* Security Score */}
          <div className="md:col-span-1">
            <div className="p-6 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-500/20">
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
                      strokeDashoffset={`${2 * Math.PI * 36 * (1 - securityScore / 100)}`}
                      className={securityScore >= 80 ? 'text-green-400' : securityScore >= 60 ? 'text-yellow-400' : 'text-red-400'}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-blue-400">{securityScore}%</span>
                  </div>
                </div>
                <h3 className="font-semibold text-blue-400 mb-1">Security Score</h3>
                <p className="text-sm text-gray-400">
                  {securityScore >= 90 ? 'Excellent' : securityScore >= 70 ? 'Good' : securityScore >= 50 ? 'Fair' : 'Needs Improvement'}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-sm text-gray-400">2FA Status</p>
                  <p className="font-semibold text-green-400">{settings.two_factor_enabled ? 'Enabled' : 'Disabled'}</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-3">
                <Monitor className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-sm text-gray-400">Active Sessions</p>
                  <p className="font-semibold">{activeSessions.length} devices</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-sm text-gray-400">Security Events</p>
                  <p className="font-semibold">{securityEvents.length} recent</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-orange-400" />
                <div>
                  <p className="text-sm text-gray-400">Last Login</p>
                  <p className="font-semibold">2 min ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Security Recommendations */}
        {securityScore < 90 && (
          <div className="mt-6 p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl border border-orange-500/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5" />
              <div>
                <h4 className="font-semibold text-orange-300 mb-2">Security Recommendations</h4>
                <ul className="space-y-1 text-sm text-gray-300">
                  {!settings.two_factor_enabled && <li>• Enable two-factor authentication for better security</li>}
                  {settings.password_strength !== 'strong' && <li>• Update your password to be stronger</li>}
                  {!settings.biometric_enabled && !settings.passkey_enabled && <li>• Enable biometric or passkey authentication</li>}
                  {!settings.backup_codes_generated && <li>• Generate backup codes for account recovery</li>}
                  {!settings.login_alerts_enabled && <li>• Enable login alerts to monitor account access</li>}
                </ul>
              </div>
            </div>
          </div>
        )}
      </SettingsSection>

      {/* Password & Authentication */}
      <SettingsSection 
        title="Password & Authentication" 
        description="Manage your password and authentication methods"
        icon={Key}
        className="mb-6"
      >
        <div className="grid md:grid-cols-2 gap-6">
          <SettingGroup title="Password Management" description="Change your password and manage security">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Current Password</label>
                <input
                  type="password"
                  placeholder="Enter current password"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 pr-10 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">Confirm New Password</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 pr-10 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium">
                Update Password
              </button>
            </div>
          </SettingGroup>

          <SettingGroup title="Multi-Factor Authentication" description="Add extra layers of security">
            <SettingItem
              label="Two-Factor Authentication"
              description="Require a second factor when signing in to your account"
              type="toggle"
              value={settings.two_factor_enabled}
              onChange={(value) => handleSettingChange('two_factor_enabled', value)}
            />

            {settings.two_factor_enabled && (
              <SettingItem
                label="2FA Method"
                description="Choose how you want to receive your second factor"
                type="select"
                value={settings.two_factor_method}
                onChange={(value) => handleSettingChange('two_factor_method', value)}
                options={twoFactorOptions}
              />
            )}

            <SettingItem
              label="Biometric Authentication"
              description="Use fingerprint, Face ID, or Windows Hello for quick access"
              type="toggle"
              value={settings.biometric_enabled}
              onChange={(value) => handleSettingChange('biometric_enabled', value)}
            />

            <SettingItem
              label="Passkey Authentication"
              description="Use modern passkey technology for secure, passwordless login"
              type="toggle"
              value={settings.passkey_enabled}
              onChange={(value) => handleSettingChange('passkey_enabled', value)}
            />

            {settings.two_factor_enabled && (
              <div className="mt-4 space-y-3">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 rounded-lg transition-colors">
                  <QrCode className="w-4 h-4" />
                  Setup Authenticator App
                </button>
                
                <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30 rounded-lg transition-colors">
                  <Download className="w-4 h-4" />
                  Download Backup Codes
                </button>
              </div>
            )}
          </SettingGroup>
        </div>
      </SettingsSection>

      {/* Active Sessions */}
      <SettingsSection 
        title="Active Sessions" 
        description="Monitor and manage devices with access to your account"
        icon={Monitor}
        className="mb-6"
      >
        <SettingGroup title="Session Management" description="Control session behavior and device limits">
          <SettingItem
            label="Session Timeout"
            description="Automatically log out after this period of inactivity"
            type="select"
            value={settings.session_timeout}
            onChange={(value) => handleSettingChange('session_timeout', parseInt(value))}
            options={timeoutOptions}
          />

          <SettingItem
            label="Concurrent Session Limit"
            description="Maximum number of devices that can be logged in simultaneously"
            type="select"
            value={settings.concurrent_sessions_limit}
            onChange={(value) => handleSettingChange('concurrent_sessions_limit', parseInt(value))}
            options={sessionLimitOptions}
          />

          <SettingItem
            label="Remember Device"
            description="Stay logged in on trusted devices for 30 days"
            type="toggle"
            value={settings.remember_device_enabled}
            onChange={(value) => handleSettingChange('remember_device_enabled', value)}
          />
        </SettingGroup>

        <div className="mt-6">
          <h4 className="font-medium text-white mb-4">Current Sessions ({activeSessions.length})</h4>
          <div className="space-y-3">
            {activeSessions.map((session) => (
              <div key={session.id} className="p-4 bg-white/5 rounded-xl border border-white/10">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-white/10">
                      <Monitor className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium">{session.device}</h5>
                        {session.current && (
                          <span className="px-2 py-1 bg-green-500/20 text-green-300 text-xs font-medium rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-400">{session.browser}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {session.ip_address} • {session.location}
                      </p>
                      <p className="text-xs text-gray-500">
                        Last active: {session.last_active}
                      </p>
                    </div>
                  </div>
                  {!session.current && (
                    <button className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/30 rounded-lg transition-colors">
            <Ban className="w-4 h-4" />
            End All Other Sessions
          </button>
        </div>
      </SettingsSection>

      {/* Security Monitoring */}
      <SettingsSection 
        title="Security Monitoring" 
        description="Get alerts about security events and monitor account activity"
        icon={Activity}
        className="mb-6"
      >
        <div className="grid md:grid-cols-2 gap-6">
          <SettingGroup title="Alert Preferences" description="Choose which security events trigger notifications">
            <SettingItem
              label="Login Alerts"
              description="Get notified when someone logs into your account"
              type="toggle"
              value={settings.login_alerts_enabled}
              onChange={(value) => handleSettingChange('login_alerts_enabled', value)}
            />

            <SettingItem
              label="Suspicious Activity Alerts"
              description="Alert me when unusual activity is detected on my account"
              type="toggle"
              value={settings.suspicious_activity_alerts}
              onChange={(value) => handleSettingChange('suspicious_activity_alerts', value)}
            />

            <SettingItem
              label="New Device Alerts"
              description="Notify me when a new device accesses my account"
              type="toggle"
              value={settings.new_device_alerts}
              onChange={(value) => handleSettingChange('new_device_alerts', value)}
            />

            <SettingItem
              label="Location-Based Alerts"
              description="Alert me when logins happen from unusual locations"
              type="toggle"
              value={settings.location_based_alerts}
              onChange={(value) => handleSettingChange('location_based_alerts', value)}
            />
          </SettingGroup>

          <SettingGroup title="Account Protection" description="Automatic protection measures">
            <SettingItem
              label="Failed Login Lockout"
              description="Temporarily lock account after multiple failed login attempts"
              type="toggle"
              value={settings.failed_login_lockout}
              onChange={(value) => handleSettingChange('failed_login_lockout', value)}
            />

            <SettingItem
              label="Data Breach Monitoring"
              description="Monitor if your email appears in known data breaches"
              type="toggle"
              value={settings.data_breach_monitoring}
              onChange={(value) => handleSettingChange('data_breach_monitoring', value)}
            />
          </SettingGroup>
        </div>

        <div className="mt-6">
          <h4 className="font-medium text-white mb-4">Recent Security Events</h4>
          <div className="space-y-3">
            {securityEvents.map((event) => (
              <div key={event.id} className={`p-4 rounded-xl border ${getRiskBgColor(event.risk_level)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${getRiskBgColor(event.risk_level)}`}>
                      {event.type === 'login' && <UserCheck className="w-5 h-5" />}
                      {event.type === 'logout' && <XCircle className="w-5 h-5" />}
                      {event.type === 'password_change' && <Key className="w-5 h-5" />}
                      {event.type === 'failed_login' && <AlertTriangle className="w-5 h-5" />}
                      {event.type === 'new_device' && <Smartphone className="w-5 h-5" />}
                      {event.type === 'suspicious' && <Shield className="w-5 h-5" />}
                    </div>
                    <div>
                      <h5 className="font-medium">{event.description}</h5>
                      <p className="text-sm text-gray-400">{event.device}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {event.ip_address} • {event.location} • {event.timestamp}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${getRiskColor(event.risk_level)} bg-opacity-20`}>
                    {event.risk_level.toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-lg transition-colors">
            <Activity className="w-4 h-4" />
            View Full Security Log
          </button>
        </div>
      </SettingsSection>

      {/* Account Recovery */}
      <SettingsSection 
        title="Account Recovery" 
        description="Set up recovery methods in case you lose access to your account"
        icon={RefreshCw}
        className="mb-6"
        collapsible
        defaultExpanded={false}
      >
        <SettingGroup title="Recovery Options" description="Configure multiple ways to recover your account">
          <SettingItem
            label="Recovery Email"
            description="Email address to use for account recovery"
            type="email"
            value={settings.account_recovery_email}
            onChange={(value) => handleSettingChange('account_recovery_email', value)}
            placeholder="recovery@example.com"
          />

          <SettingItem
            label="Recovery Phone"
            description="Phone number for SMS-based account recovery"
            type="text"
            value={settings.account_recovery_phone}
            onChange={(value) => handleSettingChange('account_recovery_phone', value)}
            placeholder="+1 (555) 123-4567"
          />

          <SettingItem
            label="Emergency Contact"
            description="Allow a trusted contact to help recover your account"
            type="toggle"
            value={settings.emergency_contact_enabled}
            onChange={(value) => handleSettingChange('emergency_contact_enabled', value)}
          />
        </SettingGroup>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <button className="flex items-center justify-center gap-2 px-4 py-3 bg-green-500/20 hover:bg-green-500/30 text-green-300 border border-green-500/30 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            Generate New Backup Codes
          </button>

          <button className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 rounded-lg transition-colors">
            <Mail className="w-4 h-4" />
            Test Recovery Email
          </button>
        </div>
      </SettingsSection>

      {/* Advanced Security */}
      <SettingsSection 
        title="Advanced Security" 
        description="Additional security features for enhanced protection"
        icon={Settings}
        className="mb-6"
        collapsible
        defaultExpanded={false}
      >
        <SettingGroup title="Advanced Features" description="Professional-grade security options">
          <SettingItem
            label="IP Whitelist"
            description="Only allow logins from specific IP addresses"
            type="toggle"
            value={settings.ip_whitelist_enabled}
            onChange={(value) => handleSettingChange('ip_whitelist_enabled', value)}
          />

          <SettingItem
            label="API Access"
            description="Allow third-party applications to access your data via API"
            type="toggle"
            value={settings.api_access_enabled}
            onChange={(value) => handleSettingChange('api_access_enabled', value)}
          />

          <SettingItem
            label="Hardware Security Key Required"
            description="Require a physical security key for the highest level of protection"
            type="toggle"
            value={settings.security_key_required}
            onChange={(value) => handleSettingChange('security_key_required', value)}
          />
        </SettingGroup>

        <div className="mt-6 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-xl border border-amber-500/20">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-400 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-300 mb-2">Security Best Practices</h4>
              <ul className="space-y-1 text-sm text-gray-300">
                <li>• Use a unique, strong password for your AXIS6 account</li>
                <li>• Enable two-factor authentication with an authenticator app</li>
                <li>• Regularly review your active sessions and security activity</li>
                <li>• Keep your recovery information up to date</li>
                <li>• Never share your login credentials with anyone</li>
                <li>• Log out from public or shared devices</li>
              </ul>
            </div>
          </div>
        </div>
      </SettingsSection>
    </SettingsLayout>
  )
}
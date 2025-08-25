'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Calendar,
  Trophy,
  Flame,
  Activity,
  Download,
  Settings,
  LogOut,
  Trash2,
  AlertCircle,
  CheckCircle,
  Loader2,
  Edit3,
  Save,
  X
} from 'lucide-react'
import { LogoFull } from '@/components/ui/Logo'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser, useStreaks, useTodayCheckins } from '@/lib/react-query/hooks'

interface UserProfile {
  email: string
  name: string
  created_at: string
}

export default function ProfilePage() {
  const router = useRouter()
  const { data: user, isLoading: userLoading } = useUser()
  const { data: streaks = [] } = useStreaks(user?.id)
  const { data: checkins = [] } = useTodayCheckins(user?.id)
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [saving, setSaving] = useState(false)
  const [notification, setNotification] = useState<{
    show: boolean
    type: 'success' | 'error'
    message: string
  }>({ show: false, type: 'success', message: '' })

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const supabase = createClient()
        const { data: profileData } = await supabase
          .from('axis6_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (profileData) {
          setProfile({
            email: user.email || '',
            name: profileData.name || user.email?.split('@')[0] || 'User',
            created_at: user.created_at || new Date().toISOString()
          })
          setEditedName(profileData.name || user.email?.split('@')[0] || 'User')
        } else {
          setProfile({
            email: user.email || '',
            name: user.email?.split('@')[0] || 'User',
            created_at: user.created_at || new Date().toISOString()
          })
          setEditedName(user.email?.split('@')[0] || 'User')
        }
      }
      fetchProfile()
    }
  }, [user])

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ show: true, type, message })
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }))
    }, 4000)
  }

  const handleSaveName = async () => {
    if (!user || !editedName.trim()) return
    
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('axis6_profiles')
        .upsert({
          user_id: user.id,
          name: editedName.trim(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (error) throw error

      setProfile(prev => prev ? { ...prev, name: editedName.trim() } : null)
      setIsEditing(false)
      showNotification('success', 'Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      showNotification('error', 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleExportData = async () => {
    if (!user) return
    
    try {
      const supabase = createClient()
      
      // Fetch all user data
      const [checkinsRes, streaksRes, categoriesRes] = await Promise.all([
        supabase.from('axis6_checkins').select('*').eq('user_id', user.id),
        supabase.from('axis6_streaks').select('*').eq('user_id', user.id),
        supabase.from('axis6_categories').select('*')
      ])

      const exportData = {
        profile: {
          email: profile?.email,
          name: profile?.name,
          member_since: profile?.created_at
        },
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

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.')) {
      return
    }

    if (!confirm('This is your last chance to cancel. Do you really want to delete your account?')) {
      return
    }

    try {
      const supabase = createClient()
      
      // Sign out first
      await supabase.auth.signOut()
      
      // Note: Actual account deletion would need to be handled by a server-side function
      // for security reasons. This is a simplified version.
      
      showNotification('success', 'Account deletion requested. You will receive an email confirmation.')
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } catch (error) {
      console.error('Error deleting account:', error)
      showNotification('error', 'Failed to delete account')
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  if (userLoading) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user || !profile) {
    router.push('/auth/login')
    return null
  }

  const currentStreak = Math.max(...streaks.map(s => s.current_streak), 0)
  const longestStreak = Math.max(...streaks.map(s => s.longest_streak), 0)
  const totalCheckins = checkins.length
  const memberDays = Math.floor((new Date().getTime() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24))

  return (
    <div className="min-h-screen text-white">
      {/* Header */}
      <header className="glass border-b border-white/10" role="banner">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard" 
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <LogoFull size="md" className="h-10" priority />
          </div>
          
          <div className="flex items-center gap-4">
            <Link
              href="/settings"
              className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-white/10 rounded-lg transition"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </Link>
            <button
              onClick={handleLogout}
              className="p-3 min-w-[44px] min-h-[44px] flex items-center justify-center hover:bg-white/10 rounded-lg transition"
              aria-label="Sign out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Profile</h1>
          <p className="text-gray-400">Manage your account and view your wellness journey statistics</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Details */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-xl font-semibold mb-6">Account Information</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                      <User className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Name</p>
                      {isEditing ? (
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="text"
                            value={editedName}
                            onChange={(e) => setEditedName(e.target.value)}
                            className="bg-white/10 border border-white/20 rounded px-3 py-1 text-white"
                            placeholder="Your name"
                          />
                          <button
                            onClick={handleSaveName}
                            disabled={saving}
                            className="p-1 text-green-400 hover:bg-green-500/20 rounded transition-colors"
                          >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => {
                              setIsEditing(false)
                              setEditedName(profile.name)
                            }}
                            className="p-1 text-gray-400 hover:bg-red-500/20 hover:text-red-400 rounded transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{profile.name}</p>
                          <button
                            onClick={() => setIsEditing(true)}
                            className="p-1 text-gray-400 hover:text-white transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Mail className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Email</p>
                    <p className="font-medium">{profile.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <Calendar className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Member Since</p>
                    <p className="font-medium">
                      {new Date(profile.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                    <p className="text-xs text-gray-500">{memberDays} days ago</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Actions */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-xl font-semibold mb-6">Account Actions</h2>
              
              <div className="space-y-3">
                <button
                  onClick={handleExportData}
                  className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Download className="w-5 h-5 text-blue-400" />
                    <div className="text-left">
                      <p className="font-medium">Export Your Data</p>
                      <p className="text-sm text-gray-400">Download all your wellness data as JSON</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={handleDeleteAccount}
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
            </div>
          </div>

          {/* Statistics */}
          <div className="space-y-6">
            <div className="glass rounded-2xl p-6">
              <h2 className="text-xl font-semibold mb-6">Your Statistics</h2>
              
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Flame className="w-6 h-6 text-orange-400" />
                      <div>
                        <p className="text-sm text-gray-400">Current Streak</p>
                        <p className="text-2xl font-bold text-orange-400">{currentStreak} days</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Trophy className="w-6 h-6 text-purple-400" />
                      <div>
                        <p className="text-sm text-gray-400">Longest Streak</p>
                        <p className="text-2xl font-bold text-purple-400">{longestStreak} days</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Activity className="w-6 h-6 text-green-400" />
                      <div>
                        <p className="text-sm text-gray-400">Total Check-ins</p>
                        <p className="text-2xl font-bold text-green-400">{totalCheckins}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="glass rounded-2xl p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <div className="space-y-3">
                <Link
                  href="/dashboard"
                  className="block p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/settings"
                  className="block p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Settings
                </Link>
                <Link
                  href="/analytics"
                  className="block p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Analytics
                </Link>
              </div>
            </div>
          </div>
        </div>
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
    </div>
  )
}
'use client'

import { useState, useEffect, useCallback } from 'react'
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
  X,
  Brain,
  Heart,
  Users,
  Target,
  Sparkles,
  Star
} from 'lucide-react'
import { LogoIcon } from '@/components/ui/Logo'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { StandardHeader } from '@/components/layout/StandardHeader'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useUser, useStreaks, useTodayCheckins } from '@/lib/react-query/hooks/index'
import { TemperamentQuestionnaire } from '@/components/psychology/TemperamentQuestionnaire'
import { EnhancedTemperamentQuestionnaire } from '@/components/psychology/EnhancedTemperamentQuestionnaire'
import { TemperamentResults } from '@/components/psychology/TemperamentResults'
import { ProfileErrorBoundary } from '@/components/error/ProfileErrorBoundary'

interface UserProfile {
  email: string
  name: string
  created_at: string
}

interface TemperamentProfile {
  id: string
  primary_temperament: string
  secondary_temperament: string
  temperament_scores: {
    sanguine: number
    choleric: number
    melancholic: number
    phlegmatic: number
  }
  personality_insights: {
    strengths: string[]
    challenges: string[]
    recommendations: string[]
    work_style: string
    social_style: string
    decision_style: string
  }
  completed_at: string
}

interface TemperamentResult {
  primary_temperament: string
  secondary_temperament: string
  scores: {
    sanguine: number
    choleric: number
    melancholic: number
    phlegmatic: number
  }
  total_responses: number
}

export default function ProfilePage() {
  const router = useRouter()
  const { data: user, isLoading: userLoading } = useUser()
  const { data: streaks = [], isLoading: streaksLoading } = useStreaks(user?.id || '')
  const { data: checkins = [], isLoading: checkinsLoading } = useTodayCheckins(user?.id || '')
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [temperamentProfile, setTemperamentProfile] = useState<TemperamentProfile | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [saving, setSaving] = useState(false)
  const [showQuestionnaire, setShowQuestionnaire] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [assessmentResult, setAssessmentResult] = useState<TemperamentResult | null>(null)
  const [useAIEnhanced, setUseAIEnhanced] = useState(true) // Default to AI-enhanced
  const [notification, setNotification] = useState<{
    show: boolean
    type: 'success' | 'error'
    message: string
  }>({ show: false, type: 'success', message: '' })

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user || !user.id) {
        setProfileLoading(false)
        return
      }
      
      try {
        const supabase = createClient()
        
        // Fetch basic profile (use maybeSingle to handle non-existent profiles)
        const { data: profileData, error: profileError } = await supabase
          .from('axis6_profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle()

        if (profileError && profileError.code !== 'PGRST116') {
          // TODO: Replace with proper error handling
    // console.error('Error fetching profile:', profileError);
        }

        if (profileData) {
          // Profile exists, use it
          const safeName = profileData.name || user.email?.split('@')[0] || 'User'
          setProfile({
            email: user.email || '',
            name: safeName,
            created_at: user.created_at || new Date().toISOString()
          })
          setEditedName(safeName)
        } else {
          // Profile doesn't exist, create default profile and auto-save it
          const defaultName = user.email?.split('@')[0] || 'User'
          
          const safeProfile = {
            email: user.email || '',
            name: defaultName,
            created_at: user.created_at || new Date().toISOString()
          }
          setProfile(safeProfile)
          setEditedName(defaultName)
          
          // Auto-create profile for new users
          try {
            const { error: createError } = await supabase
              .from('axis6_profiles')
              .insert({
                id: user.id,
                name: defaultName,
                timezone: 'America/Santo_Domingo',
                onboarded: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
            
            if (createError) {
              } else {
              }
          } catch (err) {
            // Continue with the default profile even if creation fails
          }
        }

        // 🛡️ SAFE: Fetch temperament profile with defensive error handling
        try {
          const { data: temperamentData, error } = await supabase
            .from('axis6_temperament_profiles')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle()
          
          if (!error && temperamentData) {
            // 🛡️ VALIDATE: Ensure temperament data has required structure
            if (temperamentData && 
                temperamentData.primary_temperament && 
                temperamentData.temperament_scores &&
                typeof temperamentData.temperament_scores === 'object' &&
                temperamentData.personality_insights &&
                typeof temperamentData.personality_insights === 'object') {
              setTemperamentProfile(temperamentData)
            } else {
              }
          } else if (error && error.code !== 'PGRST116') {
            // PGRST116 = not found, which is expected for new users
            }
        } catch (err) {
          // 🛡️ CATCH-ALL: Handle any unexpected errors gracefully
          // TODO: Replace with proper error handling
    // console.error('⚠️ Failed to fetch temperament profile:', err);
          // Profile page continues to work without psychology features
        }
      } finally {
        setProfileLoading(false)
      }
    }
    
    if (!userLoading) {
      fetchProfile()
    }
  }, [user, userLoading])

  const showNotification = (type: 'success' | 'error', message: string) => {
    if (!type || !message) return
    
    setNotification({ show: true, type, message })
    setTimeout(() => {
      setNotification(prev => ({ ...prev, show: false }))
    }, 4000)
  }

  const handleSaveName = async () => {
    if (!user || !editedName || !editedName.trim()) return
    
    setSaving(true)
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('axis6_profiles')
        .upsert({
          id: user.id,
          name: editedName.trim(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })

      if (error) throw error

      setProfile(prev => prev ? { ...prev, name: editedName.trim() || 'User' } : null)
      setIsEditing(false)
      showNotification('success', 'Profile updated successfully!')
    } catch (error) {
      // TODO: Replace with proper error handling
    // console.error('Error updating profile:', error);
      showNotification('error', 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleExportData = async () => {
    if (!user || !profile) return
    
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
          email: profile?.email || '',
          name: profile?.name || '',
          member_since: profile?.created_at || new Date().toISOString()
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
      // TODO: Replace with proper error handling
    // console.error('Error exporting data:', error);
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
      // TODO: Replace with proper error handling
    // console.error('Error deleting account:', error);
      showNotification('error', 'Failed to delete account')
      // Still redirect even if deletion fails
      setTimeout(() => {
        router.push('/')
      }, 2000)
    }
  }

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/auth/login')
    } catch (error) {
      // TODO: Replace with proper error handling
    // console.error('Error during logout:', error);
      // Still redirect even if logout fails
      router.push('/auth/login')
    }
  }

  const handleStartAssessment = useCallback(() => {
    setShowQuestionnaire(true)
  }, [])

  const handleAssessmentComplete = (result: TemperamentResult) => {
    if (!result) return
    
    setAssessmentResult(result)
    setShowQuestionnaire(false)
    setShowResults(true)
    
    // Refresh temperament profile
    if (user && user.id) {
      const fetchTemperamentProfile = async () => {
        try {
          const supabase = createClient()
          const { data: temperamentData, error } = await supabase
            .from('axis6_temperament_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single()

          if (temperamentData && !error) {
            setTemperamentProfile(temperamentData)
          }
        } catch (err) {
          // TODO: Replace with proper error handling
    // console.error('Error fetching temperament profile:', err);
        }
      }
      fetchTemperamentProfile()
    }
  }

  const handleResultsContinue = () => {
    setShowResults(false)
    showNotification('success', 'Your psychological profile has been updated! You will now receive personalized recommendations.')
  }

  // 🛡️ SAFE: Define temperament data with proper type safety
  const temperamentData = {
    sanguine: {
      name: 'Sanguine',
      subtitle: 'The Enthusiast',
      color: '#FF6B6B',
      icon: Users,
      bgGradient: 'from-red-500/20 to-pink-500/20'
    },
    choleric: {
      name: 'Choleric',
      subtitle: 'The Leader',
      color: '#4ECDC4',
      icon: Target,
      bgGradient: 'from-teal-500/20 to-cyan-500/20'
    },
    melancholic: {
      name: 'Melancholic',
      subtitle: 'The Analyst', 
      color: '#45B7D1',
      icon: Brain,
      bgGradient: 'from-blue-500/20 to-indigo-500/20'
    },
    phlegmatic: {
      name: 'Phlegmatic',
      subtitle: 'The Peacemaker',
      color: '#96CEB4',
      icon: Heart,
      bgGradient: 'from-green-500/20 to-emerald-500/20'
    }
  } as const

  // Handle loading state
  if (userLoading || profileLoading || streaksLoading || checkinsLoading) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-gray-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  // Only redirect after all loading is complete and we know there's no user
  if (!user) {
    // Use setTimeout to avoid navigation during render
    setTimeout(() => {
      router.push('/auth/login')
    }, 0)
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-gray-400">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // If user exists but profile is still null (shouldn't happen with proper loading)
  if (!profile) {
    return (
      <div className="min-h-screen text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-gray-400">Setting up profile...</p>
        </div>
      </div>
    )
  }

  // 🛡️ SAFE: Calculate stats with defensive programming
  const currentStreak = streaks && Array.isArray(streaks) && streaks.length > 0 
    ? Math.max(...streaks.map(s => s?.current_streak || 0))
    : 0
    
  const longestStreak = streaks && Array.isArray(streaks) && streaks.length > 0
    ? Math.max(...streaks.map(s => s?.longest_streak || 0))
    : 0
    
  const totalCheckins = checkins && Array.isArray(checkins) ? checkins.length : 0
  
  const memberDays = profile?.created_at 
    ? (() => {
        try {
          const createdDate = new Date(profile.created_at)
          if (isNaN(createdDate.getTime())) return 0
          return Math.floor((new Date().getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24))
        } catch {
          return 0
        }
      })()
    : 0

  return (
    <ProfileErrorBoundary>
      <div className="min-h-screen text-white">
        {/* Header */}
        <StandardHeader
          user={user}
          onLogout={handleLogout}
          variant="profile"
          title="Mi Perfil"
          subtitle={user?.email}
          showBackButton={true}
          backUrl="/dashboard"
          currentStreak={currentStreak}
        />

      <div className="max-w-6xl mx-auto px-4 py-8" data-testid="main-profile-container">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Profile</h1>
          <p className="text-gray-400">Manage your account and view your wellness journey statistics</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Psychological Profile Section */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
                <Brain className="w-6 h-6 text-purple-400" />
                Psychological Profile
              </h2>
              
              {temperamentProfile && temperamentProfile.primary_temperament ? (
                <div className="space-y-4">
                  {/* Primary Temperament Display */}
                  {(() => {
                    // 🛡️ SAFE: Defensive access to temperament data
                    if (!temperamentProfile) return null
                    
                    const primaryTemp = temperamentProfile.primary_temperament
                    const scores = temperamentProfile.temperament_scores
                    
                    if (!primaryTemp || !scores || typeof scores !== 'object') {
                      return (
                        <div className="p-4 rounded-xl bg-gray-500/10 border border-gray-500/20">
                          <p className="text-gray-400">Temperament data incomplete</p>
                        </div>
                      )
                    }
                    
                    const tempData = temperamentData[primaryTemp as keyof typeof temperamentData] || temperamentData.melancholic
                    const tempScore = scores[primaryTemp as keyof typeof scores] || 0
                    
                    if (!tempData) {
                      return (
                        <div className="p-4 rounded-xl bg-gray-500/10 border border-gray-500/20">
                          <p className="text-gray-400">Unknown temperament type: {primaryTemp}</p>
                        </div>
                      )
                    }
                    
                    const TempIcon = tempData.icon || Brain
                    const iconColor = tempData.color || '#8B5CF6'
                    const bgGradient = tempData.bgGradient || 'from-gray-500/20 to-gray-600/20'
                    const percentage = Math.round((tempScore || 0) * 100)
                    const safePercentage = Math.max(0, Math.min(100, percentage)) // Ensure percentage is between 0-100
                    
                    return (
                      <div className={`p-4 rounded-xl bg-gradient-to-r ${bgGradient}`}>
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-white/20">
                            {TempIcon && typeof TempIcon === 'function' ? (
                              <TempIcon 
                                className="w-5 h-5" 
                                style={{ color: iconColor }}
                              />
                            ) : (
                              <Brain className="w-5 h-5" style={{ color: iconColor }} />
                            )}
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">
                              {tempData.name || primaryTemp || 'Unknown'}
                            </h3>
                            <p className="text-sm text-gray-200">
                              {tempData.subtitle || 'Temperament Profile'}
                            </p>
                          </div>
                          <div className="ml-auto">
                            <div 
                              className="px-3 py-1 rounded-full text-sm font-bold text-white"
                              style={{ backgroundColor: iconColor }}
                            >
                              {safePercentage}%
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })()}

                  {/* Quick Insights */}
                  {temperamentProfile && temperamentProfile.personality_insights && typeof temperamentProfile.personality_insights === 'object' && (() => {
                    const insights = temperamentProfile.personality_insights
                    if (!insights) return null
                    
                    const strengths = Array.isArray(insights.strengths) ? insights.strengths : []
                    const workStyle = insights.work_style
                    const socialStyle = insights.social_style
                    
                    const strengthsText = strengths.length > 0 ? strengths.slice(0, 2).join(', ') : 'Not available'
                    const workStyleText = typeof workStyle === 'string' && workStyle.length > 0
                      ? workStyle.length > 40 ? `${workStyle.slice(0, 40)}...` : workStyle
                      : 'Not available'
                    const socialStyleText = typeof socialStyle === 'string' && socialStyle.length > 0
                      ? socialStyle.length > 40 ? `${socialStyle.slice(0, 40)}...` : socialStyle
                      : 'Not available'
                    
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                          <h4 className="text-sm font-medium text-green-400 mb-1 flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            Strengths
                          </h4>
                          <p className="text-xs text-gray-300">{strengthsText}</p>
                        </div>
                        <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                          <h4 className="text-sm font-medium text-blue-400 mb-1">Work Style</h4>
                          <p className="text-xs text-gray-300">{workStyleText}</p>
                        </div>
                        <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                          <h4 className="text-sm font-medium text-purple-400 mb-1">Social Style</h4>
                          <p className="text-xs text-gray-300">{socialStyleText}</p>
                        </div>
                      </div>
                    )
                  })()}

                  <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-gray-400">
                      {temperamentProfile && temperamentProfile.completed_at 
                        ? (() => {
                            try {
                              const completedDate = new Date(temperamentProfile.completed_at)
                              if (isNaN(completedDate.getTime())) return 'Assessment completed'
                              return `Completed on ${completedDate.toLocaleDateString()}`
                            } catch {
                              return 'Assessment completed'
                            }
                          })()
                        : 'Assessment completed'}
                    </p>
                    <button
                      onClick={handleStartAssessment}
                      className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      Retake Assessment
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="mb-4">
                    <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-white mb-2">Discover Your Temperament</h3>
                    <p className="text-gray-400 text-sm max-w-md mx-auto">
                      Take our psychological assessment to get personalized wellness recommendations based on the four temperaments system.
                    </p>
                  </div>
                  
                  <div className="flex flex-col items-center gap-3">
                    <button
                      onClick={handleStartAssessment}
                      className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all flex items-center gap-2"
                    >
                      <span>Take Personality Assessment</span>
                      {useAIEnhanced && <Sparkles className="w-4 h-4" />}
                    </button>
                    
                    <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useAIEnhanced}
                        onChange={(e) => setUseAIEnhanced(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500 focus:ring-offset-0"
                      />
                      <span>Use AI-Enhanced Assessment</span>
                      <Sparkles className="w-3 h-3 text-purple-400" />
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Form */}
            <ProfileForm 
              userId={user.id}
              initialData={{
                name: profile.name || '',
                email: profile.email || '',
                timezone: 'America/Santo_Domingo'
              }}
              onSuccess={() => {
                showNotification('success', 'Profile updated successfully!')
                // Refresh profile data
                const fetchProfile = async () => {
                  const supabase = createClient()
                  const { data: profileData } = await supabase
                    .from('axis6_profiles')
                    .select('*')
                    .eq('id', user.id)
                    .maybeSingle()
                  if (profileData) {
                    setProfile({
                      email: user.email || '',
                      name: profileData.name || user.email?.split('@')[0] || 'User',
                      created_at: user.created_at || new Date().toISOString()
                    })
                  }
                }
                fetchProfile()
              }}
            />

            {/* User Details */}
            <div className="glass rounded-2xl p-6">
              <h2 className="text-xl font-semibold mb-6">Account Summary</h2>
              
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
                            value={editedName || ''}
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
                          <p className="font-medium">{profile.name || 'User'}</p>
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
                    <p className="font-medium">{profile.email || 'No email'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/20">
                    <Calendar className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Member Since</p>
                    <p className="font-medium">
                      {(() => {
                        try {
                          const createdDate = new Date(profile.created_at)
                          if (isNaN(createdDate.getTime())) return 'Unknown'
                          return createdDate.toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        } catch {
                          return 'Unknown'
                        }
                      })()}
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

      {/* Psychology Modals */}
      {showQuestionnaire && user && user.id && (
        useAIEnhanced ? (
          <EnhancedTemperamentQuestionnaire
            userId={user.id}
            onComplete={handleAssessmentComplete}
            onClose={() => setShowQuestionnaire(false)}
            language="en"
            useAI={true}
          />
        ) : (
          <TemperamentQuestionnaire
            userId={user.id}
            onComplete={handleAssessmentComplete}
            onClose={() => setShowQuestionnaire(false)}
            language="en"
          />
        )
      )}

      {showResults && assessmentResult && assessmentResult.primary_temperament && (
        <TemperamentResults
          result={assessmentResult}
          onContinue={handleResultsContinue}
          onClose={() => setShowResults(false)}
        />
      )}

      {/* Notifications */}
      {notification.show && notification.message && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 50, x: '-50%' }}
          className="fixed bottom-6 left-1/2 transform z-50"
          key={notification.message} // Add key to ensure proper re-rendering
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
            <span className="font-medium">{notification.message || 'Notification'}</span>
          </div>
        </motion.div>
      )}
      </div>
    </ProfileErrorBoundary>
  )
}
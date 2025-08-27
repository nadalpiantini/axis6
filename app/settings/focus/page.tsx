'use client'

import { Focus } from 'lucide-react'

import { FocusSettings } from '@/components/settings/FocusSettings'
import { SettingsLayout } from '@/components/settings/SettingsLayout'
import { SettingsSection } from '@/components/settings/SettingsSection'
import { useUser } from '@/lib/react-query/hooks'

export default function FocusSettingsPage() {
  const { data: user } = useUser()

  return (
    <SettingsLayout currentSection="focus">
      {/* Main Focus Settings Section */}
      <SettingsSection 
        title="Focus & Community Settings"
        description="Configure ADHD-friendly modes and subtle social features inspired by the 5AM Club philosophy"
        icon={Focus}
        className="mb-8"
      >
        <div className="max-w-4xl">
          <div className="mb-8 p-6 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl border border-purple-500/20">
            <h3 className="text-lg font-semibold mb-2 text-purple-300">About Focus Mode</h3>
            <p className="text-gray-400 leading-relaxed">
              Focus Mode provides ADHD-friendly interfaces with simplified layouts, larger touch targets, 
              and reduced visual noise. The social layer adds subtle community connections inspired by early 
              morning wellness rituals, allowing you to feel connected without distraction.
            </p>
          </div>
          
          <FocusSettings />
        </div>
      </SettingsSection>

      {/* Community Philosophy Section */}
      <SettingsSection 
        title="5AM Club Philosophy"
        description="Understanding the subtle social layer"
        className="mt-12"
      >
        <div className="max-w-4xl">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 glass rounded-xl">
              <h4 className="font-semibold mb-3 text-blue-300">Resonance Dots</h4>
              <p className="text-sm text-gray-400 leading-relaxed">
                Small dots appear around your hexagon when others in the community complete the same axes. 
                No usernames, no competition - just the gentle awareness that you're not alone in your journey.
              </p>
            </div>
            <div className="p-6 glass rounded-xl">
              <h4 className="font-semibold mb-3 text-green-300">Anonymous Metrics</h4>
              <p className="text-sm text-gray-400 leading-relaxed">
                See aggregate completion counts like "12 others completed Physical today" without any 
                personal identification. It's about collective energy, not individual performance.
              </p>
            </div>
            <div className="p-6 glass rounded-xl">
              <h4 className="font-semibold mb-3 text-purple-300">Minimal by Design</h4>
              <p className="text-sm text-gray-400 leading-relaxed">
                All social features are opt-in and can be completely disabled. The core individual 
                tracking experience remains untouched and primary.
              </p>
            </div>
            <div className="p-6 glass rounded-xl">
              <h4 className="font-semibold mb-3 text-orange-300">Privacy First</h4>
              <p className="text-sm text-gray-400 leading-relaxed">
                No usernames, no profiles, no following. Community data is aggregated and anonymous. 
                Your personal progress remains private always.
              </p>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Technical Details Section */}
      <SettingsSection 
        title="How It Works"
        description="Technical implementation of the social layer"
        className="mt-12 mb-8"
      >
        <div className="max-w-4xl">
          <div className="p-6 bg-gray-800/50 rounded-xl border border-gray-700">
            <h4 className="font-mono text-sm font-semibold mb-4 text-gray-300">Implementation Details</h4>
            <ul className="space-y-2 text-xs text-gray-400 font-mono">
              <li>• Resonance events stored with timestamp and axis only (no user identification)</li>
              <li>• Community metrics aggregated daily with privacy-preserving algorithms</li>
              <li>• Real-time updates via WebSocket with anonymous event streams</li>
              <li>• All social features behind feature flags (disabled by default)</li>
              <li>• Graceful degradation when social APIs are unavailable</li>
              <li>• Zero impact on core check-in functionality</li>
            </ul>
          </div>
        </div>
      </SettingsSection>
    </SettingsLayout>
  )
}
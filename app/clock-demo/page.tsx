'use client'
/**
 * Revolutionary Clock System Demo Page
 * Showcases the 12-hour clock positioning system with sun at 12 o'clock
 */
import React, { useState, useMemo } from 'react';
import { HexagonClock } from '@/components/hexagon-clock/HexagonClock';
const ClockDemoPage = () => {
  const [clockMode, setClockMode] = useState<'basic' | 'categories' | 'timeblocks' | 'full'>('basic');
  // Sample completion data for dashboard mode
  const sampleData = {
    physical: 75,    // 12 o'clock - Morning energy
    mental: 90,      // 2 o'clock - Focus hours
    emotional: 60,   // 4 o'clock - Afternoon creativity
    social: 45,      // 6 o'clock - Evening connection
    spiritual: 80,   // 8 o'clock - Night reflection
    material: 55     // 10 o'clock - Late planning
  };
  // Sample time blocks for revolutionary clock positioning
  const sampleTimeBlocks = [
    {
      id: 'morning-run',
      startTime: new Date().setHours(7, 0, 0, 0).toString(), // 7:00 AM
      duration: 60, // 1 hour
      category: 'physical',
      status: 'completed' as const,
      title: 'Morning Run',
      progress: 1.0
    },
    {
      id: 'focus-work',
      startTime: new Date().setHours(9, 30, 0, 0).toString(), // 9:30 AM
      duration: 90, // 1.5 hours
      category: 'mental',
      status: 'active' as const,
      title: 'Deep Work',
      progress: 0.6
    },
    {
      id: 'creative-time',
      startTime: new Date().setHours(14, 0, 0, 0).toString(), // 2:00 PM
      duration: 45, // 45 minutes
      category: 'emotional',
      status: 'planned' as const,
      title: 'Creative Writing'
    },
    {
      id: 'social-call',
      startTime: new Date().setHours(18, 30, 0, 0).toString(), // 6:30 PM
      duration: 30, // 30 minutes
      category: 'social',
      status: 'planned' as const,
      title: 'Family Call'
    },
    {
      id: 'meditation',
      startTime: new Date().setHours(20, 0, 0, 0).toString(), // 8:00 PM
      duration: 20, // 20 minutes
      category: 'spiritual',
      status: 'planned' as const,
      title: 'Meditation'
    },
    {
      id: 'planning',
      startTime: new Date().setHours(22, 0, 0, 0).toString(), // 10:00 PM
      duration: 30, // 30 minutes
      category: 'material',
      status: 'empty' as const,
      title: 'Tomorrow Planning'
    }
  ];
  // Configuration for each demo mode
  const getModeConfig = () => {
    switch (clockMode) {
      case 'basic':
        return {
          showClockMarkers: true,
          showCurrentTime: true,
          showCategoryPositions: false,
          showCircadianRhythm: false,
          showTimeBlocks: false
        };
      case 'categories':
        return {
          showClockMarkers: true,
          showCurrentTime: true,
          showCategoryPositions: true,
          showCircadianRhythm: true,
          showTimeBlocks: false
        };
      case 'timeblocks':
        return {
          showClockMarkers: true,
          showCurrentTime: true,
          showCategoryPositions: true,
          showCircadianRhythm: false,
          showTimeBlocks: true
        };
      case 'full':
        return {
          showClockMarkers: true,
          showCurrentTime: true,
          showCategoryPositions: true,
          showCircadianRhythm: true,
          showTimeBlocks: true
        };
      default:
        return {
          showClockMarkers: true,
          showCurrentTime: true,
          showCategoryPositions: false,
          showCircadianRhythm: false,
          showTimeBlocks: false
        };
    }
  };
  const modeConfig = getModeConfig();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif font-bold text-white mb-2">
            Revolutionary Clock System
          </h1>
          <p className="text-xl text-white/80 mb-6">
            Transform your day into an intuitive 12-hour clock visualization
          </p>
          <p className="text-white/60 max-w-2xl mx-auto">
            Physical at 12 o'clock (☀️ sun position), categories positioned at optimal circadian times,
            with real-time sun indicator showing current time position.
          </p>
        </div>
        {/* Demo Mode Controls */}
        <div className="flex justify-center gap-4 mb-8">
          <button
            onClick={() => setClockMode('basic')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              clockMode === 'basic'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/25'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Basic Clock
          </button>
          <button
            onClick={() => setClockMode('categories')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              clockMode === 'categories'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/25'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            + Categories
          </button>
          <button
            onClick={() => setClockMode('timeblocks')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              clockMode === 'timeblocks'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/25'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            + Time Blocks
          </button>
          <button
            onClick={() => setClockMode('full')}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              clockMode === 'full'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/25'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            Full System
          </button>
        </div>
        {/* Current Mode Description */}
        <div className="text-center mb-8">
          <div className="inline-block bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3">
            {clockMode === 'basic' && (
              <p className="text-white/90">
                <span className="text-amber-400">☀️ Basic Clock:</span> 12-hour markers with sun at 12 o'clock + real-time sun position
              </p>
            )}
            {clockMode === 'categories' && (
              <p className="text-white/90">
                <span className="text-amber-400">🎯 Categories:</span> Each category positioned at optimal circadian hours with time ranges
              </p>
            )}
            {clockMode === 'timeblocks' && (
              <p className="text-white/90">
                <span className="text-amber-400">⏰ Time Blocks:</span> Scheduled activities appear as arcs at their clock positions
              </p>
            )}
            {clockMode === 'full' && (
              <p className="text-white/90">
                <span className="text-amber-400">🚀 Full System:</span> Complete revolutionary clock with all features activated
              </p>
            )}
          </div>
        </div>
        {/* Main Clock Display */}
        <div className="flex justify-center mb-8">
          <div className="w-full max-w-lg">
            <HexagonClock
              data={sampleData}
              timeBlocks={sampleTimeBlocks}
              size={500}
              animate={true}
              showResonance={false}
              {...modeConfig}
              clockBasedPositioning={true}
              onCategoryClick={(category) => {
                }}
            />
          </div>
        </div>
        {/* Feature Explanations */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-xl font-bold text-amber-400 mb-3 flex items-center">
              ☀️ Sun at 12 O&apos;Clock
            </h3>
            <p className="text-white/80">
              Physical activities positioned at 12 o&apos;clock where the sun symbol lives,
              representing morning energy and vitality peak.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-xl font-bold text-amber-400 mb-3 flex items-center">
              🧠 Circadian Alignment
            </h3>
            <p className="text-white/80">
              Each category positioned at optimal biological times:
              Mental at 2 PM (focus), Social at 6 PM (connection),
              Spiritual at 8 PM (reflection).
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-xl font-bold text-amber-400 mb-3 flex items-center">
              ⏰ Real-Time Awareness
            </h3>
            <p className="text-white/80">
              Moving sun indicator shows current time position,
              updating every minute with smooth animations and
              NOW indicator for temporal context.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-xl font-bold text-amber-400 mb-3 flex items-center">
              📅 Time Block Arcs
            </h3>
            <p className="text-white/80">
              Scheduled activities appear as colored arcs at their
              clock positions, with visual status indicators:
              planned, active, completed, overflowing.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-xl font-bold text-amber-400 mb-3 flex items-center">
              ⚠️ Conflict Detection
            </h3>
            <p className="text-white/80">
              Smart scheduling prevents overlaps with visual
              conflict warnings and optimal time suggestions
              based on circadian rhythms.
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
            <h3 className="text-xl font-bold text-amber-400 mb-3 flex items-center">
              🎨 Interactive Planning
            </h3>
            <p className="text-white/80">
              Click categories to see optimal times,
              drag time blocks to reschedule,
              and get circadian-based recommendations.
            </p>
          </div>
        </div>
        {/* Current Time & Category Status */}
        <div className="text-center text-white/60">
          <p className="mb-2">
            Current Time: <span className="text-amber-400 font-mono">
              {new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
            </span>
          </p>
          <p>
            Revolutionary positioning transforms abstract wellness tracking into intuitive,
            time-aware daily planning that aligns with your natural rhythms.
          </p>
        </div>
      </div>
    </div>
  );
};
export default ClockDemoPage;

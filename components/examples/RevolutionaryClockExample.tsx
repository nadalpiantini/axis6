/**
 * Revolutionary Clock Example - Integration Guide
 * Shows how to use the HexagonClock with revolutionary positioning
 */
'use client'
import React from 'react';
import { HexagonClock } from '@/components/hexagon-clock/HexagonClock';
// Example 1: Dashboard with Revolutionary Clock Markers
export const DashboardWithClock = () => {
  const completionData = {
    physical: 85,   // 12 o'clock - Morning energy
    mental: 70,     // 2 o'clock - Focus hours
    emotional: 60,  // 4 o'clock - Afternoon creativity
    social: 90,     // 6 o'clock - Evening connection
    spiritual: 75,  // 8 o'clock - Night reflection
    material: 55    // 10 o'clock - Late planning
  };
  return (
    <div className="p-8 bg-gradient-to-br from-slate-900 to-purple-900 min-h-screen">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        Dashboard with Revolutionary Clock
      </h2>
      <div className="max-w-lg mx-auto">
        <HexagonClock
          data={completionData}
          showClockMarkers={true}
          showCurrentTime={true}
          showCategoryPositions={true}
          clockBasedPositioning={true}
          animate={true}
          onCategoryClick={(category) => {
            alert(`Optimal time for ${category.shortLabel}: ${category.clockPosition?.timeRange}`);
          }}
        />
      </div>
    </div>
  );
};
// Example 2: Time Planning with Clock Positioning
export const TimePlanningWithClock = () => {
  const timeBlocks = [
    {
      id: 'morning-workout',
      startTime: new Date().setHours(7, 0, 0, 0).toString(),
      duration: 45,
      category: 'physical',
      status: 'completed' as const,
      title: '🏃‍♂️ Morning Run'
    },
    {
      id: 'deep-work',
      startTime: new Date().setHours(9, 0, 0, 0).toString(),
      duration: 120,
      category: 'mental',
      status: 'active' as const,
      title: '💻 Focus Work',
      progress: 0.4
    },
    {
      id: 'creative-session',
      startTime: new Date().setHours(14, 30, 0, 0).toString(),
      duration: 60,
      category: 'emotional',
      status: 'planned' as const,
      title: '🎨 Creative Time'
    },
    {
      id: 'friend-dinner',
      startTime: new Date().setHours(18, 0, 0, 0).toString(),
      duration: 90,
      category: 'social',
      status: 'planned' as const,
      title: '🍽️ Dinner with Friends'
    },
    {
      id: 'evening-meditation',
      startTime: new Date().setHours(20, 30, 0, 0).toString(),
      duration: 30,
      category: 'spiritual',
      status: 'planned' as const,
      title: '🧘‍♀️ Meditation'
    },
    {
      id: 'planning-tomorrow',
      startTime: new Date().setHours(22, 0, 0, 0).toString(),
      duration: 20,
      category: 'material',
      status: 'empty' as const,
      title: '📝 Plan Tomorrow'
    }
  ];
  return (
    <div className="p-8 bg-gradient-to-br from-slate-900 to-blue-900 min-h-screen">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        Time Planning with Revolutionary Clock
      </h2>
      <div className="max-w-lg mx-auto">
        <HexagonClock
          timeBlocks={timeBlocks}
          showClockMarkers={true}
          showCurrentTime={true}
          showCategoryPositions={true}
          showTimeBlocks={true}
          clockBasedPositioning={true}
          animate={true}
          onCategoryClick={(category) => {
            const optimal = category.clockPosition;
            alert(`${category.shortLabel}: ${optimal?.symbolism}\nOptimal time: ${optimal?.timeRange}`);
          }}
        />
      </div>
      <div className="text-center mt-8 text-white/80">
        <p className="mb-2">🎯 Time blocks positioned at optimal circadian hours</p>
        <p>⏰ Real-time sun shows current position on your daily clock</p>
      </div>
    </div>
  );
};
// Example 3: Full Revolutionary System
export const FullRevolutionarySystem = () => {
  const data = {
    physical: 80,
    mental: 65,
    emotional: 90,
    social: 70,
    spiritual: 85,
    material: 60
  };
  const timeBlocks = [
    {
      id: 'morning-routine',
      startTime: new Date().setHours(6, 30, 0, 0).toString(),
      duration: 60,
      category: 'physical',
      status: 'completed' as const,
      title: 'Morning Routine'
    },
    {
      id: 'work-focus',
      startTime: new Date().setHours(10, 0, 0, 0).toString(),
      duration: 90,
      category: 'mental',
      status: 'active' as const,
      title: 'Deep Work',
      progress: 0.7
    }
  ];
  return (
    <div className="p-8 bg-gradient-to-br from-purple-900 to-indigo-900 min-h-screen">
      <h2 className="text-2xl font-bold text-white mb-6 text-center">
        Full Revolutionary Clock System
      </h2>
      <div className="max-w-lg mx-auto">
        <HexagonClock
          data={data}
          timeBlocks={timeBlocks}
          showClockMarkers={true}
          showCurrentTime={true}
          showCategoryPositions={true}
          showCircadianRhythm={true}
          showTimeBlocks={true}
          clockBasedPositioning={true}
          animate={true}
          onCategoryClick={(category) => {
            }}
        />
      </div>
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 text-white/80 text-sm">
        <div className="bg-white/10 p-4 rounded-lg">
          <h3 className="font-bold text-amber-400 mb-2">🌅 Circadian Mapping</h3>
          <p>Categories positioned at biologically optimal times for peak performance</p>
        </div>
        <div className="bg-white/10 p-4 rounded-lg">
          <h3 className="font-bold text-amber-400 mb-2">☀️ Sun Positioning</h3>
          <p>12 o'clock sun reference makes daily planning intuitive as reading time</p>
        </div>
        <div className="bg-white/10 p-4 rounded-lg">
          <h3 className="font-bold text-amber-400 mb-2">⏰ Time Awareness</h3>
          <p>Real-time sun indicator creates temporal context and time consciousness</p>
        </div>
        <div className="bg-white/10 p-4 rounded-lg">
          <h3 className="font-bold text-amber-400 mb-2">🎯 Smart Planning</h3>
          <p>Conflict detection and optimal time suggestions guide scheduling decisions</p>
        </div>
      </div>
    </div>
  );
};
// Usage in your pages
export const UsageExamples = {
  // Basic dashboard with revolutionary markers
  dashboard: (
    <HexagonClock
      data={{ physical: 75, mental: 80, emotional: 65, social: 90, spiritual: 70, material: 55 }}
      showClockMarkers={true}
      showCurrentTime={true}
      showCategoryPositions={true}
    />
  ),
  // Time planning with blocks
  planning: (
    <HexagonClock
      timeBlocks={[/* your time blocks */]}
      showClockMarkers={true}
      showCurrentTime={true}
      showTimeBlocks={true}
      showCategoryPositions={true}
    />
  ),
  // Full revolutionary system
  full: (
    <HexagonClock
      data={{ /* completion data */ }}
      timeBlocks={[/* time blocks */]}
      showClockMarkers={true}
      showCurrentTime={true}
      showCategoryPositions={true}
      showCircadianRhythm={true}
      showTimeBlocks={true}
      clockBasedPositioning={true}
    />
  )
};

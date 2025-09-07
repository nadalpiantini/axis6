'use client'

import React, { useState, useCallback } from 'react'
import { HexagonClock } from '../HexagonClock'
import { DashboardCard } from '@/components/ui/dashboard-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCcw, Play, Pause } from 'lucide-react'
import { motion } from 'framer-motion'

// Mock data types
interface ActivityCompletion {
  id: string;
  category: string;
  axis: string;
  completed: boolean;
  completedAt: Date;
  mood?: number;
  notes?: string;
}

interface TimeDistribution {
  [hour: number]: {
    Physical?: number;
    Emotional?: number;
    Mental?: number;
    Social?: number;
    Spiritual?: number;
    Creative?: number;
  };
}

interface TimeBlock {
  id: string;
  hour: number;
  category: string;
  axis: string;
  duration: number;
  color: string;
}

// Mock data
const mockCompletionData: ActivityCompletion[] = [
  {
    id: '1',
    category: 'Workout',
    axis: 'Physical',
    completed: true,
    completedAt: new Date('2024-01-15T07:30:00'),
    mood: 4,
    notes: 'Great morning run'
  },
  {
    id: '2',
    category: 'Meditation',
    axis: 'Spiritual',
    completed: true,
    completedAt: new Date('2024-01-15T06:00:00'),
    mood: 5
  },
  {
    id: '3',
    category: 'Team Meeting',
    axis: 'Social',
    completed: true,
    completedAt: new Date('2024-01-15T10:00:00'),
    mood: 3
  },
  {
    id: '4',
    category: 'Creative Writing',
    axis: 'Creative',
    completed: false,
    completedAt: new Date('2024-01-15T16:00:00')
  },
  {
    id: '5',
    category: 'Learning',
    axis: 'Mental',
    completed: true,
    completedAt: new Date('2024-01-15T14:30:00'),
    mood: 4
  }
];

const mockTimeDistribution: TimeDistribution = {
  6: { Spiritual: 1 },
  7: { Physical: 1 },
  8: { Physical: 0.5, Mental: 0.5 },
  9: { Mental: 1 },
  10: { Social: 1 },
  11: { Social: 0.5, Mental: 0.5 },
  14: { Mental: 1 },
  15: { Mental: 0.5, Creative: 0.5 },
  16: { Creative: 1 },
  18: { Physical: 1 },
  19: { Emotional: 1 },
  20: { Social: 1 }
};

const mockTimeBlocks: TimeBlock[] = [
  {
    id: 'tb1',
    hour: 7,
    category: 'Morning Workout',
    axis: 'Physical',
    duration: 60,
    color: '#ef4444'
  },
  {
    id: 'tb2',
    hour: 14,
    category: 'Study Session',
    axis: 'Mental',
    duration: 120,
    color: '#3b82f6'
  },
  {
    id: 'tb3',
    hour: 18,
    category: 'Social Hour',
    axis: 'Social',
    duration: 90,
    color: '#eab308'
  }
];

export function IntegrationExample() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isAnimating, setIsAnimating] = useState(true);
  const [selectedAxis, setSelectedAxis] = useState<string | null>(null);

  // Simulate real-time updates
  const updateTime = useCallback(() => {
    setCurrentTime(new Date());
  }, []);

  const toggleAnimation = useCallback(() => {
    setIsAnimating(!isAnimating);
  }, [isAnimating]);

  const refreshData = useCallback(() => {
    // Simulate data refresh
    updateTime();
    // In real app, this would trigger data refetch
  }, [updateTime]);

  const handleAxisToggle = useCallback((axisId: string) => {
    setSelectedAxis(selectedAxis === axisId ? null : axisId);
  }, [selectedAxis]);

  const handleTimeBlockDrag = useCallback((block: TimeBlock, newHour: number) => {
    // In real app, this would update the database
  }, []);

  const handleCategoryClick = useCallback((category: string) => {
    // In real app, this would navigate to category details
  }, []);

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <DashboardCard title="Hexagon Clock Integration" className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              Live Demo
            </Badge>
            <Badge 
              variant={selectedAxis ? "default" : "secondary"}
              className="text-xs"
            >
              {selectedAxis || 'All Axes'}
            </Badge>
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={toggleAnimation}
            >
              {isAnimating ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {isAnimating ? 'Pause' : 'Play'}
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={refreshData}
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Integration Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {mockCompletionData.filter(d => d.completed).length}
            </div>
            <div className="text-sm text-muted-foreground">Completed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {Object.keys(mockTimeDistribution).length}
            </div>
            <div className="text-sm text-muted-foreground">Active Hours</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">
              {mockTimeBlocks.length}
            </div>
            <div className="text-sm text-muted-foreground">Time Blocks</div>
          </div>
        </div>
      </DashboardCard>

      {/* Hexagon Clock Display */}
      <DashboardCard className="p-8">
        <motion.div 
          className="flex justify-center"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <HexagonClock
            data={mockCompletionData}
            distribution={mockTimeDistribution}
            showResonance={true}
            showClockMarkers={true}
            showCurrentTime={true}
            animate={isAnimating}
            size={420}
            onToggleAxis={handleAxisToggle}
            onTimeBlockDrag={handleTimeBlockDrag}
            onCategoryClick={handleCategoryClick}
          />
        </motion.div>
      </DashboardCard>

      {/* Activity Summary */}
      <DashboardCard title="Today's Activities" className="p-4">
        <div className="space-y-2">
          {mockCompletionData.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`flex items-center justify-between p-3 rounded-lg ${
                activity.completed 
                  ? 'bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800'
                  : 'bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  activity.completed ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                <div>
                  <div className="font-medium">{activity.category}</div>
                  <div className="text-sm text-muted-foreground">
                    {activity.axis} • {activity.completedAt.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>
              </div>
              
              {activity.mood && (
                <Badge variant="outline" className="text-xs">
                  Mood: {activity.mood}/5
                </Badge>
              )}
            </motion.div>
          ))}
        </div>
      </DashboardCard>
    </div>
  );
}
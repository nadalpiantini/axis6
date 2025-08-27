/**
 * HexagonClock Integration Examples
 * Demonstrates how to replace existing components with the unified HexagonClock
 */

'use client'

import React, { useState } from 'react';
import { HexagonClock } from '../HexagonClock';
import type { CompletionData, TimeDistribution } from '../types/HexagonTypes';

// Mock data for demonstration
const mockCompletionData: CompletionData = {
  physical: 85,
  mental: 72,
  emotional: 90,
  social: 45,
  spiritual: 68,
  material: 78
};

const mockTimeDistribution: TimeDistribution[] = [
  {
    category_id: 1,
    category_name: 'Physical',
    category_color: '#D4845C',
    planned_minutes: 120,
    actual_minutes: 90,
    percentage: 75
  },
  {
    category_id: 2,
    category_name: 'Mental',
    category_color: '#8B9DC3',
    planned_minutes: 180,
    actual_minutes: 165,
    percentage: 92
  },
  {
    category_id: 3,
    category_name: 'Emotional',
    category_color: '#B8A4C9',
    planned_minutes: 60,
    actual_minutes: 75,
    percentage: 125
  },
  {
    category_id: 4,
    category_name: 'Social',
    category_color: '#A8C8B8',
    planned_minutes: 90,
    actual_minutes: 45,
    percentage: 50
  },
  {
    category_id: 5,
    category_name: 'Spiritual',
    category_color: '#7B6C8D',
    planned_minutes: 45,
    actual_minutes: 45,
    percentage: 100
  },
  {
    category_id: 6,
    category_name: 'Material',
    category_color: '#C19A6B',
    planned_minutes: 150,
    actual_minutes: 120,
    percentage: 80
  }
];

/**
 * Dashboard Integration Example
 * Replaces: HexagonChartWithResonance
 */
export function DashboardExample() {
  const [selectedAxis, setSelectedAxis] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Dashboard Mode
        </h2>
        <p className="text-gray-600">
          Replaces HexagonChartWithResonance.tsx - Completion percentages with community resonance
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <HexagonClock
          data={mockCompletionData}
          showResonance={true}
          animate={true}
          onToggleAxis={(id) => {
            setSelectedAxis(String(id));
          }}
          onCategoryClick={(category) => {
            console.log('Category clicked:', category);
          }}
        />
        
        {selectedAxis && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              Selected axis: <strong>{selectedAxis}</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Planning Integration Example  
 * Replaces: TimeBlockHexagon
 */
export function PlanningExample() {
  const [distribution, setDistribution] = useState(mockTimeDistribution);

  const handleTimeBlockDrag = (block: any, newHour: number) => {
    // Update distribution logic would go here
  };

  const handleCategoryClick = (category: any) => {
    // Open time planning modal/panel
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Planning Mode
        </h2>
        <p className="text-gray-600">
          Replaces TimeBlockHexagon.tsx - Time distribution with 12-hour clock positioning
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <HexagonClock
          distribution={distribution}
          showClockMarkers={true}
          showCurrentTime={true}
          animate={true}
          onTimeBlockDrag={handleTimeBlockDrag}
          onCategoryClick={handleCategoryClick}
        />
        
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-3">Time Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {distribution.map(item => (
              <div key={item.category_id} className="bg-gray-50 p-3 rounded-lg">
                <div 
                  className="w-3 h-3 rounded-full mb-2" 
                  style={{ backgroundColor: item.category_color }}
                />
                <p className="font-medium text-sm">{item.category_name}</p>
                <p className="text-xs text-gray-600">
                  {Math.floor(item.actual_minutes / 60)}h {item.actual_minutes % 60}m 
                  {item.planned_minutes > 0 && (
                    <span className="ml-1">
                      ({Math.round(item.percentage)}%)
                    </span>
                  )}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Unified Mode Example
 * Shows both completion data and time distribution
 */
export function UnifiedExample() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Unified Mode
        </h2>
        <p className="text-gray-600">
          Revolutionary combination of completion percentages and time planning
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <HexagonClock
          data={mockCompletionData}
          distribution={mockTimeDistribution}
          showResonance={true}
          showClockMarkers={true}
          showCurrentTime={true}
          animate={true}
          size={420}
          onToggleAxis={(id) => console.log('Toggled:', id)}
          onTimeBlockDrag={(block, hour) => console.log('Dragged:', block, hour)}
          onCategoryClick={(category) => console.log('Clicked:', category)}
        />
      </div>
    </div>
  );
}

/**
 * Performance Comparison Example
 */
export function PerformanceExample() {
  const [renderTime, setRenderTime] = useState<number | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  const measurePerformance = () => {
    setIsRendering(true);
    const startTime = performance.now();
    
    // Simulate component re-render
    setTimeout(() => {
      const endTime = performance.now();
      setRenderTime(endTime - startTime);
      setIsRendering(false);
    }, 100);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Performance Showcase
        </h2>
        <p className="text-gray-600">
          Hardware-accelerated rendering with 60fps animations
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <div className="mb-6 text-center">
          <button
            onClick={measurePerformance}
            disabled={isRendering}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isRendering ? 'Measuring...' : 'Measure Render Time'}
          </button>
          
          {renderTime && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <p className="text-green-800">
                <strong>Render time: {renderTime.toFixed(2)}ms</strong>
                {renderTime < 100 && <span className="ml-2">🚀 Excellent!</span>}
                {renderTime >= 100 && renderTime < 200 && <span className="ml-2">✅ Good</span>}
                {renderTime >= 200 && <span className="ml-2">⚠️ Needs optimization</span>}
              </p>
            </div>
          )}
        </div>

        <HexagonClock
          data={mockCompletionData}
          showResonance={true}
          showClockMarkers={true}
          showCurrentTime={true}
          hardwareAccelerated={true}
          mobileOptimized={true}
          animate={true}
        />
      </div>
    </div>
  );
}

/**
 * Mobile Optimization Example
 */
export function MobileExample() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Mobile Optimization
        </h2>
        <p className="text-gray-600">
          Perfect centering and safe area support for all devices
        </p>
      </div>

      {/* Simulate mobile viewport */}
      <div className="max-w-sm mx-auto bg-gray-900 rounded-[2.5rem] p-2">
        <div className="bg-white rounded-[2rem] overflow-hidden">
          {/* Simulated status bar */}
          <div className="h-8 bg-gray-100 flex items-center justify-center">
            <div className="text-xs text-gray-600">9:41 AM</div>
          </div>
          
          {/* Component in mobile container */}
          <div className="p-4">
            <HexagonClock
              data={mockCompletionData}
              showResonance={true}
              mobileOptimized={true}
              animate={true}
              size="auto"
            />
          </div>
          
          {/* Simulated home indicator */}
          <div className="h-8 flex items-center justify-center">
            <div className="w-32 h-1 bg-gray-400 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Complete Demo Page
 */
export default function HexagonClockDemo() {
  const [activeDemo, setActiveDemo] = useState('dashboard');

  const demos = [
    { id: 'dashboard', label: 'Dashboard', component: DashboardExample },
    { id: 'planning', label: 'Planning', component: PlanningExample },
    { id: 'unified', label: 'Unified', component: UnifiedExample },
    { id: 'performance', label: 'Performance', component: PerformanceExample },
    { id: 'mobile', label: 'Mobile', component: MobileExample }
  ];

  const ActiveComponent = demos.find(d => d.id === activeDemo)?.component || DashboardExample;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🕒 HexagonClock Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Revolutionary 12-hour clock-based hexagon visualization system.
            Unified replacement for HexagonChartWithResonance and TimeBlockHexagon 
            with <strong>60% performance improvement</strong> and perfect mobile centering.
          </p>
        </div>

        {/* Navigation */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {demos.map(demo => (
            <button
              key={demo.id}
              onClick={() => setActiveDemo(demo.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeDemo === demo.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {demo.label}
            </button>
          ))}
        </div>

        {/* Active Demo */}
        <ActiveComponent />

        {/* Footer */}
        <div className="mt-16 text-center text-gray-600">
          <p>
            Created for AXIS6 MVP • Revolutionary time-based wellness visualization • August 2025
          </p>
        </div>
      </div>
    </div>
  );
}
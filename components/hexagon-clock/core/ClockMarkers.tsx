/**
 * Clock Markers Component
 * 12-hour clock indicators and time management UI
 */

'use client'

import React, { memo, useState, useEffect } from 'react';
import type { PrecomputedSVG, ResponsiveSizing } from '../types/HexagonTypes';
import { 
  generateRevolutionaryClockMarkers, 
  getCurrentTimeSunPosition,
  getCategoryClockPosition,
  CLOCK_POSITIONS,
  HEXAGON_CATEGORIES 
} from '../utils/clockPositions';

interface ClockMarkersProps {
  precomputedSVG: PrecomputedSVG;
  responsiveSizing: ResponsiveSizing;
  showClockMarkers?: boolean;
  showCurrentTime?: boolean;
  showCategoryPositions?: boolean;
  showCircadianRhythm?: boolean;
  animate?: boolean;
  onCategoryClick?: (category: any) => void;
}

/**
 * Revolutionary 12-hour clock markers with sun at 12 o'clock
 */
const RevolutionaryHourMarkers = memo(function RevolutionaryHourMarkers({
  precomputedSVG,
  responsiveSizing,
  animate = true
}: {
  precomputedSVG: PrecomputedSVG;
  responsiveSizing: ResponsiveSizing;
  animate?: boolean;
}) {
  const { center, radius } = precomputedSVG;
  const markers = generateRevolutionaryClockMarkers(center, radius * 1.15);
  
  return (
    <g className="revolutionary-clock-markers">
      {markers.map(marker => (
        <g key={`marker-${marker.hour}`}>
          {/* Special sun marker at 12 o'clock */}
          {marker.isSun ? (
            <g transform={`translate(${marker.x}, ${marker.y})`}>
              {/* Sun glow */}
              <circle
                cx="0"
                cy="0"
                r="12"
                fill="rgba(255, 215, 0, 0.2)"
                className="animate-pulse"
              />
              {/* Sun body */}
              <circle
                cx="0"
                cy="0"
                r="8"
                fill="#FFD700"
                stroke="#FFA500"
                strokeWidth="2"
                className={animate ? 'animate-scale-in transform-gpu' : 'transform-gpu'}
                style={{
                  animationDelay: '0.2s',
                  animationDuration: '0.8s'
                }}
              />
              {/* Sun rays */}
              {[0, 45, 90, 135, 180, 225, 270, 315].map((rayAngle, idx) => {
                const rayAngleRad = (rayAngle * Math.PI) / 180;
                const rayStart = 10;
                const rayEnd = 16;
                const x1 = rayStart * Math.cos(rayAngleRad);
                const y1 = rayStart * Math.sin(rayAngleRad);
                const x2 = rayEnd * Math.cos(rayAngleRad);
                const y2 = rayEnd * Math.sin(rayAngleRad);
                
                return (
                  <line
                    key={`ray-${idx}`}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#FFD700"
                    strokeWidth="2"
                    strokeLinecap="round"
                    opacity="0.8"
                    className={animate ? 'animate-scale-in' : ''}
                    style={{
                      animationDelay: `${0.4 + idx * 0.05}s`,
                      animationDuration: '0.6s'
                    }}
                  />
                );
              })}
              {/* 12 label with sun */}
              <text
                x="0"
                y="25"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-amber-400 text-sm font-bold select-none"
                style={{
                  opacity: animate ? 0 : 1,
                  animation: animate ? 'fade-in 0.5s ease-out 0.8s forwards' : 'none'
                }}
              >
                12
              </text>
            </g>
          ) : (
            /* Regular hour markers */
            <>
              <circle
                cx={marker.x}
                cy={marker.y}
                r={marker.size}
                fill={marker.isQuarter ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.4)'}
                className={animate ? 'animate-scale-in transform-gpu' : 'transform-gpu'}
                style={{
                  animationDelay: `${marker.hour * 0.05}s`,
                  animationDuration: '0.5s'
                }}
              />
              
              {/* Hour numbers for quarter hours */}
              {marker.isQuarter && (
                <text
                  x={marker.x}
                  y={marker.y + 20}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className={`fill-white/60 ${responsiveSizing.fontSize.time} font-medium select-none`}
                  style={{
                    opacity: animate ? 0 : 1,
                    animation: animate ? `fade-in 0.5s ease-out ${0.5 + marker.hour * 0.05}s forwards` : 'none'
                  }}
                >
                  {marker.hour}
                </text>
              )}
            </>
          )}
        </g>
      ))}
    </g>
  );
});

/**
 * Revolutionary current time indicator (moving sun)
 */
const RevolutionaryCurrentTimeSun = memo(function RevolutionaryCurrentTimeSun({
  precomputedSVG,
  animate = true
}: {
  precomputedSVG: PrecomputedSVG;
  animate?: boolean;
}) {
  const { center, radius } = precomputedSVG;
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sunRotation, setSunRotation] = useState(0);
  
  // Update current time every minute for precise positioning
  useEffect(() => {
    const updateTime = () => setCurrentTime(new Date());
    updateTime(); // Initial call
    
    const interval = setInterval(updateTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);
  
  // Animate sun rotation for living effect
  useEffect(() => {
    const interval = setInterval(() => {
      setSunRotation(prev => (prev + 1) % 360);
    }, 100); // Slow rotation
    
    return () => clearInterval(interval);
  }, []);
  
  const sunPosition = getCurrentTimeSunPosition(center, radius * 0.9);
  
  return (
    <g className="revolutionary-current-time-sun">
      {/* Sun trajectory path (faint circle showing 12-hour path) */}
      <circle
        cx={center.x}
        cy={center.y}
        r={radius * 0.9}
        fill="none"
        stroke="rgba(255, 215, 0, 0.1)"
        strokeWidth="1"
        strokeDasharray="4,8"
        className={animate ? 'animate-draw-in' : ''}
        style={{
          animationDelay: '1.5s',
          animationDuration: '3s'
        }}
      />
      
      {/* Moving sun at current time position */}
      <g
        transform={`translate(${sunPosition.x}, ${sunPosition.y})`}
        className={animate ? 'animate-scale-in transform-gpu' : 'transform-gpu'}
        style={{
          animationDelay: '1s',
          animationDuration: '1s',
          transformOrigin: 'center center'
        }}
      >
        {/* Sun glow effect */}
        <circle
          cx="0"
          cy="0"
          r="15"
          fill="rgba(255, 215, 0, 0.15)"
          className="animate-pulse"
        />
        
        {/* Sun center */}
        <circle
          cx="0"
          cy="0"
          r="10"
          fill="#FFD700"
          stroke="#FFA500"
          strokeWidth="2"
          className="animate-pulse"
          style={{
            filter: 'drop-shadow(0 0 12px #FFD700)'
          }}
        />
        
        {/* Rotating sun rays */}
        <g 
          transform={`rotate(${sunRotation})`}
          className="sun-rays"
        >
          {[0, 45, 90, 135, 180, 225, 270, 315].map((rayAngle, idx) => {
            const rayAngleRad = (rayAngle * Math.PI) / 180;
            const rayStart = 14;
            const rayEnd = 22;
            const x1 = rayStart * Math.cos(rayAngleRad);
            const y1 = rayStart * Math.sin(rayAngleRad);
            const x2 = rayEnd * Math.cos(rayAngleRad);
            const y2 = rayEnd * Math.sin(rayAngleRad);
            
            return (
              <line
                key={`ray-${idx}`}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#FFD700"
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.8"
                className="transform-gpu"
              />
            );
          })}
        </g>
        
        {/* Minute indicator (small dot) */}
        <circle
          cx="0"
          cy="-12"
          r="2"
          fill="#FFA500"
          transform={`rotate(${(sunPosition.minute * 6)})`} // 6 degrees per minute
          className="animate-pulse"
        />
      </g>
      
      {/* Current time display */}
      <g transform={`translate(${sunPosition.x}, ${sunPosition.y + 40})`}>
        <rect
          x="-25"
          y="-10"
          width="50"
          height="20"
          rx="10"
          fill="rgba(0, 0, 0, 0.8)"
          stroke="rgba(255, 215, 0, 0.3)"
          strokeWidth="1"
        />
        <text
          x="0"
          y="2"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-amber-200 text-xs font-bold select-none tabular-nums"
          style={{
            opacity: animate ? 0 : 1,
            animation: animate ? 'fade-in 0.5s ease-out 1.5s forwards' : 'none'
          }}
        >
          {sunPosition.timeString}
        </text>
      </g>
      
      {/* NOW indicator */}
      <text
        x={sunPosition.x}
        y={sunPosition.y - 30}
        textAnchor="middle"
        dominantBaseline="middle"
        className="fill-amber-300 text-xs font-medium select-none tracking-wider"
        style={{
          opacity: animate ? 0 : 1,
          animation: animate ? 'fade-in 0.5s ease-out 1.8s forwards' : 'none'
        }}
      >
        NOW
      </text>
    </g>
  );
});

/**
 * Revolutionary category positioning at clock hours
 */
const CategoryClockPositions = memo(function CategoryClockPositions({
  precomputedSVG,
  responsiveSizing,
  animate = true,
  onCategoryClick
}: {
  precomputedSVG: PrecomputedSVG;
  responsiveSizing: ResponsiveSizing;
  animate?: boolean;
  onCategoryClick?: (category: any) => void;
}) {
  const { center, radius } = precomputedSVG;
  
  return (
    <g className="category-clock-positions">
      {HEXAGON_CATEGORIES.map((category, idx) => {
        const clockPos = getCategoryClockPosition(category.key, center, radius * 0.85);
        const labelPos = getCategoryClockPosition(category.key, center, radius * 1.2);
        
        return (
          <g key={`category-${category.key}`} className={`category-${category.key}`}>
            {/* Category indicator on hexagon edge */}
            <g
              className="category-position-group cursor-pointer transform-gpu hover:scale-110 transition-transform"
              onClick={() => onCategoryClick?.(category)}
              style={{
                opacity: animate ? 0 : 1,
                animation: animate ? `fade-in 0.6s ease-out ${1.2 + idx * 0.1}s forwards` : 'none'
              }}
            >
              {/* Category icon background */}
              <circle
                cx={clockPos.x}
                cy={clockPos.y}
                r="12"
                fill={category.color}
                fillOpacity="0.9"
                stroke="rgba(255, 255, 255, 0.4)"
                strokeWidth="2"
                style={{
                  filter: `drop-shadow(0 2px 8px ${category.color}40)`
                }}
              />
              
              {/* Category icon */}
              <text
                x={clockPos.x}
                y={clockPos.y + 2}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="14"
                className="select-none"
                style={{ pointerEvents: 'none' }}
              >
                {clockPos.icon}
              </text>
              
              {/* Hour indicator */}
              <text
                x={clockPos.x}
                y={clockPos.y - 18}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-white/80 text-xs font-bold select-none"
                style={{ pointerEvents: 'none' }}
              >
                {clockPos.hour === 12 ? '12' : clockPos.hour}
              </text>
            </g>
            
            {/* Category label with time range */}
            <g
              className="category-label-group cursor-pointer"
              onClick={() => onCategoryClick?.(category)}
              style={{
                opacity: animate ? 0 : 1,
                animation: animate ? `fade-in 0.5s ease-out ${1.5 + idx * 0.1}s forwards` : 'none'
              }}
            >
              {/* Label background */}
              <rect
                x={labelPos.x - 40}
                y={labelPos.y - 15}
                width="80"
                height="30"
                rx="15"
                fill="rgba(0, 0, 0, 0.7)"
                stroke={category.color}
                strokeWidth="1"
                strokeOpacity="0.3"
              />
              
              {/* Category name */}
              <text
                x={labelPos.x}
                y={labelPos.y - 3}
                textAnchor="middle"
                dominantBaseline="middle"
                className={`fill-white font-semibold select-none ${responsiveSizing.fontSize.label}`}
              >
                {category.shortLabel}
              </text>
              
              {/* Time range */}
              <text
                x={labelPos.x}
                y={labelPos.y + 8}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-white/60 text-xs select-none"
              >
                {clockPos.timeRange}
              </text>
            </g>
            
            {/* Connecting line from center to category */}
            <line
              x1={center.x}
              y1={center.y}
              x2={clockPos.x}
              y2={clockPos.y}
              stroke={category.color}
              strokeWidth="1"
              strokeOpacity="0.3"
              strokeDasharray="2,3"
              className={animate ? 'animate-draw-in' : ''}
              style={{
                animationDelay: `${0.8 + idx * 0.05}s`,
                animationDuration: '1s'
              }}
            />
          </g>
        );
      })}
    </g>
  );
});

/**
 * Circadian rhythm indicators
 */
const CircadianRhythmIndicators = memo(function CircadianRhythmIndicators({
  precomputedSVG,
  animate = true
}: {
  precomputedSVG: PrecomputedSVG;
  animate?: boolean;
}) {
  const { center, radius } = precomputedSVG;
  
  return (
    <g className="circadian-rhythm-indicators">
      {HEXAGON_CATEGORIES.map((category, idx) => {
        const clockPos = getCategoryClockPosition(category.key, center, radius * 1.4);
        
        return (
          <g key={`circadian-${category.key}`}>
            {/* Circadian peak indicator */}
            <text
              x={clockPos.x}
              y={clockPos.y - 5}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-white/40 text-xs font-medium select-none"
              style={{
                opacity: animate ? 0 : 1,
                animation: animate ? `fade-in 0.5s ease-out ${2 + idx * 0.1}s forwards` : 'none'
              }}
            >
              {CLOCK_POSITIONS[category.key].circadianPeak}
            </text>
            
            {/* Symbolism tooltip area */}
            <text
              x={clockPos.x}
              y={clockPos.y + 8}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-white/25 text-xs select-none"
              style={{
                opacity: animate ? 0 : 1,
                animation: animate ? `fade-in 0.5s ease-out ${2.2 + idx * 0.1}s forwards` : 'none'
              }}
            >
              {CLOCK_POSITIONS[category.key].symbolism.split(' - ')[0]}
            </text>
          </g>
        );
      })}
    </g>
  );
});

/**
 * Clock face background
 */
const ClockFace = memo(function ClockFace({
  precomputedSVG,
  animate = true
}: {
  precomputedSVG: PrecomputedSVG;
  animate?: boolean;
}) {
  const { center, radius } = precomputedSVG;
  
  return (
    <g className="clock-face">
      {/* Outer clock circle */}
      <circle
        cx={center.x}
        cy={center.y}
        r={radius * 1.2}
        fill="none"
        stroke="rgba(255, 255, 255, 0.1)"
        strokeWidth="1"
        strokeDasharray="2,3"
        className={animate ? 'animate-draw-in' : ''}
        style={{
          animationDelay: '0.3s',
          animationDuration: '2s',
          strokeDashoffset: animate ? '628' : '0' // 2π * radius
        }}
      />
      
      {/* Inner clock circle */}
      <circle
        cx={center.x}
        cy={center.y}
        r={radius * 0.25}
        fill="rgba(0, 0, 0, 0.3)"
        stroke="rgba(255, 255, 255, 0.2)"
        strokeWidth="1"
        className={animate ? 'animate-scale-in' : ''}
        style={{
          animationDelay: '1s',
          animationDuration: '0.5s'
        }}
      />
    </g>
  );
});

/**
 * Revolutionary main clock markers component
 */
export const ClockMarkers = memo(function ClockMarkers({
  precomputedSVG,
  responsiveSizing,
  showClockMarkers = true,
  showCurrentTime = true,
  showCategoryPositions = false,
  showCircadianRhythm = false,
  animate = true,
  onCategoryClick
}: ClockMarkersProps) {
  return (
    <g className="revolutionary-clock-system">
      {/* Clock face background */}
      {showClockMarkers && (
        <ClockFace 
          precomputedSVG={precomputedSVG} 
          animate={animate} 
        />
      )}
      
      {/* Revolutionary hour markers with sun at 12 */}
      {showClockMarkers && (
        <RevolutionaryHourMarkers
          precomputedSVG={precomputedSVG}
          responsiveSizing={responsiveSizing}
          animate={animate}
        />
      )}
      
      {/* Categories positioned at optimal clock hours */}
      {showCategoryPositions && (
        <CategoryClockPositions
          precomputedSVG={precomputedSVG}
          responsiveSizing={responsiveSizing}
          animate={animate}
          onCategoryClick={onCategoryClick}
        />
      )}
      
      {/* Circadian rhythm indicators */}
      {showCircadianRhythm && (
        <CircadianRhythmIndicators
          precomputedSVG={precomputedSVG}
          animate={animate}
        />
      )}
      
      {/* Revolutionary current time sun with movement */}
      {showCurrentTime && (
        <RevolutionaryCurrentTimeSun
          precomputedSVG={precomputedSVG}
          animate={animate}
        />
      )}
    </g>
  );
});

ClockMarkers.displayName = 'ClockMarkers';
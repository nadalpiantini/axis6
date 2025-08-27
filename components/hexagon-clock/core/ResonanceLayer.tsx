/**
 * Resonance Layer Component
 * Community resonance visualization with hardware-accelerated animations
 */

'use client'

import React, { memo } from 'react';
import type { 
  PrecomputedSVG, 
  ResponsiveSizing,
  ResonanceData 
} from '../types/HexagonTypes';
import { generateResonanceDotPositions } from '../utils/pathGeneration';
import { HEXAGON_CATEGORIES } from '../utils/clockPositions';

interface ResonanceLayerProps {
  precomputedSVG: PrecomputedSVG;
  responsiveSizing: ResponsiveSizing;
  resonanceData?: Array<ResonanceData>;
  showResonance?: boolean;
  animate?: boolean;
  windowWidth?: number;
}

/**
 * Individual resonance dot with breathing animation
 */
const ResonanceDot = memo(function ResonanceDot({
  x,
  y,
  color,
  intensity,
  delay,
  size = 2,
  animate = true
}: {
  x: number;
  y: number;
  color: string;
  intensity: number;
  delay: number;
  size?: number;
  animate?: boolean;
}) {
  return (
    <circle
      cx={x}
      cy={y}
      r={size}
      fill={color}
      opacity={0.6}
      className={animate ? 'transform-gpu animate-pulse' : 'transform-gpu'}
      style={{
        animationDelay: `${delay}s`,
        animationDuration: '3s',
        filter: `drop-shadow(0 1px 3px ${color}60)`,
        // Custom breathing animation for resonance
        animation: animate ? `resonance-breathe 3s ease-in-out infinite ${delay}s` : 'none'
      }}
    />
  );
});

/**
 * Resonance ripple effect around active axes
 */
const ResonanceRipple = memo(function ResonanceRipple({
  center,
  radius,
  color,
  intensity,
  animate = true
}: {
  center: { x: number; y: number };
  radius: number;
  color: string;
  intensity: number;
  animate?: boolean;
}) {
  return (
    <g className="resonance-ripple">
      {[1, 2, 3].map(ring => (
        <circle
          key={`ripple-${ring}`}
          cx={center.x}
          cy={center.y}
          r={radius * (0.8 + ring * 0.2)}
          fill="none"
          stroke={color}
          strokeWidth="1"
          strokeOpacity={0.3 / ring}
          className={animate ? 'transform-gpu' : 'transform-gpu'}
          style={{
            animation: animate ? `resonance-ripple 4s ease-out infinite ${ring * 0.5}s` : 'none'
          }}
        />
      ))}
    </g>
  );
});

/**
 * Resonance connection lines between similar axes
 */
const ResonanceConnections = memo(function ResonanceConnections({
  precomputedSVG,
  resonanceData,
  animate = true
}: {
  precomputedSVG: PrecomputedSVG;
  resonanceData?: Array<ResonanceData>;
  animate?: boolean;
}) {
  if (!resonanceData || resonanceData.length < 2) return null;
  
  const { center } = precomputedSVG;
  const activeAxes = resonanceData.filter(r => r.hasResonance);
  
  if (activeAxes.length < 2) return null;
  
  // Generate connection lines between axes with resonance
  const connections: Array<{
    start: { x: number; y: number };
    end: { x: number; y: number };
    strength: number;
    color: string;
  }> = [];
  
  for (let i = 0; i < activeAxes.length; i++) {
    for (let j = i + 1; j < activeAxes.length; j++) {
      const axis1 = activeAxes[i];
      const axis2 = activeAxes[j];
      
      const cat1 = HEXAGON_CATEGORIES.find(c => c.key === axis1.axisSlug);
      const cat2 = HEXAGON_CATEGORIES.find(c => c.key === axis2.axisSlug);
      
      if (!cat1 || !cat2) continue;
      
      const pos1 = precomputedSVG.clockPositions.find(p => 
        p.angle === cat1.clockPosition.angle
      );
      const pos2 = precomputedSVG.clockPositions.find(p => 
        p.angle === cat2.clockPosition.angle
      );
      
      if (!pos1 || !pos2) continue;
      
      const strength = Math.min(axis1.resonanceCount + axis2.resonanceCount, 10) / 10;
      const blendedColor = blendColors(cat1.color, cat2.color);
      
      connections.push({
        start: pos1,
        end: pos2,
        strength,
        color: blendedColor
      });
    }
  }
  
  return (
    <g className="resonance-connections">
      {connections.map((conn, idx) => (
        <line
          key={`connection-${idx}`}
          x1={conn.start.x}
          y1={conn.start.y}
          x2={conn.end.x}
          y2={conn.end.y}
          stroke={conn.color}
          strokeWidth={Math.max(1, conn.strength * 3)}
          strokeOpacity={conn.strength * 0.4}
          strokeDasharray="3,2"
          className={animate ? 'transform-gpu' : 'transform-gpu'}
          style={{
            animation: animate ? `resonance-flow 6s ease-in-out infinite ${idx * 0.3}s` : 'none'
          }}
        />
      ))}
    </g>
  );
});

/**
 * Resonance whisper text that appears on hover/interaction
 */
const ResonanceWhisper = memo(function ResonanceWhisper({
  position,
  text,
  color,
  visible = false,
  fontSize = 'text-xs'
}: {
  position: { x: number; y: number };
  text: string;
  color: string;
  visible?: boolean;
  fontSize?: string;
}) {
  if (!visible || !text) return null;
  
  return (
    <g 
      className="resonance-whisper"
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
        pointerEvents: 'none'
      }}
    >
      {/* Background bubble */}
      <rect
        x={position.x - 60}
        y={position.y - 30}
        width="120"
        height="20"
        rx="10"
        fill="rgba(0, 0, 0, 0.8)"
        stroke={color}
        strokeWidth="1"
        strokeOpacity="0.5"
      />
      
      {/* Whisper text */}
      <text
        x={position.x}
        y={position.y - 15}
        textAnchor="middle"
        dominantBaseline="middle"
        className={`fill-white ${fontSize} font-medium`}
        style={{ maxWidth: '100px' }}
      >
        {text.length > 20 ? `${text.substring(0, 17)}...` : text}
      </text>
    </g>
  );
});

/**
 * Main resonance layer component
 */
export const ResonanceLayer = memo(function ResonanceLayer({
  precomputedSVG,
  responsiveSizing,
  resonanceData,
  showResonance = true,
  animate = true,
  windowWidth = 640
}: ResonanceLayerProps) {
  if (!showResonance || !resonanceData) return null;
  
  const { center, radius } = precomputedSVG;
  const resonanceRadius = responsiveSizing.resonanceRadius;
  const dotSize = windowWidth < 640 ? 1.5 : 2;
  
  // Generate resonance dot positions
  const dots = generateResonanceDotPositions(resonanceData, center, resonanceRadius);
  
  // Find axes with strong resonance for ripple effects
  const strongResonanceAxes = resonanceData
    .filter(r => r.hasResonance && r.resonanceCount >= 3)
    .map(r => {
      const category = HEXAGON_CATEGORIES.find(c => c.key === r.axisSlug);
      const position = precomputedSVG.clockPositions.find(p => 
        category && p.angle === category.clockPosition.angle
      );
      return { ...r, category, position };
    })
    .filter(r => r.position);
  
  return (
    <g className="resonance-layer">
      {/* Custom CSS animations */}
      <style jsx>{`
        @keyframes resonance-breathe {
          0%, 100% { 
            transform: translateZ(0) scale(0.8);
            opacity: 0.4;
          }
          50% { 
            transform: translateZ(0) scale(1.2);
            opacity: 0.8;
          }
        }
        
        @keyframes resonance-ripple {
          0% {
            transform: translateZ(0) scale(0.5);
            stroke-opacity: 0.6;
          }
          100% {
            transform: translateZ(0) scale(2);
            stroke-opacity: 0;
          }
        }
        
        @keyframes resonance-flow {
          0%, 100% {
            stroke-dashoffset: 0;
            opacity: 0.2;
          }
          50% {
            stroke-dashoffset: 10;
            opacity: 0.8;
          }
        }
      `}</style>
      
      {/* Resonance connections between active axes */}
      <ResonanceConnections
        precomputedSVG={precomputedSVG}
        resonanceData={resonanceData}
        animate={animate}
      />
      
      {/* Ripple effects for strong resonance */}
      {strongResonanceAxes.map((axis, idx) => (
        <ResonanceRipple
          key={`ripple-${axis.axisSlug}`}
          center={axis.position!}
          radius={radius * 0.3}
          color={axis.category!.color}
          intensity={axis.resonanceCount / 10}
          animate={animate}
        />
      ))}
      
      {/* Individual resonance dots */}
      {dots.map((dot, idx) => (
        <ResonanceDot
          key={`dot-${idx}`}
          x={dot.x}
          y={dot.y}
          color={dot.color}
          intensity={dot.intensity}
          delay={dot.delay}
          size={dotSize}
          animate={animate}
        />
      ))}
    </g>
  );
});

ResonanceLayer.displayName = 'ResonanceLayer';

/**
 * Utility function to blend two hex colors
 */
function blendColors(color1: string, color2: string): string {
  // Convert hex to RGB
  const hex1 = color1.replace('#', '');
  const hex2 = color2.replace('#', '');
  
  const r1 = parseInt(hex1.substring(0, 2), 16);
  const g1 = parseInt(hex1.substring(2, 4), 16);
  const b1 = parseInt(hex1.substring(4, 6), 16);
  
  const r2 = parseInt(hex2.substring(0, 2), 16);
  const g2 = parseInt(hex2.substring(2, 4), 16);
  const b2 = parseInt(hex2.substring(4, 6), 16);
  
  // Blend by averaging
  const r = Math.round((r1 + r2) / 2);
  const g = Math.round((g1 + g2) / 2);
  const b = Math.round((b1 + b2) / 2);
  
  // Convert back to hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
# AXIS6 Code Optimization Analysis & Implementation

## Bundle Size Crisis - Current State
- **Total Bundle Size**: 3.65 MB (Target: <1MB - 70% reduction needed)
- **Largest Chunk**: vendors-63b66a93c487c73d.js - 1.37MB (38% of total bundle)
- **Critical Issue**: @tanstack/react-query-devtools in production

## Critical Issues Identified

### 1. Development Dependencies in Production
❌ **@tanstack/react-query-devtools** - Development tool should NOT be in production
- Size Impact: ~300-500KB
- Fix: Move to devDependencies + conditional import

### 2. Bundle Splitting Inefficiencies
❌ **Vendor chunk too large** - 1.37MB single chunk
- Contains: React, Supabase, Framer Motion, Radix UI
- Fix: Better chunk splitting strategy

### 3. Heavy Dependencies
❌ **16 Radix UI packages** - Potential over-inclusion
❌ **Framer Motion** - Heavy animation library (~200KB)
❌ **Recharts** - Chart library (~150KB)
❌ **@sentry/nextjs** - Error monitoring (~100KB)

### 4. Missing Optimizations
❌ **No dynamic imports** - All code loaded upfront
❌ **No tree shaking optimization** for Radix UI
❌ **No React.lazy** for heavy components

## Optimization Implementation Plan

### Phase 1: Critical Dependencies (Immediate 40% reduction)
1. Move @tanstack/react-query-devtools to devDependencies
2. Add conditional import for devtools in development only
3. Optimize vendor chunk splitting

### Phase 2: Dynamic Imports (30% reduction)
1. Implement React.lazy for analytics page
2. Dynamic imports for chart libraries
3. Lazy load heavy components

### Phase 3: Tree Shaking (20% reduction)
1. Optimize Radix UI imports
2. Remove unused dependencies
3. Optimize Framer Motion imports

### Phase 4: Bundle Optimization (10% reduction)
1. Enable all Next.js production optimizations
2. Implement proper chunk splitting
3. Remove console.log statements
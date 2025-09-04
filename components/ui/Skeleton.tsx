import { cn } from '@/lib/utils'
interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'circular' | 'rectangular'
  animation?: 'pulse' | 'wave' | 'none'
  width?: string | number
  height?: string | number
}
export function Skeleton({
  className,
  variant = 'default',
  animation = 'pulse',
  width,
  height,
  ...props
}: SkeletonProps) {
  const animationClass = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: ''
  }[animation]
  const variantClass = {
    default: 'rounded-md',
    circular: 'rounded-full',
    rectangular: 'rounded-none'
  }[variant]
  return (
    <div
      className={cn(
        'bg-white/10',
        animationClass,
        variantClass,
        className
      )}
      style={{
        width: width,
        height: height
      }}
      {...props}
    />
  )
}
// Skeleton components for specific UI elements
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('glass rounded-2xl p-6 space-y-4', className)}>
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-32 w-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  )
}
export function SkeletonHexagon({ size = 300 }: { size?: number }) {
  return (
    <div className="flex justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <polygon
          points={createHexagonPath(size * 0.4, size / 2, size / 2)}
          className="fill-white/5 animate-pulse"
        />
        {[...Array(6)].map((_, i) => {
          const angle = (Math.PI / 3) * i - Math.PI / 2
          const x = size / 2 + (size * 0.4) * Math.cos(angle)
          const y = size / 2 + (size * 0.4) * Math.sin(angle)
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={size * 0.08}
              className="fill-white/10 animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          )
        })}
      </svg>
    </div>
  )
}
export function SkeletonCategoryGrid() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10">
          <div className="flex items-center gap-3">
            <Skeleton variant="circular" className="w-10 h-10" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}
export function SkeletonStats() {
  return (
    <div className="glass rounded-2xl p-6">
      <Skeleton className="h-5 w-24 mb-4" />
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex justify-between items-center">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    </div>
  )
}
export function SkeletonDashboard() {
  return (
    <div className="grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <SkeletonCard className="mb-8" />
        <SkeletonHexagon />
        <div className="mt-8">
          <SkeletonCategoryGrid />
        </div>
      </div>
      <div className="space-y-6">
        <SkeletonStats />
        <SkeletonStats />
      </div>
    </div>
  )
}
// Helper function for hexagon path
function createHexagonPath(size: number, centerX: number, centerY: number) {
  const points = []
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2
    const x = centerX + size * Math.cos(angle)
    const y = centerY + size * Math.sin(angle)
    points.push(`${x},${y}`)
  }
  return points.join(' ')
}
// Add shimmer animation to tailwind.config.ts
// @keyframes shimmer {
//   0% { background-position: -200% 0; }
//   100% { background-position: 200% 0; }
// }

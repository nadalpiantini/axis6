// Tipos para el nuevo sistema AXIS6 Timeline
export interface Axis {
  id: string
  name: string
  color: string
  icon: string
  order_index: number
}

export interface Subcategory {
  id: string
  axis_id: string
  name: string
  icon?: string
  is_default: boolean
  created_at?: string
}

export interface TimeBlock {
  id: string
  user_id: string
  axis_id: string
  subcategory_id: string
  date: string
  start_hour: number
  start_quarter: 0 | 15 | 30 | 45
  duration_minutes: number
  note?: string
  created_at?: string
  updated_at?: string
  // Joined data from queries
  axis?: Axis
  subcategory?: Subcategory
}

export interface DailyReflection {
  id: string
  user_id: string
  date: string
  text: string
  created_at?: string
  updated_at?: string
}

export interface DayData {
  date: string
  timeblocks: TimeBlock[]
  reflection?: DailyReflection
  axis_minutes: Record<string, number>
}

export interface AxisMinutes {
  [axisId: string]: number
}

// Para Quick Add Panel
export interface QuickAddActivity {
  axis_id: string
  subcategory_id: string
  duration_minutes: number
  note?: string
}

// Para el timeline
export interface TimeSlot {
  hour: number
  quarter: 0 | 15 | 30 | 45
  isAvailable: boolean
  timeblock?: TimeBlock
}

// Helper types
export type QuarterType = 0 | 15 | 30 | 45

export interface AvailableSlot {
  hour: number
  quarter: QuarterType
}

// Para estadísticas
export interface DayStats {
  totalMinutes: number
  activeAxes: number
  balanceScore: number // 0-100
  topAxis: {
    id: string
    name: string
    minutes: number
    color: string
  } | null
}

// Estados del componente
export interface TimelineState {
  loading: boolean
  error: string | null
  dayData: DayData
  selectedAxis: string | null
  showQuickAdd: boolean
}
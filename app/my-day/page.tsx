'use client'
import { format, addDays, subDays, isToday } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { StandardHeader } from '@/components/layout/StandardHeader'
import { MobileFriendlyMyDay } from '@/components/my-day/MobileFriendlyMyDay'
import { ImprovedAxisMenu } from '@/components/my-day/ImprovedAxisMenu'
import { AxisIcon } from '@/components/icons'
import { useUser } from '@/lib/react-query/hooks'
import { useDayData, useQuickAddBlock, AXES } from '@/lib/hooks/useDayData'
import { useRouter as useNextRouter } from 'next/navigation'


export default function MyDayPage() {
  const router = useRouter()
  const { data: authUser } = useUser()
  const user = authUser
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showAxisMenu, setShowAxisMenu] = useState(false)
  const [selectedAxis, setSelectedAxis] = useState<{ id: number; name: string; color: string; icon: string } | null>(null)
  
  // Fetch data for selected date
  const { data: dayData, isLoading, refetch } = useDayData(selectedDate)
  const quickAddBlock = useQuickAddBlock()
  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
    }
  }, [user, router])

  const handleDateChange = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setSelectedDate(prev => subDays(prev, 1))
    } else {
      setSelectedDate(prev => addDays(prev, 1))
    }
  }

  const handleBlockClick = (hour: number, minutes: number) => {
    if (selectedAxis) {
      // Get the start timestamp for this time slot
      const startTime = new Date(selectedDate)
      startTime.setHours(hour, minutes, 0, 0)
      
      // Quick add 30 minutes of this axis activity
      quickAddBlock.mutate({
        axisId: selectedAxis.id,
        minutes: 30,
        note: `${selectedAxis.name} activity`
      })
    }
  }

  const handleEditBlock = (block: any) => {
    // TODO: Implement block editing functionality
    console.log('Edit block:', block)
  }

  const handleAxisMenuSelect = async (activity: string, duration: number) => {
    if (selectedAxis) {
      try {
        await quickAddBlock.mutateAsync({
          axisId: selectedAxis.id,
          minutes: duration,
          note: activity
        })
        setShowAxisMenu(false)
        setSelectedAxis(null)
      } catch (error) {
        console.error('Error adding activity:', error)
      }
    }
  }

  const handleAxisMenuClose = () => {
    setShowAxisMenu(false)
    setSelectedAxis(null)
  }

  const totalMinutes = dayData?.totalMinutes || 0
  const axesActive = dayData?.axesActive || 0
  const blocks = dayData?.blocks || []
  return (
    <div
      className="min-h-screen bg-gradient-to-br from-gray-950 via-purple-950 to-indigo-950"
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)'
      }}
    >
      {/* Header */}
      <StandardHeader
        user={user}
        variant="default"
        title="AXIS6 - My Day"
        subtitle={format(selectedDate, 'EEEE, MMMM d, yyyy')}
        showBackButton={true}
        backUrl="/dashboard"
      />
      {/* Main Content */}
      <main
        className="container mx-auto px-4 py-6"
        style={{ paddingTop: 'calc(5rem + env(safe-area-inset-top, 0px))' }}
      >
        {/* Date Navigation */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between glass rounded-xl p-4 mb-6"
        >
          <button
            onClick={() => handleDateChange('prev')}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Previous day"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">
              {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE, MMMM d')}
            </h1>
            <p className="text-sm text-gray-400">
              {format(selectedDate, 'MMMM d, yyyy')}
            </p>
          </div>
          <button
            onClick={() => handleDateChange('next')}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Next day"
          >
            <ChevronRight className="w-5 h-5 text-white" />
          </button>
        </motion.div>

        {/* Mobile-Friendly Vertical Layout */}
        <MobileFriendlyMyDay
          selectedDate={selectedDate}
          onDateChange={handleDateChange}
          blocks={blocks}
          onAxisClick={(axis) => {
            setSelectedAxis(axis)
            setShowAxisMenu(true)
          }}
          onBlockClick={handleBlockClick}
          onEditBlock={handleEditBlock}
        />
      </main>
      {/* Improved Axis Menu */}
      <ImprovedAxisMenu
        isOpen={showAxisMenu}
        onClose={handleAxisMenuClose}
        axis={selectedAxis}
        onSelect={handleAxisMenuSelect}
      />
    </div>
  )
}

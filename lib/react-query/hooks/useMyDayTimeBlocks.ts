/**
 * useMyDayTimeBlocks - Hook for managing time blocks data
 * Connects HexagonClock with real Supabase data
 */

'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { useUser } from './useUser';

// Time block interface matching database structure
interface TimeBlockData {
  id: string;
  user_id: string;
  date: string;
  category_id: string;  // UUID from axis6_categories
  activity_id?: number;
  activity_name: string;
  start_time: string;   // HH:MM format
  end_time?: string;
  block_ts?: string;    // ISO timestamp
  duration_minutes: number;
  status: 'empty' | 'planned' | 'active' | 'completed' | 'overflowing';
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Transformed time block for HexagonClock
interface HexagonTimeBlock {
  id: string;
  startTime: string;
  duration: number;
  category: string;
  status: 'empty' | 'planned' | 'active' | 'completed' | 'overflowing';
  title?: string;
  progress?: number;
}

// Category mapping for clock positions
interface CategoryMapping {
  id: string;
  slug: string;
  name: string;
  color: string;
}

/**
 * Get categories for mapping IDs to slugs
 */
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('axis6_categories')
        .select('id, slug, name, color')
        .order('position');
      
      if (error) throw error;
      return data as CategoryMapping[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Get My Day data with time blocks
 */
export function useMyDayTimeBlocks(date?: string) {
  const { user } = useUser();
  const { data: categories } = useCategories();
  
  const today = date || new Date().toISOString().split('T')[0];
  
  return useQuery({
    queryKey: ['myDayTimeBlocks', user?.id, today],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const supabase = createClient();
      
      // Get My Day data from RPC function
      const { data: myDayData, error: myDayError } = await supabase
        .rpc('get_my_day_data', {
          p_user_id: user.id,
          p_date: today
        });
      
      if (myDayError) throw myDayError;
      
      // Get time blocks from table
      const { data: timeBlocks, error: timeBlocksError } = await supabase
        .from('axis6_time_blocks')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .order('start_time');
      
      if (timeBlocksError) throw timeBlocksError;
      
      return {
        myDayData: myDayData || [],
        timeBlocks: timeBlocks || []
      };
    },
    enabled: !!user?.id && !!categories,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Transform database time blocks to HexagonClock format
 */
export function useTransformedTimeBlocks(date?: string) {
  const { data: myDayData } = useMyDayTimeBlocks(date);
  const { data: categories } = useCategories();
  
  const transformedBlocks: HexagonTimeBlock[] = (myDayData?.timeBlocks || []).map((block: TimeBlockData) => {
    const category = categories?.find(cat => cat.id === block.category_id);
    
    return {
      id: block.id,
      startTime: block.start_time,
      duration: block.duration_minutes,
      category: category?.slug || 'physical', // fallback to physical
      status: block.status as any,
      title: block.activity_name,
      progress: block.status === 'active' ? 0.5 : undefined // TODO: calculate real progress
    };
  });
  
  return {
    timeBlocks: transformedBlocks,
    isLoading: !myDayData,
    categories
  };
}

/**
 * Start activity timer
 */
export function useStartActivityTimer() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      categoryId,
      timeBlockId,
      activityName,
      activityId
    }: {
      categoryId: string;  // UUID
      timeBlockId: number;
      activityName: string;
      activityId?: number;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const supabase = createClient();
      const { data, error } = await supabase.rpc('start_activity_timer', {
        p_user_id: user.id,
        p_category_id: categoryId,  // Now using UUID
        p_time_block_id: timeBlockId,
        p_activity_name: activityName,
        p_activity_id: activityId || null
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate My Day data to refresh UI
      queryClient.invalidateQueries({ queryKey: ['myDayTimeBlocks'] });
    }
  });
}

/**
 * Stop activity timer
 */
export function useStopActivityTimer() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      activityLogId
    }: {
      activityLogId: number;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const supabase = createClient();
      const { data, error } = await supabase.rpc('stop_activity_timer', {
        p_user_id: user.id,
        p_activity_log_id: activityLogId
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate My Day data to refresh UI
      queryClient.invalidateQueries({ queryKey: ['myDayTimeBlocks'] });
    }
  });
}

/**
 * Create new time block
 */
export function useCreateTimeBlock() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      categoryId,
      activityName,
      startTime,
      durationMinutes,
      date
    }: {
      categoryId: string;  // UUID
      activityName: string;
      startTime: string;   // HH:MM
      durationMinutes: number;
      date?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');
      
      const today = date || new Date().toISOString().split('T')[0];
      
      // Calculate end time
      const [hours, minutes] = startTime.split(':').map(Number);
      const startDate = new Date();
      startDate.setHours(hours, minutes, 0, 0);
      const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
      const endTime = endDate.toTimeString().slice(0, 5);
      
      const supabase = createClient();
      const { data, error } = await supabase
        .from('axis6_time_blocks')
        .insert({
          user_id: user.id,
          date: today,
          category_id: categoryId,
          activity_name: activityName,
          start_time: startTime,
          end_time: endTime,
          duration_minutes: durationMinutes,
          status: 'planned'
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate My Day data to refresh UI
      queryClient.invalidateQueries({ queryKey: ['myDayTimeBlocks'] });
    }
  });
}
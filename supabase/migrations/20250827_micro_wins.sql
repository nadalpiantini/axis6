-- AXIS6 Micro Wins Social System Migration
-- Implementing: "Micro Wins. One Axis at a Time. Tiny Actions. Total Balance."
-- Date: 2025-08-27

BEGIN;

-- ============================================
-- MICRO WINS TRACKING
-- ============================================

-- Daily rituals for morning micro wins (optional time windows)
CREATE TABLE IF NOT EXISTS axis6_daily_rituals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ritual_date DATE NOT NULL DEFAULT CURRENT_DATE,
  morning_window_start TIME DEFAULT '04:45',
  morning_window_end TIME DEFAULT '05:30',
  completed_at TIMESTAMPTZ,
  axis_focus TEXT CHECK (axis_focus IN ('physical', 'mental', 'emotional', 'social', 'spiritual', 'material')),
  micro_win_text TEXT CHECK (char_length(micro_win_text) <= 140),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, ritual_date)
);

-- Enhanced micro wins tracking (builds on existing micro_posts)
CREATE TABLE IF NOT EXISTS axis6_micro_wins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES axis6_micro_posts(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES axis6_categories(id),
  axis_slug TEXT NOT NULL CHECK (axis_slug IN ('physical', 'mental', 'emotional', 'social', 'spiritual', 'material')),
  win_text TEXT NOT NULL CHECK (char_length(win_text) <= 140),
  minutes INTEGER CHECK (minutes IN (5, 10, 15, 25, 45, NULL)),
  is_morning_ritual BOOLEAN DEFAULT FALSE,
  privacy TEXT NOT NULL DEFAULT 'public' CHECK (privacy IN ('public', 'followers', 'private')),
  resonance_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Resonance streaks for consistent micro actions
CREATE TABLE IF NOT EXISTS axis6_resonance_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  streak_type TEXT NOT NULL DEFAULT 'daily' CHECK (streak_type IN ('daily', 'morning', 'axis')),
  axis_slug TEXT CHECK (axis_slug IN ('physical', 'mental', 'emotional', 'social', 'spiritual', 'material', NULL)),
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_win_date DATE,
  total_micro_wins INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, streak_type, axis_slug)
);

-- Social graph for community connections
CREATE TABLE IF NOT EXISTS axis6_social_graph (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Support reactions for micro wins (extends hex reactions concept)
CREATE TABLE IF NOT EXISTS axis6_micro_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  micro_win_id UUID NOT NULL REFERENCES axis6_micro_wins(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL DEFAULT 'hex_star' CHECK (reaction_type IN ('hex_star', 'support', 'inspire')),
  axis_resonance TEXT CHECK (axis_resonance IN ('physical', 'mental', 'emotional', 'social', 'spiritual', 'material')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(micro_win_id, user_id, reaction_type)
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_daily_rituals_user_date 
ON axis6_daily_rituals(user_id, ritual_date DESC);

CREATE INDEX IF NOT EXISTS idx_micro_wins_user_created 
ON axis6_micro_wins(user_id, created_at DESC) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_micro_wins_public_feed 
ON axis6_micro_wins(created_at DESC) 
WHERE privacy = 'public' AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_micro_wins_axis 
ON axis6_micro_wins(axis_slug, created_at DESC) 
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_resonance_streaks_user 
ON axis6_resonance_streaks(user_id, streak_type);

CREATE INDEX IF NOT EXISTS idx_social_graph_follower 
ON axis6_social_graph(follower_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_social_graph_following 
ON axis6_social_graph(following_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_micro_reactions_win 
ON axis6_micro_reactions(micro_win_id, created_at DESC);

-- ============================================
-- RPC FUNCTIONS
-- ============================================

-- Record a micro win with optional morning ritual
CREATE OR REPLACE FUNCTION record_micro_win(
  p_user_id UUID,
  p_axis TEXT,
  p_win_text TEXT,
  p_minutes INTEGER DEFAULT NULL,
  p_privacy TEXT DEFAULT 'public',
  p_is_morning BOOLEAN DEFAULT FALSE
) RETURNS TABLE(
  success BOOLEAN,
  win_id UUID,
  message TEXT,
  streak_updated BOOLEAN
) LANGUAGE plpgsql AS $$
DECLARE
  v_category_id UUID;
  v_win_id UUID;
  v_current_time TIME;
  v_is_valid_morning BOOLEAN := FALSE;
  v_today DATE := CURRENT_DATE;
BEGIN
  -- Get category ID
  SELECT id INTO v_category_id 
  FROM axis6_categories 
  WHERE slug = p_axis;
  
  IF v_category_id IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, 'Invalid axis', FALSE;
    RETURN;
  END IF;
  
  -- Check morning window if applicable
  IF p_is_morning THEN
    v_current_time := LOCALTIME;
    IF v_current_time BETWEEN TIME '04:45' AND TIME '05:30' THEN
      v_is_valid_morning := TRUE;
      
      -- Record daily ritual
      INSERT INTO axis6_daily_rituals (user_id, ritual_date, completed_at, axis_focus, micro_win_text)
      VALUES (p_user_id, v_today, NOW(), p_axis, p_win_text)
      ON CONFLICT (user_id, ritual_date) 
      DO UPDATE SET 
        completed_at = NOW(),
        axis_focus = p_axis,
        micro_win_text = p_win_text;
    END IF;
  END IF;
  
  -- Create micro win
  INSERT INTO axis6_micro_wins (
    user_id, category_id, axis_slug, win_text, 
    minutes, privacy, is_morning_ritual
  ) VALUES (
    p_user_id, v_category_id, p_axis, p_win_text,
    p_minutes, p_privacy, v_is_valid_morning
  ) RETURNING id INTO v_win_id;
  
  -- Update streaks
  PERFORM update_resonance_streak(p_user_id, p_axis, v_is_valid_morning);
  
  RETURN QUERY SELECT 
    TRUE, 
    v_win_id,
    CASE 
      WHEN v_is_valid_morning THEN 'Morning micro win recorded!'
      ELSE 'Micro win recorded!'
    END,
    TRUE;
END;
$$;

-- Update resonance streaks
CREATE OR REPLACE FUNCTION update_resonance_streak(
  p_user_id UUID,
  p_axis TEXT,
  p_is_morning BOOLEAN DEFAULT FALSE
) RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_streak_types TEXT[] := ARRAY['daily'];
BEGIN
  -- Add morning streak type if applicable
  IF p_is_morning THEN
    v_streak_types := array_append(v_streak_types, 'morning');
  END IF;
  
  -- Update daily and morning streaks
  FOREACH v_streak_type IN ARRAY v_streak_types LOOP
    INSERT INTO axis6_resonance_streaks (
      user_id, streak_type, current_streak, longest_streak, 
      last_win_date, total_micro_wins
    ) VALUES (
      p_user_id, v_streak_type, 1, 1, v_today, 1
    )
    ON CONFLICT (user_id, streak_type, axis_slug) 
    DO UPDATE SET
      current_streak = CASE
        WHEN axis6_resonance_streaks.last_win_date = v_today - 1 THEN 
          axis6_resonance_streaks.current_streak + 1
        WHEN axis6_resonance_streaks.last_win_date = v_today THEN 
          axis6_resonance_streaks.current_streak
        ELSE 1
      END,
      longest_streak = GREATEST(
        axis6_resonance_streaks.longest_streak,
        CASE
          WHEN axis6_resonance_streaks.last_win_date = v_today - 1 THEN 
            axis6_resonance_streaks.current_streak + 1
          WHEN axis6_resonance_streaks.last_win_date = v_today THEN 
            axis6_resonance_streaks.current_streak
          ELSE 1
        END
      ),
      last_win_date = v_today,
      total_micro_wins = axis6_resonance_streaks.total_micro_wins + 
        CASE WHEN axis6_resonance_streaks.last_win_date != v_today THEN 1 ELSE 0 END,
      updated_at = NOW();
  END LOOP;
  
  -- Update axis-specific streak
  INSERT INTO axis6_resonance_streaks (
    user_id, streak_type, axis_slug, current_streak, 
    longest_streak, last_win_date, total_micro_wins
  ) VALUES (
    p_user_id, 'axis', p_axis, 1, 1, v_today, 1
  )
  ON CONFLICT (user_id, streak_type, axis_slug) 
  DO UPDATE SET
    current_streak = CASE
      WHEN axis6_resonance_streaks.last_win_date = v_today - 1 THEN 
        axis6_resonance_streaks.current_streak + 1
      WHEN axis6_resonance_streaks.last_win_date = v_today THEN 
        axis6_resonance_streaks.current_streak
      ELSE 1
    END,
    longest_streak = GREATEST(
      axis6_resonance_streaks.longest_streak,
      CASE
        WHEN axis6_resonance_streaks.last_win_date = v_today - 1 THEN 
          axis6_resonance_streaks.current_streak + 1
        WHEN axis6_resonance_streaks.last_win_date = v_today THEN 
          axis6_resonance_streaks.current_streak
        ELSE 1
      END
    ),
    last_win_date = v_today,
    total_micro_wins = axis6_resonance_streaks.total_micro_wins + 
      CASE WHEN axis6_resonance_streaks.last_win_date != v_today THEN 1 ELSE 0 END,
    updated_at = NOW();
END;
$$;

-- Get resonance leaderboard
CREATE OR REPLACE FUNCTION get_resonance_leaderboard(
  p_streak_type TEXT DEFAULT 'daily',
  p_limit INTEGER DEFAULT 20
) RETURNS TABLE(
  user_id UUID,
  profile_name TEXT,
  current_streak INTEGER,
  longest_streak INTEGER,
  total_wins INTEGER,
  rank INTEGER
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rs.user_id,
    p.name as profile_name,
    rs.current_streak,
    rs.longest_streak,
    rs.total_micro_wins as total_wins,
    RANK() OVER (ORDER BY rs.current_streak DESC) as rank
  FROM axis6_resonance_streaks rs
  JOIN axis6_profiles p ON p.id = rs.user_id
  WHERE rs.streak_type = p_streak_type
    AND rs.axis_slug IS NULL
  ORDER BY rs.current_streak DESC, rs.total_micro_wins DESC
  LIMIT p_limit;
END;
$$;

-- Get micro wins feed with social graph filtering
CREATE OR REPLACE FUNCTION get_micro_wins_feed(
  p_user_id UUID,
  p_feed_type TEXT DEFAULT 'all',
  p_axis TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
) RETURNS TABLE(
  win_id UUID,
  user_id UUID,
  user_name TEXT,
  axis_slug TEXT,
  axis_color TEXT,
  win_text TEXT,
  minutes INTEGER,
  is_morning BOOLEAN,
  resonance_count INTEGER,
  created_at TIMESTAMPTZ,
  user_reacted BOOLEAN
) LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mw.id as win_id,
    mw.user_id,
    p.name as user_name,
    mw.axis_slug,
    c.color as axis_color,
    mw.win_text,
    mw.minutes,
    mw.is_morning_ritual as is_morning,
    mw.resonance_count,
    mw.created_at,
    EXISTS(
      SELECT 1 FROM axis6_micro_reactions mr 
      WHERE mr.micro_win_id = mw.id 
        AND mr.user_id = p_user_id
    ) as user_reacted
  FROM axis6_micro_wins mw
  JOIN axis6_profiles p ON p.id = mw.user_id
  JOIN axis6_categories c ON c.slug = mw.axis_slug
  WHERE mw.deleted_at IS NULL
    AND (
      mw.privacy = 'public'
      OR mw.user_id = p_user_id
      OR (
        mw.privacy = 'followers' 
        AND EXISTS(
          SELECT 1 FROM axis6_social_graph sg 
          WHERE sg.follower_id = p_user_id 
            AND sg.following_id = mw.user_id
        )
      )
    )
    AND (p_axis IS NULL OR mw.axis_slug = p_axis)
    AND (
      p_feed_type = 'all'
      OR (p_feed_type = 'following' AND EXISTS(
        SELECT 1 FROM axis6_social_graph sg 
        WHERE sg.follower_id = p_user_id 
          AND sg.following_id = mw.user_id
      ))
      OR (p_feed_type = 'my' AND mw.user_id = p_user_id)
    )
  ORDER BY mw.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE axis6_daily_rituals ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_micro_wins ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_resonance_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_social_graph ENABLE ROW LEVEL SECURITY;
ALTER TABLE axis6_micro_reactions ENABLE ROW LEVEL SECURITY;

-- Daily rituals policies
CREATE POLICY "Users can view own rituals" ON axis6_daily_rituals
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create own rituals" ON axis6_daily_rituals
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own rituals" ON axis6_daily_rituals
  FOR UPDATE USING (user_id = auth.uid());

-- Micro wins policies
CREATE POLICY "View public micro wins" ON axis6_micro_wins
  FOR SELECT USING (
    privacy = 'public' 
    OR user_id = auth.uid()
    OR (privacy = 'followers' AND EXISTS(
      SELECT 1 FROM axis6_social_graph 
      WHERE follower_id = auth.uid() 
        AND following_id = axis6_micro_wins.user_id
    ))
  );

CREATE POLICY "Users can create own micro wins" ON axis6_micro_wins
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own micro wins" ON axis6_micro_wins
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete own micro wins" ON axis6_micro_wins
  FOR DELETE USING (user_id = auth.uid());

-- Resonance streaks policies  
CREATE POLICY "View own streaks" ON axis6_resonance_streaks
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Public leaderboard view" ON axis6_resonance_streaks
  FOR SELECT USING (streak_type IN ('daily', 'morning'));

-- Social graph policies
CREATE POLICY "View social connections" ON axis6_social_graph
  FOR SELECT USING (
    follower_id = auth.uid() 
    OR following_id = auth.uid()
  );

CREATE POLICY "Create own connections" ON axis6_social_graph
  FOR INSERT WITH CHECK (follower_id = auth.uid());

CREATE POLICY "Delete own connections" ON axis6_social_graph
  FOR DELETE USING (follower_id = auth.uid());

-- Micro reactions policies
CREATE POLICY "View all reactions" ON axis6_micro_reactions
  FOR SELECT USING (true);

CREATE POLICY "Create own reactions" ON axis6_micro_reactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Delete own reactions" ON axis6_micro_reactions
  FOR DELETE USING (user_id = auth.uid());

COMMIT;
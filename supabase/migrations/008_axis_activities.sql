-- Create axis activities table for custom actions/activities per axis
CREATE TABLE IF NOT EXISTS axis6_axis_activities (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES axis6_categories(id) ON DELETE CASCADE,
  activity_name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure unique activities per user and category
  UNIQUE(user_id, category_id, activity_name)
);

-- Create indexes for performance
CREATE INDEX idx_axis_activities_user_id ON axis6_axis_activities(user_id);
CREATE INDEX idx_axis_activities_category_id ON axis6_axis_activities(category_id);
CREATE INDEX idx_axis_activities_user_category ON axis6_axis_activities(user_id, category_id);
CREATE INDEX idx_axis_activities_active ON axis6_axis_activities(user_id, is_active) WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE axis6_axis_activities ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own activities
CREATE POLICY "Users can view own activities" ON axis6_axis_activities
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own activities
CREATE POLICY "Users can create own activities" ON axis6_axis_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own activities
CREATE POLICY "Users can update own activities" ON axis6_axis_activities
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own activities
CREATE POLICY "Users can delete own activities" ON axis6_axis_activities
  FOR DELETE USING (auth.uid() = user_id);

-- Add default activities for new users (function)
CREATE OR REPLACE FUNCTION create_default_activities_for_user(p_user_id UUID)
RETURNS void AS $$
BEGIN
  -- Physical activities
  INSERT INTO axis6_axis_activities (user_id, category_id, activity_name, description)
  SELECT p_user_id, id, activity_name, description
  FROM (
    VALUES 
      ('Go for a run', 'Running for cardiovascular health'),
      ('Do yoga', 'Stretching and flexibility exercises'),
      ('Strength training', 'Weight lifting or bodyweight exercises'),
      ('Take a walk', 'Light physical activity'),
      ('Play a sport', 'Engage in recreational sports')
  ) AS default_activities(activity_name, description)
  CROSS JOIN axis6_categories
  WHERE slug = 'physical'
  ON CONFLICT (user_id, category_id, activity_name) DO NOTHING;

  -- Mental activities
  INSERT INTO axis6_axis_activities (user_id, category_id, activity_name, description)
  SELECT p_user_id, id, activity_name, description
  FROM (
    VALUES 
      ('Read a book', 'Engage in focused reading'),
      ('Learn something new', 'Study or practice a new skill'),
      ('Solve puzzles', 'Brain training exercises'),
      ('Work on a project', 'Deep focused work'),
      ('Practice mindfulness', 'Mental clarity exercises')
  ) AS default_activities(activity_name, description)
  CROSS JOIN axis6_categories
  WHERE slug = 'mental'
  ON CONFLICT (user_id, category_id, activity_name) DO NOTHING;

  -- Emotional activities
  INSERT INTO axis6_axis_activities (user_id, category_id, activity_name, description)
  SELECT p_user_id, id, activity_name, description
  FROM (
    VALUES 
      ('Journal feelings', 'Write about emotions and experiences'),
      ('Practice gratitude', 'List things you are grateful for'),
      ('Talk to someone', 'Share feelings with a trusted person'),
      ('Self-care activity', 'Do something nurturing for yourself'),
      ('Emotional check-in', 'Assess and acknowledge current emotions')
  ) AS default_activities(activity_name, description)
  CROSS JOIN axis6_categories
  WHERE slug = 'emotional'
  ON CONFLICT (user_id, category_id, activity_name) DO NOTHING;

  -- Social activities
  INSERT INTO axis6_axis_activities (user_id, category_id, activity_name, description)
  SELECT p_user_id, id, activity_name, description
  FROM (
    VALUES 
      ('Call a friend', 'Connect with someone you care about'),
      ('Spend time with family', 'Quality time with family members'),
      ('Meet someone new', 'Expand your social circle'),
      ('Help someone', 'Act of service or kindness'),
      ('Attend social event', 'Participate in group activities')
  ) AS default_activities(activity_name, description)
  CROSS JOIN axis6_categories
  WHERE slug = 'social'
  ON CONFLICT (user_id, category_id, activity_name) DO NOTHING;

  -- Spiritual activities
  INSERT INTO axis6_axis_activities (user_id, category_id, activity_name, description)
  SELECT p_user_id, id, activity_name, description
  FROM (
    VALUES 
      ('Meditate', 'Practice meditation or contemplation'),
      ('Pray or reflect', 'Spiritual or philosophical reflection'),
      ('Connect with nature', 'Spend time outdoors mindfully'),
      ('Practice values', 'Act according to personal values'),
      ('Spiritual reading', 'Read spiritual or philosophical texts')
  ) AS default_activities(activity_name, description)
  CROSS JOIN axis6_categories
  WHERE slug = 'spiritual'
  ON CONFLICT (user_id, category_id, activity_name) DO NOTHING;

  -- Purpose activities
  INSERT INTO axis6_axis_activities (user_id, category_id, activity_name, description)
  SELECT p_user_id, id, activity_name, description
  FROM (
    VALUES 
      ('Work on goals', 'Progress toward personal goals'),
      ('Plan future', 'Strategic planning and vision setting'),
      ('Skill development', 'Improve professional skills'),
      ('Creative work', 'Engage in creative projects'),
      ('Contribute to cause', 'Volunteer or support a cause')
  ) AS default_activities(activity_name, description)
  CROSS JOIN axis6_categories
  WHERE slug = 'purpose'
  ON CONFLICT (user_id, category_id, activity_name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to add default activities when a new user profile is created
CREATE OR REPLACE FUNCTION trigger_create_default_activities()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_default_activities_for_user(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_created_add_activities
  AFTER INSERT ON axis6_profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_create_default_activities();

-- Add updated_at trigger
CREATE TRIGGER update_axis_activities_updated_at
  BEFORE UPDATE ON axis6_axis_activities
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
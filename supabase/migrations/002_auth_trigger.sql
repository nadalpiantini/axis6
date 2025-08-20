-- Trigger to auto-create AXIS6 profile on user signup
-- This ensures users get an AXIS6 profile when they sign up through any auth method

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.axis6_handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Only create profile if user doesn't have one
  INSERT INTO public.axis6_profiles (id, name, timezone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'America/Santo_Domingo')
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS axis6_on_auth_user_created ON auth.users;

-- Create trigger for new user signups
CREATE TRIGGER axis6_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.axis6_handle_new_user();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role;
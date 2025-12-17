-- =========================================================================================
-- SUPABASE DATABASE SCHEMA FOR COMMUTEWISE
-- PURPOSE: COMPLETE DATABASE STRUCTURE WITH ALL TABLES, POLICIES, INDEXES, AND TRIGGERS
-- INSTRUCTIONS: COPY AND PASTE THIS ENTIRE FILE INTO SUPABASE SQL EDITOR AND RUN
-- NOTE: This script is idempotent - safe to run multiple times with full fail-safes
-- =========================================================================================

-- ENABLE REQUIRED EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENABLE POSTGIS EXTENSION (OPTIONAL - FOR SPATIAL QUERIES)
-- If this fails, the script will continue with regular indexes
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS "postgis";
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'PostGIS extension not available, using regular indexes instead';
END $$;

-- =========================================================================================
-- DROP EXISTING POLICIES AND TRIGGERS (FOR CLEAN RECREATION)
-- ONLY DROP IF TABLES EXIST
-- =========================================================================================

-- DROP POLICIES (WITH TABLE EXISTENCE CHECK)
DO $$
BEGIN
  -- DROP USER_PROFILES POLICIES
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
    DROP POLICY IF EXISTS "Users can read own profile" ON public.user_profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
    DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
  END IF;
  
  -- DROP FAVORITES POLICIES
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'favorites') THEN
    DROP POLICY IF EXISTS "Users can read own favorites" ON public.favorites;
    DROP POLICY IF EXISTS "Users can insert own favorites" ON public.favorites;
    DROP POLICY IF EXISTS "Users can update own favorites" ON public.favorites;
    DROP POLICY IF EXISTS "Users can delete own favorites" ON public.favorites;
  END IF;
  
  -- DROP REPORTS POLICIES
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reports') THEN
    DROP POLICY IF EXISTS "Anyone can read reports" ON public.reports;
    DROP POLICY IF EXISTS "Authenticated users can insert reports" ON public.reports;
    DROP POLICY IF EXISTS "Users can delete own reports" ON public.reports;
  END IF;
  
  -- DROP TRIPS POLICIES
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trips') THEN
    DROP POLICY IF EXISTS "Users can read own trips" ON public.trips;
    DROP POLICY IF EXISTS "Users can insert own trips" ON public.trips;
    DROP POLICY IF EXISTS "Users can delete own trips" ON public.trips;
  END IF;
END $$;

-- DROP TRIGGERS (WITH TABLE EXISTENCE CHECK)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
    DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'favorites') THEN
    DROP TRIGGER IF EXISTS update_favorites_updated_at ON public.favorites;
  END IF;
END $$;

-- =========================================================================================
-- TABLE: USER PROFILES
-- PURPOSE: EXTENDS SUPABASE AUTH.USERS WITH DISPLAY NAME AND PROFILE DATA
-- =========================================================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ADD COLUMNS IF THEY DON'T EXIST (FOR EXISTING TABLES)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'display_name') THEN
      ALTER TABLE public.user_profiles ADD COLUMN display_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'created_at') THEN
      ALTER TABLE public.user_profiles ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'user_profiles' AND column_name = 'updated_at') THEN
      ALTER TABLE public.user_profiles ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
  END IF;
END $$;

-- ENABLE RLS (ROW LEVEL SECURITY) ON USER PROFILES
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- POLICIES: USER PROFILES
DO $$
BEGIN
  -- Check if policy exists using pg_policies (PostgreSQL 10+)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_profiles' 
    AND policyname = 'Users can read own profile'
  ) THEN
    CREATE POLICY "Users can read own profile"
      ON public.user_profiles
      FOR SELECT
      USING (auth.uid() = id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_profiles' 
    AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
      ON public.user_profiles
      FOR UPDATE
      USING (auth.uid() = id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'user_profiles' 
    AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile"
      ON public.user_profiles
      FOR INSERT
      WITH CHECK (auth.uid() = id);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- If pg_policies doesn't exist, create policies anyway (they will fail gracefully if already exist)
  BEGIN
    CREATE POLICY "Users can read own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
  EXCEPTION WHEN duplicate_object THEN NULL END;
  
  BEGIN
    CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);
  EXCEPTION WHEN duplicate_object THEN NULL END;
  
  BEGIN
    CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
  EXCEPTION WHEN duplicate_object THEN NULL END;
END $$;

-- =========================================================================================
-- TABLE: FAVORITES
-- PURPOSE: STORES USER'S FAVORITE LOCATIONS (HOME, WORK, ETC.)
-- =========================================================================================
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  type TEXT DEFAULT 'place' CHECK (type IN ('place', 'terminal', 'custom')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ADD COLUMNS IF THEY DON'T EXIST (FOR EXISTING TABLES)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'favorites') THEN
    -- Check if primary key exists, if not add id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE table_schema = 'public' AND table_name = 'favorites' AND constraint_type = 'PRIMARY KEY') THEN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                     WHERE table_schema = 'public' AND table_name = 'favorites' AND column_name = 'id') THEN
        ALTER TABLE public.favorites ADD COLUMN id UUID DEFAULT gen_random_uuid();
        ALTER TABLE public.favorites ADD PRIMARY KEY (id);
      END IF;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'favorites' AND column_name = 'address') THEN
      ALTER TABLE public.favorites ADD COLUMN address TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'favorites' AND column_name = 'type') THEN
      ALTER TABLE public.favorites ADD COLUMN type TEXT DEFAULT 'place';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'favorites' AND column_name = 'updated_at') THEN
      ALTER TABLE public.favorites ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
  END IF;
END $$;

-- ENABLE RLS ON FAVORITES
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- POLICIES: FAVORITES
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'favorites' AND policyname = 'Users can read own favorites'
  ) THEN
    CREATE POLICY "Users can read own favorites"
      ON public.favorites
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'favorites' AND policyname = 'Users can insert own favorites'
  ) THEN
    CREATE POLICY "Users can insert own favorites"
      ON public.favorites
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'favorites' AND policyname = 'Users can update own favorites'
  ) THEN
    CREATE POLICY "Users can update own favorites"
      ON public.favorites
      FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'favorites' AND policyname = 'Users can delete own favorites'
  ) THEN
    CREATE POLICY "Users can delete own favorites"
      ON public.favorites
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Fallback: create policies with exception handling
  BEGIN
    CREATE POLICY "Users can read own favorites" ON public.favorites FOR SELECT USING (auth.uid() = user_id);
  EXCEPTION WHEN duplicate_object THEN NULL END;
  
  BEGIN
    CREATE POLICY "Users can insert own favorites" ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
  EXCEPTION WHEN duplicate_object THEN NULL END;
  
  BEGIN
    CREATE POLICY "Users can update own favorites" ON public.favorites FOR UPDATE USING (auth.uid() = user_id);
  EXCEPTION WHEN duplicate_object THEN NULL END;
  
  BEGIN
    CREATE POLICY "Users can delete own favorites" ON public.favorites FOR DELETE USING (auth.uid() = user_id);
  EXCEPTION WHEN duplicate_object THEN NULL END;
END $$;

-- =========================================================================================
-- TABLE: REPORTS
-- PURPOSE: STORES COMMUNITY REPORTS (TRAFFIC, ACCIDENTS, INFO)
-- =========================================================================================
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('traffic', 'accident', 'info')),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- ADD COLUMNS IF THEY DON'T EXIST (FOR EXISTING TABLES)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reports') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'reports' AND column_name = 'id') THEN
      ALTER TABLE public.reports ADD COLUMN id UUID DEFAULT gen_random_uuid();
      ALTER TABLE public.reports ADD PRIMARY KEY (id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'reports' AND column_name = 'description') THEN
      ALTER TABLE public.reports ADD COLUMN description TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'reports' AND column_name = 'expires_at') THEN
      ALTER TABLE public.reports ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours');
    END IF;
  END IF;
END $$;

-- ENABLE RLS ON REPORTS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- POLICIES: REPORTS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'reports' AND policyname = 'Anyone can read reports'
  ) THEN
    CREATE POLICY "Anyone can read reports"
      ON public.reports
      FOR SELECT
      USING (expires_at IS NULL OR expires_at > NOW());
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'reports' AND policyname = 'Authenticated users can insert reports'
  ) THEN
    CREATE POLICY "Authenticated users can insert reports"
      ON public.reports
      FOR INSERT
      WITH CHECK (auth.uid() = user_id AND auth.role() = 'authenticated');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'reports' AND policyname = 'Users can delete own reports'
  ) THEN
    CREATE POLICY "Users can delete own reports"
      ON public.reports
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Fallback: create policies with exception handling
  BEGIN
    CREATE POLICY "Anyone can read reports" ON public.reports FOR SELECT USING (expires_at IS NULL OR expires_at > NOW());
  EXCEPTION WHEN duplicate_object THEN NULL END;
  
  BEGIN
    CREATE POLICY "Authenticated users can insert reports" ON public.reports FOR INSERT WITH CHECK (auth.uid() = user_id AND auth.role() = 'authenticated');
  EXCEPTION WHEN duplicate_object THEN NULL END;
  
  BEGIN
    CREATE POLICY "Users can delete own reports" ON public.reports FOR DELETE USING (auth.uid() = user_id);
  EXCEPTION WHEN duplicate_object THEN NULL END;
END $$;

-- =========================================================================================
-- TABLE: TRIPS
-- PURPOSE: STORES USER'S TRIP HISTORY WITH ROUTE DATA
-- =========================================================================================
CREATE TABLE IF NOT EXISTS public.trips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  origin_lat DOUBLE PRECISION NOT NULL,
  origin_lng DOUBLE PRECISION NOT NULL,
  origin_name TEXT,
  destination_lat DOUBLE PRECISION NOT NULL,
  destination_lng DOUBLE PRECISION NOT NULL,
  destination_name TEXT,
  route_data JSONB,
  total_fare DOUBLE PRECISION,
  total_duration_mins INTEGER,
  total_distance_km DOUBLE PRECISION,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ADD COLUMNS IF THEY DON'T EXIST (FOR EXISTING TABLES)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'trips') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'trips' AND column_name = 'id') THEN
      ALTER TABLE public.trips ADD COLUMN id UUID DEFAULT gen_random_uuid();
      ALTER TABLE public.trips ADD PRIMARY KEY (id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'trips' AND column_name = 'route_data') THEN
      ALTER TABLE public.trips ADD COLUMN route_data JSONB;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'trips' AND column_name = 'total_distance_km') THEN
      ALTER TABLE public.trips ADD COLUMN total_distance_km DOUBLE PRECISION;
    END IF;
  END IF;
END $$;

-- ENABLE RLS ON TRIPS
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- POLICIES: TRIPS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'trips' AND policyname = 'Users can read own trips'
  ) THEN
    CREATE POLICY "Users can read own trips"
      ON public.trips
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'trips' AND policyname = 'Users can insert own trips'
  ) THEN
    CREATE POLICY "Users can insert own trips"
      ON public.trips
      FOR INSERT
      WITH CHECK (auth.uid() = user_id AND auth.role() = 'authenticated');
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'trips' AND policyname = 'Users can delete own trips'
  ) THEN
    CREATE POLICY "Users can delete own trips"
      ON public.trips
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Fallback: create policies with exception handling
  BEGIN
    CREATE POLICY "Users can read own trips" ON public.trips FOR SELECT USING (auth.uid() = user_id);
  EXCEPTION WHEN duplicate_object THEN NULL END;
  
  BEGIN
    CREATE POLICY "Users can insert own trips" ON public.trips FOR INSERT WITH CHECK (auth.uid() = user_id AND auth.role() = 'authenticated');
  EXCEPTION WHEN duplicate_object THEN NULL END;
  
  BEGIN
    CREATE POLICY "Users can delete own trips" ON public.trips FOR DELETE USING (auth.uid() = user_id);
  EXCEPTION WHEN duplicate_object THEN NULL END;
END $$;

-- =========================================================================================
-- INDEXES FOR PERFORMANCE
-- =========================================================================================

-- INDEX ON FAVORITES USER_ID
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);

-- INDEX ON REPORTS LOCATION (USING POSTGIS FOR SPATIAL QUERIES OR REGULAR INDEX)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis') THEN
    -- Create PostGIS spatial index if extension is available
    DROP INDEX IF EXISTS idx_reports_location_spatial;
    CREATE INDEX idx_reports_location_spatial 
    ON public.reports USING GIST (ST_MakePoint(lng, lat));
  ELSE
    -- Create regular index on coordinates if PostGIS not available
    DROP INDEX IF EXISTS idx_reports_location;
    CREATE INDEX idx_reports_location 
    ON public.reports(lat, lng);
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Fallback to simple index if spatial index fails
  CREATE INDEX IF NOT EXISTS idx_reports_location 
  ON public.reports(lat, lng);
END $$;

-- INDEX ON REPORTS EXPIRY (FOR CLEANUP)
CREATE INDEX IF NOT EXISTS idx_reports_expires_at ON public.reports(expires_at);

-- INDEX ON REPORTS TYPE (FOR FILTERING)
CREATE INDEX IF NOT EXISTS idx_reports_type ON public.reports(type);

-- INDEX ON TRIPS USER_ID AND CREATED_AT (FOR SORTING)
CREATE INDEX IF NOT EXISTS idx_trips_user_created ON public.trips(user_id, created_at DESC);

-- =========================================================================================
-- FUNCTION: AUTO-UPDATE UPDATED_AT TIMESTAMP
-- PURPOSE: AUTOMATICALLY UPDATES UPDATED_AT COLUMN ON ROW UPDATE
-- =========================================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- TRIGGER: AUTO-UPDATE USER_PROFILES UPDATED_AT
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_profiles') THEN
    DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
    CREATE TRIGGER update_user_profiles_updated_at
      BEFORE UPDATE ON public.user_profiles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- TRIGGER: AUTO-UPDATE FAVORITES UPDATED_AT
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'favorites') THEN
    DROP TRIGGER IF EXISTS update_favorites_updated_at ON public.favorites;
    CREATE TRIGGER update_favorites_updated_at
      BEFORE UPDATE ON public.favorites
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- =========================================================================================
-- NOTES:
-- 1. RUN THIS SCRIPT IN SUPABASE SQL EDITOR (SQL Editor tab in Dashboard)
-- 2. ALL TABLES USE ROW LEVEL SECURITY (RLS) FOR SECURITY
-- 3. REPORTS EXPIRE AFTER 24 HOURS (YOU CAN ADJUST THIS)
-- 4. TRIPS STORE FULL ROUTE DATA AS JSONB FOR FLEXIBILITY
-- 5. ALL TIMESTAMPS USE TIME ZONE AWARE DATES
-- 6. THIS SCRIPT IS FULLY IDEMPOTENT - SAFE TO RUN MULTIPLE TIMES
-- 7. ALL DROP OPERATIONS CHECK FOR TABLE EXISTENCE FIRST
-- 8. ALL POLICY CREATIONS CHECK IF POLICY ALREADY EXISTS
-- =========================================================================================

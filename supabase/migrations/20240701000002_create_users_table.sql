-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name text,
    full_name text,
    email text,
    user_id uuid,
    token_identifier text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Users policies
DROP POLICY IF EXISTS "Users view policy" ON public.users;
CREATE POLICY "Users view policy" ON public.users
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users insert policy" ON public.users;
CREATE POLICY "Users insert policy" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users update policy" ON public.users;
CREATE POLICY "Users update policy" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Enable realtime
alter publication supabase_realtime add table users;

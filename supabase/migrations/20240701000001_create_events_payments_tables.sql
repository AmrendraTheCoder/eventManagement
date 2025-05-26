-- Create events table
CREATE TABLE IF NOT EXISTS public.events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    organizer_id uuid NOT NULL REFERENCES public.users(id),
    upi_id text NOT NULL,
    qr_code_url text,
    event_date timestamp with time zone NOT NULL,
    registration_deadline timestamp with time zone,
    max_participants integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    status text DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled'))
);

-- Create pricing_tiers table
CREATE TABLE IF NOT EXISTS public.pricing_tiers (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    name text NOT NULL,
    description text,
    price numeric NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id),
    pricing_tier_id uuid REFERENCES public.pricing_tiers(id),
    amount numeric NOT NULL,
    transaction_id text,
    upi_reference text,
    payment_screenshot_url text,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    verification_notes text,
    verified_by uuid REFERENCES public.users(id),
    verified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create participants table
CREATE TABLE IF NOT EXISTS public.participants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id),
    payment_id uuid REFERENCES public.payments(id),
    registration_date timestamp with time zone DEFAULT now(),
    status text DEFAULT 'registered' CHECK (status IN ('registered', 'confirmed', 'cancelled')),
    UNIQUE(event_id, user_id)
);

-- Add RLS policies
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;

-- Events policies
DROP POLICY IF EXISTS "Events view policy" ON public.events;
CREATE POLICY "Events view policy" ON public.events
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Events insert policy" ON public.events;
CREATE POLICY "Events insert policy" ON public.events
    FOR INSERT WITH CHECK (auth.uid() = organizer_id);

DROP POLICY IF EXISTS "Events update policy" ON public.events;
CREATE POLICY "Events update policy" ON public.events
    FOR UPDATE USING (auth.uid() = organizer_id);

DROP POLICY IF EXISTS "Events delete policy" ON public.events;
CREATE POLICY "Events delete policy" ON public.events
    FOR DELETE USING (auth.uid() = organizer_id);

-- Pricing tiers policies
DROP POLICY IF EXISTS "Pricing tiers view policy" ON public.pricing_tiers;
CREATE POLICY "Pricing tiers view policy" ON public.pricing_tiers
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Pricing tiers insert policy" ON public.pricing_tiers;
CREATE POLICY "Pricing tiers insert policy" ON public.pricing_tiers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.events
            WHERE events.id = pricing_tiers.event_id
            AND events.organizer_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Pricing tiers update policy" ON public.pricing_tiers;
CREATE POLICY "Pricing tiers update policy" ON public.pricing_tiers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.events
            WHERE events.id = pricing_tiers.event_id
            AND events.organizer_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Pricing tiers delete policy" ON public.pricing_tiers;
CREATE POLICY "Pricing tiers delete policy" ON public.pricing_tiers
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.events
            WHERE events.id = pricing_tiers.event_id
            AND events.organizer_id = auth.uid()
        )
    );

-- Payments policies
DROP POLICY IF EXISTS "Payments view policy" ON public.payments;
CREATE POLICY "Payments view policy" ON public.payments
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.events
            WHERE events.id = payments.event_id
            AND events.organizer_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Payments insert policy" ON public.payments;
CREATE POLICY "Payments insert policy" ON public.payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Payments update policy" ON public.payments;
CREATE POLICY "Payments update policy" ON public.payments
    FOR UPDATE USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.events
            WHERE events.id = payments.event_id
            AND events.organizer_id = auth.uid()
        )
    );

-- Participants policies
DROP POLICY IF EXISTS "Participants view policy" ON public.participants;
CREATE POLICY "Participants view policy" ON public.participants
    FOR SELECT USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.events
            WHERE events.id = participants.event_id
            AND events.organizer_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Participants insert policy" ON public.participants;
CREATE POLICY "Participants insert policy" ON public.participants
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Participants update policy" ON public.participants;
CREATE POLICY "Participants update policy" ON public.participants
    FOR UPDATE USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM public.events
            WHERE events.id = participants.event_id
            AND events.organizer_id = auth.uid()
        )
    );

-- Enable realtime for all tables
alter publication supabase_realtime add table events;
alter publication supabase_realtime add table pricing_tiers;
alter publication supabase_realtime add table payments;
alter publication supabase_realtime add table participants;
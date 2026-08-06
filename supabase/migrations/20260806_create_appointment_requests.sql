-- ============================================================
-- Emmaüs Connect — Create Appointment Requests Table
-- Creates appointment_requests table with RLS policies
-- Date: 2026-08-06
-- ============================================================

CREATE TABLE IF NOT EXISTS public.appointment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compagnon_id UUID REFERENCES public.compagnons(id) ON DELETE CASCADE NOT NULL,
  message TEXT,
  status VARCHAR(50) DEFAULT 'En attente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.appointment_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Viewers can insert and read their own requests
DO $$ BEGIN
  CREATE POLICY "Viewers can insert and read their own requests"
    ON public.appointment_requests
    FOR ALL
    TO authenticated
    USING (auth.uid() = (SELECT user_id FROM public.compagnons WHERE id = compagnon_id))
    WITH CHECK (auth.uid() = (SELECT user_id FROM public.compagnons WHERE id = compagnon_id));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Policy: Admins/Editors can read and update all requests
DO $$ BEGIN
  CREATE POLICY "Admins and Editors can read and update all requests"
    ON public.appointment_requests
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.roles r ON p.role_id = r.id
        WHERE p.id = auth.uid() AND r.name IN ('admin', 'user')
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.profiles p
        JOIN public.roles r ON p.role_id = r.id
        WHERE p.id = auth.uid() AND r.name IN ('admin', 'user')
      )
    );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

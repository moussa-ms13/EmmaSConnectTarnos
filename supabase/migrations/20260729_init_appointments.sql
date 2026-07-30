-- ============================================================
-- Emmaüs Connect — Initialize Appointments Module (Rendez-vous)
-- Creates appointments table with RLS policies
-- Date: 2026-07-29
-- ============================================================

CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  compagnon_id UUID REFERENCES public.compagnons(id) ON DELETE CASCADE NOT NULL,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  doctor_name VARCHAR(150),
  specialty VARCHAR(150) NOT NULL,
  location VARCHAR(255),
  is_urgent BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'Confirmé',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Authenticated users can access appointments"
    ON public.appointments FOR ALL TO authenticated
    USING (true) WITH CHECK (true);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Migration: Create password_reset_requests table for admin-driven ticketing workflow
CREATE TABLE IF NOT EXISTS public.password_reset_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'resolved'
  temp_password TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Allow anonymous or authenticated users to insert requests from login screen
CREATE POLICY "Allow public insert on password_reset_requests"
  ON public.password_reset_requests
  FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users (admin) to read all requests
CREATE POLICY "Allow authenticated read on password_reset_requests"
  ON public.password_reset_requests
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow authenticated users (admin) to update requests (resolve them)
CREATE POLICY "Allow authenticated update on password_reset_requests"
  ON public.password_reset_requests
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Allow authenticated users (admin) to delete requests
CREATE POLICY "Allow authenticated delete on password_reset_requests"
  ON public.password_reset_requests
  FOR DELETE
  USING (auth.role() = 'authenticated');

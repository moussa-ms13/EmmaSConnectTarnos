-- ============================================================
-- Emmaüs Connect — Create Tasks Table
-- Date: 2026-08-04
-- Description: Task management system for assigning tasks to
--              Compagnons. Admins/Editors manage all tasks;
--              Viewers/Compagnons see only their own tasks.
-- ============================================================

-- 1. CREATE TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT,
  status      VARCHAR(30) DEFAULT 'todo' NOT NULL
              CHECK (status IN ('todo', 'in_progress', 'done', 'cancelled')),
  priority    VARCHAR(20) DEFAULT 'medium' NOT NULL
              CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to UUID REFERENCES public.compagnons(id) ON DELETE SET NULL,
  created_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date    DATE,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by  ON public.tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_status       ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date     ON public.tasks(due_date);

-- 3. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 4. DROP EXISTING POLICIES SAFELY
DROP POLICY IF EXISTS "Admins and editors can manage all tasks" ON public.tasks;
DROP POLICY IF EXISTS "Viewers can read their own tasks"       ON public.tasks;
DROP POLICY IF EXISTS "Authenticated users can insert tasks"   ON public.tasks;
DROP POLICY IF EXISTS "Task owners can update their tasks"     ON public.tasks;

-- 5. POLICY: Admins/Editors (logged in as staff) — full access
--    We use the compagnons.role to determine viewer status.
--    If the user has NO compagnon row, they are staff → full access.
CREATE POLICY "Admins and editors can manage all tasks"
  ON public.tasks
  FOR ALL
  TO authenticated
  USING (
    NOT EXISTS (
      SELECT 1 FROM public.compagnons c
      WHERE c.user_id = auth.uid()
        AND lower(c.role) IN ('viewer', 'lecteur', 'read', 'compagnon')
    )
  )
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM public.compagnons c
      WHERE c.user_id = auth.uid()
        AND lower(c.role) IN ('viewer', 'lecteur', 'read', 'compagnon')
    )
  );

-- 6. POLICY: Viewers/Compagnons — can only read tasks assigned to them
CREATE POLICY "Viewers can read their own tasks"
  ON public.tasks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.compagnons c
      WHERE c.user_id = auth.uid()
        AND c.id = tasks.assigned_to
        AND lower(c.role) IN ('viewer', 'lecteur', 'read', 'compagnon')
    )
  );

-- 7. TRIGGER: auto-update updated_at on row change
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tasks_updated_at ON public.tasks;
CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

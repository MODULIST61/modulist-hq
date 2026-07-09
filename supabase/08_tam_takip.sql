-- ============================================================
-- MODULIST HQ — BÖLÜM 8: Tam takip (audit, yorumlar, metrikler)
-- HQ MODULİST projesinde SQL Editor'da çalıştır
-- ============================================================

-- Kampanya gösterim / erişim
ALTER TABLE public.hq_campaigns
  ADD COLUMN IF NOT EXISTS gosterim INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS erisim INTEGER NOT NULL DEFAULT 0;

-- Audit log — kim ne yaptı
CREATE TABLE IF NOT EXISTS public.hq_audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES public.hq_users(id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  entity_type TEXT,
  entity_id   TEXT,
  summary     TEXT NOT NULL,
  meta        JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hq_audit_log_created ON public.hq_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hq_audit_log_user ON public.hq_audit_log(user_id, created_at DESC);

-- Görev yorumları
CREATE TABLE IF NOT EXISTS public.hq_task_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id     UUID NOT NULL REFERENCES public.hq_tasks(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.hq_users(id) ON DELETE CASCADE,
  text        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hq_task_comments_task ON public.hq_task_comments(task_id, created_at);

-- Kullanıcı aktivite (giriş / son görülme)
CREATE TABLE IF NOT EXISTS public.hq_user_activity (
  user_id       UUID PRIMARY KEY REFERENCES public.hq_users(id) ON DELETE CASCADE,
  last_login_at TIMESTAMPTZ,
  last_seen_at  TIMESTAMPTZ,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS (geliştirme modu)
ALTER TABLE public.hq_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hq_task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hq_user_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "dev_all_hq_audit_log" ON public.hq_audit_log;
CREATE POLICY "dev_all_hq_audit_log" ON public.hq_audit_log FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "dev_all_hq_task_comments" ON public.hq_task_comments;
CREATE POLICY "dev_all_hq_task_comments" ON public.hq_task_comments FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "dev_all_hq_user_activity" ON public.hq_user_activity;
CREATE POLICY "dev_all_hq_user_activity" ON public.hq_user_activity FOR ALL USING (true) WITH CHECK (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.hq_audit_log;

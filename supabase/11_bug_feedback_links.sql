-- Bug ↔ Feedback bağlantıları + triage durumu
-- Supabase SQL Editor'da çalıştırın

ALTER TABLE public.hq_bugs
  ADD COLUMN IF NOT EXISTS feedback_id UUID REFERENCES public.hq_feedback(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS hub_durum TEXT DEFAULT 'triage';

ALTER TABLE public.hq_feedback
  ADD COLUMN IF NOT EXISTS bug_id UUID REFERENCES public.hq_bugs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_hq_bugs_hub_durum ON public.hq_bugs(hub_durum);
CREATE INDEX IF NOT EXISTS idx_hq_bugs_feedback ON public.hq_bugs(feedback_id);
CREATE INDEX IF NOT EXISTS idx_hq_feedback_bug ON public.hq_feedback(bug_id);

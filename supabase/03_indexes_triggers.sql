-- ============================================================
-- MODULIST HQ — BÖLÜM 3: Indexler & trigger'lar
-- Bölüm 2'den sonra çalıştır
-- ============================================================

-- Indexler
CREATE INDEX IF NOT EXISTS idx_hq_users_email ON public.hq_users(email);
CREATE INDEX IF NOT EXISTS idx_hq_users_status ON public.hq_users(status);

CREATE INDEX IF NOT EXISTS idx_hq_messages_room ON public.hq_messages(room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hq_messages_user ON public.hq_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_hq_messages_dm ON public.hq_messages(is_dm) WHERE is_dm = TRUE;

CREATE INDEX IF NOT EXISTS idx_hq_tasks_sorumlu ON public.hq_tasks(sorumlu_id);
CREATE INDEX IF NOT EXISTS idx_hq_tasks_durum ON public.hq_tasks(durum);

CREATE INDEX IF NOT EXISTS idx_hq_companies_pipeline ON public.hq_companies(pipeline);
CREATE INDEX IF NOT EXISTS idx_hq_companies_sorumlu ON public.hq_companies(sorumlu_id);

CREATE INDEX IF NOT EXISTS idx_hq_bugs_durum ON public.hq_bugs(durum);
CREATE INDEX IF NOT EXISTS idx_hq_finance_durum ON public.hq_finance(durum);
CREATE INDEX IF NOT EXISTS idx_hq_finance_tarih ON public.hq_finance(tarih DESC);

CREATE INDEX IF NOT EXISTS idx_hq_notifications_user ON public.hq_notifications(user_id, okundu, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_hq_dm_threads_last ON public.hq_dm_threads(last_message_at DESC);

-- updated_at trigger'ları
DROP TRIGGER IF EXISTS trg_hq_workspace_updated ON public.hq_workspace;
CREATE TRIGGER trg_hq_workspace_updated
  BEFORE UPDATE ON public.hq_workspace
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_hq_users_updated ON public.hq_users;
CREATE TRIGGER trg_hq_users_updated
  BEFORE UPDATE ON public.hq_users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_hq_tasks_updated ON public.hq_tasks;
CREATE TRIGGER trg_hq_tasks_updated
  BEFORE UPDATE ON public.hq_tasks
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_hq_companies_updated ON public.hq_companies;
CREATE TRIGGER trg_hq_companies_updated
  BEFORE UPDATE ON public.hq_companies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_hq_bugs_updated ON public.hq_bugs;
CREATE TRIGGER trg_hq_bugs_updated
  BEFORE UPDATE ON public.hq_bugs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_hq_campaigns_updated ON public.hq_campaigns;
CREATE TRIGGER trg_hq_campaigns_updated
  BEFORE UPDATE ON public.hq_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_hq_contents_updated ON public.hq_contents;
CREATE TRIGGER trg_hq_contents_updated
  BEFORE UPDATE ON public.hq_contents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_hq_finance_updated ON public.hq_finance;
CREATE TRIGGER trg_hq_finance_updated
  BEFORE UPDATE ON public.hq_finance
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_hq_feedback_updated ON public.hq_feedback;
CREATE TRIGGER trg_hq_feedback_updated
  BEFORE UPDATE ON public.hq_feedback
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- DM thread last_message_at güncelle
CREATE OR REPLACE FUNCTION public.hq_touch_dm_thread()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_dm = TRUE THEN
    UPDATE public.hq_dm_threads
    SET last_message_at = NEW.created_at
    WHERE id = NEW.room_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_hq_messages_dm_touch ON public.hq_messages;
CREATE TRIGGER trg_hq_messages_dm_touch
  AFTER INSERT ON public.hq_messages
  FOR EACH ROW EXECUTE FUNCTION public.hq_touch_dm_thread();

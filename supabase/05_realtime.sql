-- ============================================================
-- MODULIST HQ — BÖLÜM 5: Realtime (canlı mesaj & bildirim)
-- Bölüm 4'ten sonra çalıştır
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.hq_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hq_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hq_dm_threads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.hq_tasks;

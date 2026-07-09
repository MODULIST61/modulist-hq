-- ============================================================
-- MODULIST HQ — BÖLÜM 6: RLS (şimdilik GELİŞTİRME modu)
-- Frontend bağlanana kadar açık bırakıyoruz
-- Auth entegrasyonundan sonra sıkılaştırılacak
-- ============================================================

-- Tüm tablolarda RLS aç
ALTER TABLE public.hq_workspace      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hq_users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hq_rooms          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hq_dm_threads     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hq_messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hq_tasks          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hq_companies      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hq_bugs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hq_campaigns      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hq_contents       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hq_finance        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hq_feedback       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hq_daily_metrics  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hq_notifications  ENABLE ROW LEVEL SECURITY;

-- GEÇİCİ: anon + authenticated tam erişim (geliştirme)
-- ⚠️ Canlıya çıkmadan önce kaldırılacak!

CREATE POLICY "dev_all_hq_workspace"     ON public.hq_workspace     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all_hq_users"         ON public.hq_users         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all_hq_rooms"         ON public.hq_rooms         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all_hq_dm_threads"    ON public.hq_dm_threads    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all_hq_messages"      ON public.hq_messages      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all_hq_tasks"         ON public.hq_tasks         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all_hq_companies"     ON public.hq_companies     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all_hq_bugs"          ON public.hq_bugs          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all_hq_campaigns"     ON public.hq_campaigns     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all_hq_contents"      ON public.hq_contents      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all_hq_finance"       ON public.hq_finance       FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all_hq_feedback"      ON public.hq_feedback      FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all_hq_daily_metrics" ON public.hq_daily_metrics FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all_hq_notifications" ON public.hq_notifications  FOR ALL USING (true) WITH CHECK (true);

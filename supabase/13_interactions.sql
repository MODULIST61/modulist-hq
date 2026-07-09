-- Modulist HQ — Dış iletişim kayıtları (Sekreter merkezi)
-- Supabase SQL Editor'da çalıştırın

CREATE TABLE IF NOT EXISTS public.hq_interactions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tip                 TEXT NOT NULL DEFAULT 'telefon_giden',
  yon                 TEXT NOT NULL DEFAULT 'giden' CHECK (yon IN ('gelen', 'giden')),
  firma_id            UUID REFERENCES public.hq_companies(id) ON DELETE SET NULL,
  kisi_adi            TEXT,
  telefon             TEXT,
  konu                TEXT,
  ozet                TEXT,
  sonuc               TEXT DEFAULT 'bekliyor',
  talep_tipi          TEXT DEFAULT 'genel',
  durum               TEXT NOT NULL DEFAULT 'islemde' CHECK (durum IN ('inbox', 'islemde', 'tamamlandi')),
  takip_tarihi        TIMESTAMPTZ,
  takip_notu          TEXT,
  toplanti_tarihi     DATE,
  toplanti_saati      TEXT,
  lokasyon            TEXT,
  sorumlu_id          UUID REFERENCES public.hq_users(id) ON DELETE SET NULL,
  user_id             UUID REFERENCES public.hq_users(id) ON DELETE SET NULL,
  linked_task_id      UUID REFERENCES public.hq_tasks(id) ON DELETE SET NULL,
  linked_bug_id       UUID REFERENCES public.hq_bugs(id) ON DELETE SET NULL,
  linked_feedback_id  UUID REFERENCES public.hq_feedback(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hq_interactions_firma ON public.hq_interactions(firma_id);
CREATE INDEX IF NOT EXISTS idx_hq_interactions_durum ON public.hq_interactions(durum);
CREATE INDEX IF NOT EXISTS idx_hq_interactions_takip ON public.hq_interactions(takip_tarihi);
CREATE INDEX IF NOT EXISTS idx_hq_interactions_toplanti ON public.hq_interactions(toplanti_tarihi);

DROP TRIGGER IF EXISTS trg_hq_interactions_updated ON public.hq_interactions;
CREATE TRIGGER trg_hq_interactions_updated
  BEFORE UPDATE ON public.hq_interactions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.hq_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "dev_all_hq_interactions" ON public.hq_interactions FOR ALL USING (true) WITH CHECK (true);

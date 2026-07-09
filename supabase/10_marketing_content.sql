-- ============================================================
-- MODULIST HQ — BÖLÜM 10: İçerik stüdyosu alanları
-- ============================================================

ALTER TABLE public.hq_contents
  ADD COLUMN IF NOT EXISTS tip TEXT DEFAULT 'reels',
  ADD COLUMN IF NOT EXISTS platform TEXT DEFAULT 'instagram',
  ADD COLUMN IF NOT EXISTS senaryo TEXT,
  ADD COLUMN IF NOT EXISTS kampanya_id UUID REFERENCES public.hq_campaigns(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS goruntulenme INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS begeni INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS kaydetme INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dm_sayisi INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS yorum_sayisi INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lead_sayisi INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_uretim BOOLEAN NOT NULL DEFAULT false;

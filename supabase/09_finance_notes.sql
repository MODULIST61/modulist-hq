-- ============================================================
-- MODULIST HQ — BÖLÜM 9: Finans onay notu
-- 08'den sonra SQL Editor'da çalıştır
-- ============================================================

ALTER TABLE public.hq_finance
  ADD COLUMN IF NOT EXISTS onay_notu TEXT;

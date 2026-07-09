-- Modulist HQ — Muhasebe genişletme (tahsilat, dekont, fatura)
-- Supabase SQL Editor'da çalıştırın

ALTER TABLE public.hq_finance
  ADD COLUMN IF NOT EXISTS dekont_url TEXT,
  ADD COLUMN IF NOT EXISTS fatura_no TEXT,
  ADD COLUMN IF NOT EXISTS odeme_yontemi TEXT DEFAULT 'havale';

ALTER TABLE public.hq_companies
  ADD COLUMN IF NOT EXISTS son_odeme_tarihi DATE,
  ADD COLUMN IF NOT EXISTS dekont_url TEXT;

-- Dekont dosyaları için storage bucket (Dashboard > Storage'dan da oluşturabilirsiniz)
INSERT INTO storage.buckets (id, name, public)
VALUES ('hq-dekontlar', 'hq-dekontlar', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "dev_all_hq_dekontlar" ON storage.objects;
CREATE POLICY "dev_all_hq_dekontlar" ON storage.objects
  FOR ALL USING (bucket_id = 'hq-dekontlar') WITH CHECK (bucket_id = 'hq-dekontlar');

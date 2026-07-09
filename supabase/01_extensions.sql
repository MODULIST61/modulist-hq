-- ============================================================
-- MODULIST HQ — BÖLÜM 1: Extensions & yardımcı fonksiyonlar
-- Supabase SQL Editor → New query → yapıştır → RUN
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- updated_at otomatik güncelle
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

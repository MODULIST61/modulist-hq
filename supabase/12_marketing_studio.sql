-- Modulist Creative Studio — içerik prompt/brief alanları
-- Supabase SQL Editor'da çalıştırın

ALTER TABLE public.hq_contents
  ADD COLUMN IF NOT EXISTS ai_prompt TEXT,
  ADD COLUMN IF NOT EXISTS ai_video_prompt TEXT,
  ADD COLUMN IF NOT EXISTS ai_caption TEXT,
  ADD COLUMN IF NOT EXISTS ai_ad_copy TEXT,
  ADD COLUMN IF NOT EXISTS brief TEXT,
  ADD COLUMN IF NOT EXISTS referans_url TEXT,
  ADD COLUMN IF NOT EXISTS ton TEXT DEFAULT 'egitici';

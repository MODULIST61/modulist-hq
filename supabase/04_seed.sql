-- ============================================================
-- MODULIST HQ — BÖLÜM 4: Seed (odalar + workspace)
-- Bölüm 3'ten sonra çalıştır
-- Patron kullanıcısı kurulum ekranından oluşturulacak
-- ============================================================

INSERT INTO public.hq_workspace (id, initialized, settings)
VALUES (1, FALSE, '{
  "darkMode": false,
  "activeCustomerCount": 0,
  "estimatedMrr": 0,
  "performanceGoals": { "calls": 50, "demos": 10, "tasks": 15, "score": 70 }
}'::jsonb)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.hq_rooms (id, slug, name, description) VALUES
  ('genel',      'genel',      'Genel',      'Tüm ekip'),
  ('urun',       'urun',       'Ürün',       'Yazılım ve ürün'),
  ('satis',      'satis',      'Satış',      'Satış koordinasyonu'),
  ('buyume',     'buyume',     'Büyüme',     'Pazarlama ve büyüme'),
  ('finans',     'finans',     'Finans',     'Finans (patron)'),
  ('operasyon',  'operasyon',  'Operasyon',  'Operasyon ve sekreterya')
ON CONFLICT (id) DO NOTHING;

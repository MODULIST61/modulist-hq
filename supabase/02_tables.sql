-- ============================================================
-- MODULIST HQ — BÖLÜM 2: Tablolar
-- Bölüm 1'den sonra çalıştır
-- ============================================================

-- Workspace ayarları (tek satır)
CREATE TABLE IF NOT EXISTS public.hq_workspace (
  id              SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  initialized     BOOLEAN NOT NULL DEFAULT FALSE,
  settings        JSONB NOT NULL DEFAULT '{
    "darkMode": false,
    "activeCustomerCount": 0,
    "estimatedMrr": 0,
    "performanceGoals": { "calls": 50, "demos": 10, "tasks": 15, "score": 70 }
  }'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Kullanıcılar (patron + ekip)
CREATE TABLE IF NOT EXISTS public.hq_users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('patron', 'member')),
  job_title       TEXT,
  permissions     JSONB NOT NULL DEFAULT '{
    "pages": {},
    "rooms": {},
    "actions": {}
  }'::jsonb,
  status          TEXT NOT NULL DEFAULT 'aktif' CHECK (status IN ('aktif', 'pasif')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Mesaj odaları
CREATE TABLE IF NOT EXISTS public.hq_rooms (
  id              TEXT PRIMARY KEY,
  slug            TEXT NOT NULL UNIQUE,
  name            TEXT NOT NULL,
  description     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- DM thread'leri
CREATE TABLE IF NOT EXISTS public.hq_dm_threads (
  id              TEXT PRIMARY KEY,
  participants    UUID[] NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Mesajlar (oda + DM)
CREATE TABLE IF NOT EXISTS public.hq_messages (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id             TEXT NOT NULL,
  user_id             UUID NOT NULL REFERENCES public.hq_users(id) ON DELETE CASCADE,
  text                TEXT NOT NULL,
  type                TEXT NOT NULL DEFAULT 'normal' CHECK (type IN ('normal', 'duyuru', 'karar', 'gorev')),
  mentions            UUID[] NOT NULL DEFAULT '{}',
  pinned              BOOLEAN NOT NULL DEFAULT FALSE,
  reply_to_id         UUID REFERENCES public.hq_messages(id) ON DELETE SET NULL,
  attachments         JSONB NOT NULL DEFAULT '[]',
  linked_record_type  TEXT,
  linked_record_id    UUID,
  is_dm               BOOLEAN NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Görevler
CREATE TABLE IF NOT EXISTS public.hq_tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  baslik          TEXT NOT NULL,
  aciklama        TEXT,
  sorumlu_id      UUID REFERENCES public.hq_users(id) ON DELETE SET NULL,
  olusturan_id    UUID REFERENCES public.hq_users(id) ON DELETE SET NULL,
  durum           TEXT NOT NULL DEFAULT 'yapilacak' CHECK (durum IN ('yapilacak', 'devam', 'tamamlandi', 'iptal')),
  oncelik         TEXT NOT NULL DEFAULT 'normal' CHECK (oncelik IN ('dusuk', 'normal', 'yuksek', 'acil')),
  bitis_tarihi    DATE,
  room_id         TEXT,
  kayit_tipi      TEXT,
  kayit_id        UUID,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Firmalar (satış pipeline)
CREATE TABLE IF NOT EXISTS public.hq_companies (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad                    TEXT NOT NULL,
  sektor                TEXT NOT NULL DEFAULT 'emlak',
  yetkili               TEXT,
  telefon               TEXT,
  email                 TEXT,
  kaynak                TEXT DEFAULT 'soguk',
  sorumlu_id            UUID REFERENCES public.hq_users(id) ON DELETE SET NULL,
  pipeline              TEXT NOT NULL DEFAULT 'lead' CHECK (pipeline IN (
    'lead', 'temas', 'demo', 'trial', 'odeme_bekliyor', 'musteri', 'kayip'
  )),
  demo_tarihi           DATE,
  demo_saati            TEXT,
  trial_baslangic       DATE,
  trial_bitis           DATE,
  paket                 TEXT DEFAULT 'baslangic',
  aylik_tutar           NUMERIC(12,2) NOT NULL DEFAULT 0,
  dekont_durumu         TEXT DEFAULT 'yok',
  modulist_tenant_acildi BOOLEAN NOT NULL DEFAULT FALSE,
  modulist_email        TEXT,
  kayip_nedeni          TEXT,
  notlar                TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bug'lar
CREATE TABLE IF NOT EXISTS public.hq_bugs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  baslik              TEXT NOT NULL,
  aciklama            TEXT,
  kaynak              TEXT DEFAULT 'musteri',
  sektor              TEXT DEFAULT 'genel',
  oncelik             TEXT NOT NULL DEFAULT 'normal' CHECK (oncelik IN ('dusuk', 'normal', 'yuksek', 'kritik')),
  durum               TEXT NOT NULL DEFAULT 'acik' CHECK (durum IN ('acik', 'devam', 'test', 'kapali')),
  modulist_referans   TEXT,
  sorumlu_id          UUID REFERENCES public.hq_users(id) ON DELETE SET NULL,
  bildiren_id         UUID REFERENCES public.hq_users(id) ON DELETE SET NULL,
  iliskili_firma_id   UUID REFERENCES public.hq_companies(id) ON DELETE SET NULL,
  cozum_notu          TEXT,
  musteri_bildirildi  BOOLEAN NOT NULL DEFAULT FALSE,
  kapanis_tarihi      DATE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reklam kampanyaları
CREATE TABLE IF NOT EXISTS public.hq_campaigns (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad                TEXT NOT NULL,
  kanal             TEXT,
  donem_baslangic   DATE,
  donem_bitis       DATE,
  butce_plan        NUMERIC(12,2) NOT NULL DEFAULT 0,
  butce_harcanan    NUMERIC(12,2) NOT NULL DEFAULT 0,
  tiklama           INTEGER NOT NULL DEFAULT 0,
  kayit_sayisi      INTEGER NOT NULL DEFAULT 0,
  notlar            TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- İçerik (reels vb.)
CREATE TABLE IF NOT EXISTS public.hq_contents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  baslik          TEXT NOT NULL,
  hook            TEXT,
  sektor          TEXT DEFAULT 'emlak',
  durum           TEXT DEFAULT 'fikir',
  yayin_tarihi    DATE,
  notlar          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Finans hareketleri
CREATE TABLE IF NOT EXISTS public.hq_finance (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tip               TEXT NOT NULL CHECK (tip IN ('gelir', 'gider')),
  kategori          TEXT NOT NULL DEFAULT 'diger',
  tutar             NUMERIC(12,2) NOT NULL,
  firma_id          UUID REFERENCES public.hq_companies(id) ON DELETE SET NULL,
  firma_adi         TEXT,
  kampanya_id       UUID REFERENCES public.hq_campaigns(id) ON DELETE SET NULL,
  tarih             DATE NOT NULL,
  aciklama          TEXT,
  dekont_dosya_adi  TEXT,
  durum             TEXT NOT NULL DEFAULT 'onaylandi' CHECK (durum IN ('bekliyor', 'onaylandi', 'reddedildi')),
  giren_id          UUID REFERENCES public.hq_users(id) ON DELETE SET NULL,
  onaylayan_id      UUID REFERENCES public.hq_users(id) ON DELETE SET NULL,
  onay_tarihi       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Müşteri geri dönüşleri
CREATE TABLE IF NOT EXISTS public.hq_feedback (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tip             TEXT NOT NULL CHECK (tip IN ('sikayet', 'oneri', 'olumlu', 'soru')),
  metin           TEXT NOT NULL,
  firma_id        UUID REFERENCES public.hq_companies(id) ON DELETE SET NULL,
  kaynak          TEXT DEFAULT 'telefon',
  durum           TEXT NOT NULL DEFAULT 'yeni' CHECK (durum IN ('yeni', 'inceleniyor', 'cozuldu')),
  sorumlu_id      UUID REFERENCES public.hq_users(id) ON DELETE SET NULL,
  user_id         UUID REFERENCES public.hq_users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Günlük satış metrikleri
CREATE TABLE IF NOT EXISTS public.hq_daily_metrics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.hq_users(id) ON DELETE CASCADE,
  tarih           DATE NOT NULL,
  arama_sayisi    INTEGER NOT NULL DEFAULT 0,
  ulasilan        INTEGER NOT NULL DEFAULT 0,
  demo_ayarlanan  INTEGER NOT NULL DEFAULT 0,
  takip_aramasi   INTEGER NOT NULL DEFAULT 0,
  notlar          TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, tarih)
);

-- Bildirimler
CREATE TABLE IF NOT EXISTS public.hq_notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.hq_users(id) ON DELETE CASCADE,
  tip         TEXT NOT NULL,
  ref         JSONB NOT NULL DEFAULT '{}',
  okundu      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

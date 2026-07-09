-- ============================================================
-- MODULIST HQ — BÖLÜM 7: Yardımcı fonksiyonlar (login & kurulum)
-- Bölüm 6'dan sonra çalıştır
-- ============================================================

-- Patron kurulumu (ilk kullanıcı)
CREATE OR REPLACE FUNCTION public.hq_setup_patron(
  p_name TEXT,
  p_email TEXT,
  p_password TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_initialized BOOLEAN;
BEGIN
  SELECT initialized INTO v_initialized FROM hq_workspace WHERE id = 1;
  IF v_initialized = TRUE THEN
    RAISE EXCEPTION 'Workspace zaten kurulmuş';
  END IF;

  IF EXISTS (SELECT 1 FROM hq_users) THEN
    RAISE EXCEPTION 'Kullanıcı zaten var';
  END IF;

  INSERT INTO hq_users (name, email, password_hash, role, job_title, permissions, status)
  VALUES (
    TRIM(p_name),
    LOWER(TRIM(p_email)),
    crypt(p_password, gen_salt('bf')),
    'patron',
    'Patron',
    '{"pages":{},"rooms":{},"actions":{}}'::jsonb,
    'aktif'
  )
  RETURNING id INTO v_user_id;

  INSERT INTO hq_messages (room_id, user_id, text, type, pinned)
  VALUES (
    'genel',
    v_user_id,
    'Modulist HQ aktif. İş konuşmaları buradan yürütülecek.',
    'duyuru',
    TRUE
  );

  UPDATE hq_workspace SET initialized = TRUE WHERE id = 1;

  RETURN v_user_id;
END;
$$;

-- Login doğrulama
CREATE OR REPLACE FUNCTION public.hq_login(
  p_email TEXT,
  p_password TEXT
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT,
  role TEXT,
  job_title TEXT,
  permissions JSONB,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.name,
    u.email,
    u.role,
    u.job_title,
    u.permissions,
    u.status
  FROM hq_users u
  WHERE u.email = LOWER(TRIM(p_email))
    AND u.status = 'aktif'
    AND u.password_hash = crypt(p_password, u.password_hash);
END;
$$;

-- Ekip üyesi ekle (patron çağırır)
CREATE OR REPLACE FUNCTION public.hq_add_member(
  p_name TEXT,
  p_email TEXT,
  p_password TEXT,
  p_job_title TEXT,
  p_permissions JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id UUID;
  v_perms JSONB;
BEGIN
  v_perms := COALESCE(p_permissions, '{
    "pages": {"today":true,"messages":true,"tasks":true,"records":true,"calendar":true,"settings":true},
    "rooms": {"genel":"write","operasyon":"write"},
    "actions": {"manageRecords":true}
  }'::jsonb);

  INSERT INTO hq_users (name, email, password_hash, role, job_title, permissions, status)
  VALUES (
    TRIM(p_name),
    LOWER(TRIM(p_email)),
    crypt(p_password, gen_salt('bf')),
    'member',
    TRIM(p_job_title),
    v_perms,
    'aktif'
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- Şifre sıfırla
CREATE OR REPLACE FUNCTION public.hq_reset_password(
  p_user_id UUID,
  p_new_password TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE hq_users
  SET password_hash = crypt(p_new_password, gen_salt('bf'))
  WHERE id = p_user_id;
END;
$$;

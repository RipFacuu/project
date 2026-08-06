-- =============================================================================
-- MIGRACIÓN: Eliminar autenticación y permisos de usuario
-- Para que el panel funcione SIN LOGIN
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run
-- =============================================================================

-- 1) Modificar la columna user_id para que acepte NULL (ya no necesita auth.users)
ALTER TABLE public.qr_codes ALTER COLUMN user_id DROP NOT NULL;

-- 2) Quitar la FK a auth.users (ya que si no hay auth, la referencia no sirve)
ALTER TABLE public.qr_codes DROP CONSTRAINT IF EXISTS qr_codes_user_id_fkey;

-- 3) Quitar la restricción UNIQUE (user_id, dni) y crear UNIQUE(dni)
ALTER TABLE public.qr_codes DROP CONSTRAINT IF EXISTS qr_codes_user_dni_unique;
CREATE UNIQUE INDEX IF NOT EXISTS qr_codes_dni_unique ON public.qr_codes (dni);

-- 4) DESHABILITAR Row Level Security (sin login no hay usuario para filtrar)
ALTER TABLE public.qr_codes DISABLE ROW LEVEL SECURITY;

-- 5) Eliminar policies antiguas (por las dudas)
DROP POLICY IF EXISTS "Public can view QR codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Users can insert own QR codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Users can update own QR codes" ON public.qr_codes;
DROP POLICY IF EXISTS "Users can delete own QR codes" ON public.qr_codes;

-- 6) Dar todos los permisos para anon (el rol que usa el navegador sin login)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.qr_codes TO anon;

-- (Opcional) Si querés mantener authenticated también
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.qr_codes TO authenticated;

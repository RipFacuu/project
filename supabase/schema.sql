-- =============================================================================
-- Esquema completo para el proyecto QR
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → Run
-- =============================================================================

-- Extensión para UUIDs (ya suele estar habilitada en Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- Tabla principal: qr_codes
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  dni TEXT NOT NULL,
  description TEXT,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Un DNI no puede repetirse para el mismo usuario
  CONSTRAINT qr_codes_user_dni_unique UNIQUE (user_id, dni)
);

-- Índices para consultas frecuentes del dashboard
CREATE INDEX IF NOT EXISTS idx_qr_codes_user_id ON public.qr_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_created_at ON public.qr_codes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_qr_codes_category ON public.qr_codes(category);
CREATE INDEX IF NOT EXISTS idx_qr_codes_user_category ON public.qr_codes(user_id, category);
CREATE INDEX IF NOT EXISTS idx_qr_codes_dni ON public.qr_codes(dni);

-- -----------------------------------------------------------------------------
-- Row Level Security (RLS)
-- -----------------------------------------------------------------------------
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;

-- Lectura pública: necesaria para /scan/:id sin login (PublicScan → ScanView)
DROP POLICY IF EXISTS "Public can view QR codes" ON public.qr_codes;
CREATE POLICY "Public can view QR codes"
  ON public.qr_codes
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Insert: solo el usuario autenticado puede crear QRs a su nombre
DROP POLICY IF EXISTS "Users can insert own QR codes" ON public.qr_codes;
CREATE POLICY "Users can insert own QR codes"
  ON public.qr_codes
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Update: solo sus propios registros
DROP POLICY IF EXISTS "Users can update own QR codes" ON public.qr_codes;
CREATE POLICY "Users can update own QR codes"
  ON public.qr_codes
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Delete: solo sus propios registros
DROP POLICY IF EXISTS "Users can delete own QR codes" ON public.qr_codes;
CREATE POLICY "Users can delete own QR codes"
  ON public.qr_codes
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Permisos para roles de Supabase
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.qr_codes TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.qr_codes TO authenticated;

-- -----------------------------------------------------------------------------
-- Verificación (opcional — descomentar para comprobar)
-- -----------------------------------------------------------------------------
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'qr_codes'
-- ORDER BY ordinal_position;

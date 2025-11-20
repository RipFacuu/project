-- Script SQL para agregar la columna 'category' a la tabla qr_codes
-- Ejecuta este script en Supabase SQL Editor si la columna no existe

-- Agregar columna category si no existe
ALTER TABLE qr_codes 
ADD COLUMN IF NOT EXISTS category TEXT;

-- Crear índice para mejorar el rendimiento al filtrar por categoría
CREATE INDEX IF NOT EXISTS idx_qr_codes_category ON qr_codes(category);

-- Crear índice compuesto para mejorar las consultas por usuario y categoría
CREATE INDEX IF NOT EXISTS idx_qr_codes_user_category ON qr_codes(user_id, category);

-- Verificar que la columna se agregó correctamente
-- SELECT column_name, data_type FROM information_schema.columns 
-- WHERE table_name = 'qr_codes' AND column_name = 'category';


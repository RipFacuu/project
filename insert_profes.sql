-- Script SQL para insertar los códigos QR de los profes y staff
-- Este script inserta automáticamente para el primer usuario encontrado en auth.users
-- Si quieres insertar para un usuario específico, descomenta la línea del email abajo

-- OPCIÓN 1: Insertar para el primer usuario (automático)
-- Simplemente ejecuta este bloque completo

INSERT INTO qr_codes (user_id, first_name, last_name, dni, description, created_at)
SELECT 
  (SELECT id FROM auth.users ORDER BY created_at DESC LIMIT 1) as user_id,
  first_name,
  last_name,
  dni,
  description,
  NOW() as created_at
FROM (VALUES
  ('Luana', 'Sardot', '43372211', 'Club las Palmas - Listado Profes y Staff'),
  ('Lucia', 'Pesce', '46587402', 'Club las Palmas - Listado Profes y Staff'),
  ('Juan', 'Vannucci', '44896331', 'Club las Palmas - Listado Profes y Staff'),
  ('Ezequiel', 'Aliendo', '39621814', 'Club las Palmas - Listado Profes y Staff'),
  ('Santiago', 'Paniagua', '46309824', 'Club las Palmas - Listado Profes y Staff'),
  ('Brenda', 'Argañaraz', '39936843', 'Club las Palmas - Listado Profes y Staff'),
  ('Ignacio', 'Monasterolo', '44219095', 'Club las Palmas - Listado Profes y Staff'),
  ('Diego', 'Díaz', '41962688', 'Club las Palmas - Listado Profes y Staff'),
  ('Gonzalo', 'Candela', '44341707', 'Club las Palmas - Listado Profes y Staff'),
  ('Jenifer', 'Ugarte', '42315920', 'Club las Palmas - Listado Profes y Staff'),
  ('Juan Cruz', 'Cabrera', '44774745', 'Club las Palmas - Listado Profes y Staff'),
  ('Constanza', 'Acevedo', '43284783', 'Club las Palmas - Listado Profes y Staff'),
  ('Federica', 'Bustos', '39690730', 'Club las Palmas - Listado Profes y Staff'),
  ('Pablo', 'Mansilla', '29204709', 'Club las Palmas - Listado Profes y Staff'),
  ('Manuel', 'Flamini', '44972158', 'Club las Palmas - Listado Profes y Staff'),
  ('Ángel Ariel', 'Flores Ponce', '43561256', 'Club las Palmas - Listado Profes y Staff'),
  ('Jeremías Ezequiel', 'Cadelago', '42799505', 'Club las Palmas - Listado Profes y Staff'),
  ('Ivana V', 'Sponers', '30971550', 'Club las Palmas - Listado Profes y Staff')
) AS profes(first_name, last_name, dni, description);

-- Verificar que se insertaron correctamente
-- SELECT COUNT(*) as total_insertados FROM qr_codes WHERE description = 'Club las Palmas - Listado Profes y Staff';

-- ============================================================================
-- OPCIÓN 2: Si quieres insertar para un usuario específico por email,
-- descomenta este bloque y reemplaza 'tu-email@ejemplo.com' con tu email:
-- ============================================================================

/*
INSERT INTO qr_codes (user_id, first_name, last_name, dni, description, created_at)
SELECT 
  (SELECT id FROM auth.users WHERE email = 'tu-email@ejemplo.com' LIMIT 1) as user_id,
  first_name,
  last_name,
  dni,
  description,
  NOW() as created_at
FROM (VALUES
  ('Luana', 'Sardot', '43372211', 'Club las Palmas - Listado Profes y Staff'),
  ('Lucia', 'Pesce', '46587402', 'Club las Palmas - Listado Profes y Staff'),
  ('Juan', 'Vannucci', '44896331', 'Club las Palmas - Listado Profes y Staff'),
  ('Ezequiel', 'Aliendo', '39621814', 'Club las Palmas - Listado Profes y Staff'),
  ('Santiago', 'Paniagua', '46309824', 'Club las Palmas - Listado Profes y Staff'),
  ('Brenda', 'Argañaraz', '39936843', 'Club las Palmas - Listado Profes y Staff'),
  ('Ignacio', 'Monasterolo', '44219095', 'Club las Palmas - Listado Profes y Staff'),
  ('Diego', 'Díaz', '41962688', 'Club las Palmas - Listado Profes y Staff'),
  ('Gonzalo', 'Candela', '44341707', 'Club las Palmas - Listado Profes y Staff'),
  ('Jenifer', 'Ugarte', '42315920', 'Club las Palmas - Listado Profes y Staff'),
  ('Juan Cruz', 'Cabrera', '44774745', 'Club las Palmas - Listado Profes y Staff'),
  ('Constanza', 'Acevedo', '43284783', 'Club las Palmas - Listado Profes y Staff'),
  ('Federica', 'Bustos', '39690730', 'Club las Palmas - Listado Profes y Staff'),
  ('Pablo', 'Mansilla', '29204709', 'Club las Palmas - Listado Profes y Staff'),
  ('Manuel', 'Flamini', '44972158', 'Club las Palmas - Listado Profes y Staff'),
  ('Ángel Ariel', 'Flores Ponce', '43561256', 'Club las Palmas - Listado Profes y Staff'),
  ('Jeremías Ezequiel', 'Cadelago', '42799505', 'Club las Palmas - Listado Profes y Staff'),
  ('Ivana V', 'Sponers', '30971550', 'Club las Palmas - Listado Profes y Staff')
) AS profes(first_name, last_name, dni, description);
*/

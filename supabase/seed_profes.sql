-- =============================================================================
-- Datos iniciales: Profes y Staff del Club las Palmas
-- IMPORTANTE: Creá primero tu usuario admin desde la app (/login → Registrarse)
--             y luego ejecutá este script.
-- =============================================================================

-- Insertar para un usuario específico por email (reemplazá el email):
INSERT INTO public.qr_codes (user_id, first_name, last_name, dni, description, category, created_at)
SELECT
  u.id AS user_id,
  p.first_name,
  p.last_name,
  p.dni,
  p.description,
  p.category,
  NOW() AS created_at
FROM auth.users u
CROSS JOIN (VALUES
  ('Luana', 'Sardot', '43372211', 'Club las Palmas - Listado Profes y Staff', 'Club las Palmas'),
  ('Lucia', 'Pesce', '46587402', 'Club las Palmas - Listado Profes y Staff', 'Club las Palmas'),
  ('Juan', 'Vannucci', '44896331', 'Club las Palmas - Listado Profes y Staff', 'Club las Palmas'),
  ('Ezequiel', 'Aliendo', '39621814', 'Club las Palmas - Listado Profes y Staff', 'Club las Palmas'),
  ('Santiago', 'Paniagua', '46309824', 'Club las Palmas - Listado Profes y Staff', 'Club las Palmas'),
  ('Brenda', 'Argañaraz', '39936843', 'Club las Palmas - Listado Profes y Staff', 'Club las Palmas'),
  ('Ignacio', 'Monasterolo', '44219095', 'Club las Palmas - Listado Profes y Staff', 'Club las Palmas'),
  ('Diego', 'Díaz', '41962688', 'Club las Palmas - Listado Profes y Staff', 'Club las Palmas'),
  ('Gonzalo', 'Candela', '44341707', 'Club las Palmas - Listado Profes y Staff', 'Club las Palmas'),
  ('Jenifer', 'Ugarte', '42315920', 'Club las Palmas - Listado Profes y Staff', 'Club las Palmas'),
  ('Juan Cruz', 'Cabrera', '44774745', 'Club las Palmas - Listado Profes y Staff', 'Club las Palmas'),
  ('Constanza', 'Acevedo', '43284783', 'Club las Palmas - Listado Profes y Staff', 'Club las Palmas'),
  ('Federica', 'Bustos', '39690730', 'Club las Palmas - Listado Profes y Staff', 'Club las Palmas'),
  ('Pablo', 'Mansilla', '29204709', 'Club las Palmas - Listado Profes y Staff', 'Club las Palmas'),
  ('Manuel', 'Flamini', '44972158', 'Club las Palmas - Listado Profes y Staff', 'Club las Palmas'),
  ('Ángel Ariel', 'Flores Ponce', '43561256', 'Club las Palmas - Listado Profes y Staff', 'Club las Palmas'),
  ('Jeremías Ezequiel', 'Cadelago', '42799505', 'Club las Palmas - Listado Profes y Staff', 'Club las Palmas'),
  ('Ivana V', 'Sponers', '30971550', 'Club las Palmas - Listado Profes y Staff', 'Club las Palmas')
) AS p(first_name, last_name, dni, description, category)
WHERE u.email = 'tu-email@ejemplo.com'
ON CONFLICT (user_id, dni) DO NOTHING;

-- Verificar inserción:
-- SELECT COUNT(*) FROM public.qr_codes WHERE category = 'Club las Palmas';

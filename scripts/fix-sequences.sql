-- 🔧 FIX POSTGRESQL SEQUENCES
-- ══════════════════════════════════════════════════════════════
-- PROBLEMA: duplicate key value violates unique constraint
-- CAUSA: Las secuencias están desincronizadas con los MAX(id)
-- SOLUCIÓN: Resetear cada secuencia al MAX(id) actual + 1
-- ══════════════════════════════════════════════════════════════

-- 1️⃣ comentarios_reporte (id actual: 2)
SELECT setval('comentarios_reporte_id_seq', COALESCE((SELECT MAX(id) FROM comentarios_reporte), 0) + 1, false);

-- 2️⃣ modo_mantenimiento (id actual: 1)
SELECT setval('modo_mantenimiento_id_seq', COALESCE((SELECT MAX(id) FROM modo_mantenimiento), 0) + 1, false);

-- 3️⃣ reportes
SELECT setval('reportes_id_seq', COALESCE((SELECT MAX(id) FROM reportes), 0) + 1, false);

-- 4️⃣ usuarios
SELECT setval('usuarios_id_seq', COALESCE((SELECT MAX(id) FROM usuarios), 0) + 1, false);

-- 5️⃣ presentaciones
SELECT setval('presentaciones_id_seq', COALESCE((SELECT MAX(id) FROM presentaciones), 0) + 1, false);

-- ══════════════════════════════════════════════════════════════
-- VERIFICACIÓN: Ver los próximos IDs que se usarán
-- ══════════════════════════════════════════════════════════════

SELECT 
  'comentarios_reporte' as tabla,
  currval('comentarios_reporte_id_seq') as proximo_id
UNION ALL
SELECT 
  'modo_mantenimiento',
  currval('modo_mantenimiento_id_seq')
UNION ALL
SELECT 
  'reportes',
  currval('reportes_id_seq')
UNION ALL
SELECT 
  'usuarios',
  currval('usuarios_id_seq')
UNION ALL
SELECT 
  'presentaciones',
  currval('presentaciones_id_seq');

-- ══════════════════════════════════════════════════════════════
-- ✅ CÓMO EJECUTAR EN DIGITALOCEAN:
-- ══════════════════════════════════════════════════════════════
-- 1. Ve a: DigitalOcean → Database → presentador-ia-db
-- 2. Pestaña: "Console" o "Connection Details"
-- 3. Copia y pega TODAS las líneas SELECT setval(...)
-- 4. Ejecuta la última consulta de verificación
-- 5. Confirma que no hay errores
-- ══════════════════════════════════════════════════════════════

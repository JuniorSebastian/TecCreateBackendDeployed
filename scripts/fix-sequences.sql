-- 🔧 FIX POSTGRESQL SEQUENCES
-- ══════════════════════════════════════════════════════════════
-- PROBLEMA: duplicate key value violates unique constraint
-- CAUSA: Las secuencias están desincronizadas con los MAX(id)
-- SOLUCIÓN: Resetear cada secuencia al MAX(id) actual + 1
-- ══════════════════════════════════════════════════════════════

-- 1️⃣ comentarios_reporte
SELECT setval('comentarios_reporte_id_seq', COALESCE((SELECT MAX(id) FROM comentarios_reporte), 0) + 1, false);

-- 2️⃣ modo_mantenimiento
SELECT setval('modo_mantenimiento_id_seq', COALESCE((SELECT MAX(id) FROM modo_mantenimiento), 0) + 1, false);

-- 3️⃣ historial_acciones_soporte (CRÍTICO - causa errores en toggle mantenimiento y actualizar reportes)
SELECT setval('historial_acciones_soporte_id_seq', COALESCE((SELECT MAX(id) FROM historial_acciones_soporte), 0) + 1, false);

-- 4️⃣ reportes_soporte
SELECT setval('reportes_soporte_id_seq', COALESCE((SELECT MAX(id) FROM reportes_soporte), 0) + 1, false);

-- 5️⃣ usuarios
SELECT setval('usuarios_id_seq', COALESCE((SELECT MAX(id) FROM usuarios), 0) + 1, false);

-- 6️⃣ presentaciones
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
  'historial_acciones_soporte',
  currval('historial_acciones_soporte_id_seq')
UNION ALL
SELECT 
  'reportes_soporte',
  currval('reportes_soporte_id_seq')
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

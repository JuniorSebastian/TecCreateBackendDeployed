-- ═══════════════════════════════════════════════════════════════
-- 🔧 RESETEAR TODAS LAS SECUENCIAS DE GOLPE
-- ═══════════════════════════════════════════════════════════════
-- Ejecuta esto en la consola de PostgreSQL de DigitalOcean
-- Resetea automáticamente TODAS las secuencias al MAX(id) + 1
-- ═══════════════════════════════════════════════════════════════

BEGIN;

-- Reset de TODAS las secuencias
SELECT setval('usuarios_id_seq', COALESCE((SELECT MAX(id) FROM usuarios), 0) + 1, false);
SELECT setval('presentaciones_id_seq', COALESCE((SELECT MAX(id) FROM presentaciones), 0) + 1, false);
SELECT setval('imagenes_presentacion_id_seq', COALESCE((SELECT MAX(id) FROM imagenes_presentacion), 0) + 1, false);
SELECT setval('reportes_soporte_id_seq', COALESCE((SELECT MAX(id) FROM reportes_soporte), 0) + 1, false);
SELECT setval('comentarios_reporte_id_seq', COALESCE((SELECT MAX(id) FROM comentarios_reporte), 0) + 1, false);
SELECT setval('modo_mantenimiento_id_seq', COALESCE((SELECT MAX(id) FROM modo_mantenimiento), 0) + 1, false);
SELECT setval('logs_sistema_id_seq', COALESCE((SELECT MAX(id) FROM logs_sistema), 0) + 1, false);
SELECT setval('historial_acciones_soporte_id_seq', COALESCE((SELECT MAX(id) FROM historial_acciones_soporte), 0) + 1, false);
SELECT setval('notificaciones_soporte_id_seq', COALESCE((SELECT MAX(id) FROM notificaciones_soporte), 0) + 1, false);

COMMIT;

-- ═══════════════════════════════════════════════════════════════
-- ✅ VERIFICAR QUE TODO ESTÁ OK
-- ═══════════════════════════════════════════════════════════════

SELECT 
  'usuarios' as tabla,
  COALESCE((SELECT MAX(id) FROM usuarios), 0) as max_actual,
  currval('usuarios_id_seq') as proximo_id,
  currval('usuarios_id_seq') - COALESCE((SELECT MAX(id) FROM usuarios), 0) as diferencia
UNION ALL
SELECT 
  'presentaciones',
  COALESCE((SELECT MAX(id) FROM presentaciones), 0),
  currval('presentaciones_id_seq'),
  currval('presentaciones_id_seq') - COALESCE((SELECT MAX(id) FROM presentaciones), 0)
UNION ALL
SELECT 
  'imagenes_presentacion',
  COALESCE((SELECT MAX(id) FROM imagenes_presentacion), 0),
  currval('imagenes_presentacion_id_seq'),
  currval('imagenes_presentacion_id_seq') - COALESCE((SELECT MAX(id) FROM imagenes_presentacion), 0)
UNION ALL
SELECT 
  'reportes_soporte',
  COALESCE((SELECT MAX(id) FROM reportes_soporte), 0),
  currval('reportes_soporte_id_seq'),
  currval('reportes_soporte_id_seq') - COALESCE((SELECT MAX(id) FROM reportes_soporte), 0)
UNION ALL
SELECT 
  'comentarios_reporte',
  COALESCE((SELECT MAX(id) FROM comentarios_reporte), 0),
  currval('comentarios_reporte_id_seq'),
  currval('comentarios_reporte_id_seq') - COALESCE((SELECT MAX(id) FROM comentarios_reporte), 0)
UNION ALL
SELECT 
  'modo_mantenimiento',
  COALESCE((SELECT MAX(id) FROM modo_mantenimiento), 0),
  currval('modo_mantenimiento_id_seq'),
  currval('modo_mantenimiento_id_seq') - COALESCE((SELECT MAX(id) FROM modo_mantenimiento), 0)
UNION ALL
SELECT 
  'logs_sistema',
  COALESCE((SELECT MAX(id) FROM logs_sistema), 0),
  currval('logs_sistema_id_seq'),
  currval('logs_sistema_id_seq') - COALESCE((SELECT MAX(id) FROM logs_sistema), 0)
UNION ALL
SELECT 
  'historial_acciones_soporte',
  COALESCE((SELECT MAX(id) FROM historial_acciones_soporte), 0),
  currval('historial_acciones_soporte_id_seq'),
  currval('historial_acciones_soporte_id_seq') - COALESCE((SELECT MAX(id) FROM historial_acciones_soporte), 0)
UNION ALL
SELECT 
  'notificaciones_soporte',
  COALESCE((SELECT MAX(id) FROM notificaciones_soporte), 0),
  currval('notificaciones_soporte_id_seq'),
  currval('notificaciones_soporte_id_seq') - COALESCE((SELECT MAX(id) FROM notificaciones_soporte), 0)
ORDER BY tabla;

-- ═══════════════════════════════════════════════════════════════
-- 📖 INSTRUCCIONES:
-- ═══════════════════════════════════════════════════════════════
-- 1. Copia TODO desde BEGIN; hasta el último ORDER BY tabla;
-- 2. Ve a DigitalOcean → Database → presentador-ia-db → Console
-- 3. Pega y ejecuta
-- 4. Verifica que la columna "diferencia" = 1 para todas las tablas
-- ═══════════════════════════════════════════════════════════════

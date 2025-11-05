/**
 * 🔧 Fix PostgreSQL Sequences
 * 
 * PROBLEMA:
 * - Error: duplicate key value violates unique constraint
 * - Las secuencias de auto-increment están desincronizadas
 * - PostgreSQL intenta insertar IDs que ya existen
 * 
 * SOLUCIÓN:
 * - Resetear cada secuencia al MAX(id) + 1 de su tabla
 * - Sincronizar comentarios_reporte, modo_mantenimiento, etc.
 */

// Deshabilitar verificación SSL para este script temporal
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const { Pool } = require('pg');

// Conexión directa
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

const SEQUENCES_TO_FIX = [
  {
    table: 'comentarios_reporte',
    sequence: 'comentarios_reporte_id_seq',
    idColumn: 'id'
  },
  {
    table: 'modo_mantenimiento',
    sequence: 'modo_mantenimiento_id_seq',
    idColumn: 'id'
  },
  {
    table: 'usuarios',
    sequence: 'usuarios_id_seq',
    idColumn: 'id'
  },
  {
    table: 'reportes_soporte', // Cambiado de 'reportes'
    sequence: 'reportes_soporte_id_seq',
    idColumn: 'id'
  },
  {
    table: 'presentaciones',
    sequence: 'presentaciones_id_seq',
    idColumn: 'id'
  }
];

async function fixSequence(table, sequence, idColumn) {
  try {
    // Obtener el máximo ID actual
    const maxResult = await pool.query(
      `SELECT COALESCE(MAX(${idColumn}), 0) as max_id FROM ${table}`
    );
    const maxId = maxResult.rows[0].max_id;

    // Resetear la secuencia al MAX + 1
    await pool.query(
      `SELECT setval('${sequence}', $1, true)`,
      [maxId]
    );

    console.log(`✅ ${table}: secuencia reseteada a ${maxId + 1} (max actual: ${maxId})`);
    return { table, maxId, nextId: maxId + 1, success: true };
  } catch (error) {
    console.error(`❌ Error en ${table}:`, error.message);
    return { table, error: error.message, success: false };
  }
}

async function fixAllSequences() {
  console.log('🔧 Iniciando reparación de secuencias PostgreSQL...\n');

  const results = [];
  for (const { table, sequence, idColumn } of SEQUENCES_TO_FIX) {
    const result = await fixSequence(table, sequence, idColumn);
    results.push(result);
  }

  console.log('\n📊 RESUMEN:');
  console.log('═══════════════════════════════════════════════════');
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  successful.forEach(r => {
    console.log(`  ✅ ${r.table.padEnd(25)} → próximo ID: ${r.nextId}`);
  });

  if (failed.length > 0) {
    console.log('\n  Errores:');
    failed.forEach(r => {
      console.log(`  ❌ ${r.table.padEnd(25)} → ${r.error}`);
    });
  }

  console.log('═══════════════════════════════════════════════════');
  console.log(`✅ Completado: ${successful.length}/${results.length} secuencias reparadas\n`);

  return results;
}

// Ejecutar y cerrar conexión
fixAllSequences()
  .then((results) => {
    const allSuccess = results.every(r => r.success);
    process.exit(allSuccess ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  })
  .finally(() => {
    pool.end();
  });

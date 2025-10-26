#!/usr/bin/env node
/**
 * Elimina los logs de prueba (mensaje que empiece con "Log de prueba").
 */

const pool = require('../database');

(async () => {
  try {
    const result = await pool.query("DELETE FROM logs_sistema WHERE mensaje LIKE 'Log de prueba%'");
    console.log(`Logs eliminados: ${result.rowCount}`);
  } catch (error) {
    console.error('Error al eliminar logs:', error);
    process.exitCode = 1;
  } finally {
    await pool.end().catch(() => {});
  }
})();

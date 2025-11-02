// Moved from project root to scripts/
require('dotenv').config();
const pool = require('../db');

async function main() {
  try {
    console.log('Verificando usuario con ID 1:');
    const userResult = await pool.query(`
      SELECT id, nombre, email, rol, estado
      FROM usuarios
      WHERE id = 1
    `);
    
    if (userResult.rows.length > 0) {
      console.log('Usuario encontrado:', userResult.rows[0]);
    } else {
      console.log('Usuario no encontrado');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    if (pool && typeof pool.end === 'function') await pool.end();
  }
}

main();

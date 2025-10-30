require('dotenv').config();
// Reuse the project's DB pool which already applies SSL settings
const pool = require('./db');

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
    
    // Verificar si el usuario tiene rol de administrador
    if (userResult.rows.length > 0 && userResult.rows[0].rol === 'admin') {
      console.log('✅ El usuario tiene rol de administrador');
    } else if (userResult.rows.length > 0) {
      console.log('❌ El usuario NO tiene rol de administrador, su rol es:', userResult.rows[0].rol);
    }

    // Verificar las presentaciones del usuario
    console.log('\nVerificando presentaciones del usuario:');
    const presentacionesResult = await pool.query(`
      SELECT id, titulo, plantilla, fuente, fecha_creacion
      FROM presentaciones
      WHERE email = (SELECT email FROM usuarios WHERE id = 1)
      ORDER BY fecha_creacion DESC
    `);
    
    console.log(`Total de presentaciones: ${presentacionesResult.rows.length}`);
    console.log('Títulos:');
    presentacionesResult.rows.forEach((row, i) => {
      console.log(`${i+1}. ${row.titulo.substring(0, 60)}${row.titulo.length > 60 ? '...' : ''}`);
    });
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    if (pool && typeof pool.end === 'function') await pool.end();
  }
}

main();
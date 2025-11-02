// Moved from project root to scripts/
const pool = require('../database');

async function main() {
  try {
    const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'usuarios' ORDER BY ordinal_position");
    console.log(res.rows);
    
    console.log('\n--- Estructura de usuarios: ---');
    
    const users = await pool.query("SELECT id, nombre, email, rol, estado FROM usuarios LIMIT 5");
    console.log(users.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

main();

require('dotenv').config();
// Reuse the project's DB pool which already applies SSL settings
const pool = require('../db');

(async () => {
  try {
    const { rows } = await pool.query(
      "SELECT id, nombre, email, rol, estado, foto FROM usuarios WHERE email = 'rodrigo.diaz.i@tecsup.edu.pe'"
    );
    console.log(rows);
  } catch (error) {
    console.error(error);
  } finally {
    // If we grabbed the shared pool, close it to exit the script
    if (pool && typeof pool.end === 'function') await pool.end();
  }
})();

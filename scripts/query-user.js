const { Pool } = require('pg');
require('dotenv').config();

(async () => {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const { rows } = await pool.query(
      "SELECT id, nombre, email, rol, estado, foto FROM usuarios WHERE email = 'rodrigo.diaz.i@tecsup.edu.pe'"
    );
    console.log(rows);
  } catch (error) {
    console.error(error);
  } finally {
    await pool.end();
  }
})();

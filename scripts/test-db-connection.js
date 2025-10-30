const pool = require('../db');

(async () => {
  try {
    console.log('Intentando conectar a la base de datos y ejecutar SELECT NOW()...');
    const res = await pool.query('SELECT NOW()');
    console.log('Conexión exitosa, resultado:', res.rows[0]);
  } catch (err) {
    console.error('Error al conectar/consultar la base de datos (no se mostrará la cadena completa):');
    // Mostrar solo el mensaje y el stack sin exponer credenciales
    console.error('Mensaje:', err.message);
    if (err.code) console.error('Código PG:', err.code);
    console.error(err.stack ? err.stack.split('\n').slice(0,5).join('\n') : err);
    process.exitCode = 1;
  } finally {
    try {
      await pool.end();
    } catch (e) {
      // ignore
    }
  }
})();

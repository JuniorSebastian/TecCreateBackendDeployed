const pool = require('./database');

async function main() {
  try {
    console.log('Buscando presentaciones del usuario 1:');
    const presentaciones = await pool.query(`
      SELECT
        p.id,
        p.titulo,
        p.plantilla,
        p.fuente,
        p.numero_slides,
        p.fecha_creacion
      FROM presentaciones p
      JOIN usuarios u ON u.email = p.email
      WHERE u.id = 1
      ORDER BY p.fecha_creacion DESC, p.id DESC
    `);
    console.log(`Encontradas ${presentaciones.rows.length} presentaciones:`);
    console.log(JSON.stringify(presentaciones.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

main();
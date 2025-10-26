const { Pool } = require('pg');
require('dotenv').config();

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Verificando el endpoint de presentaciones de usuario:');
    
    const userId = 1;
    const limit = 20; // Aumentamos el límite para ver todas las presentaciones
    
    // Simulando la consulta que hace el endpoint
    const query = `
      SELECT
        p.id,
        p.titulo,
        p.plantilla,
        p.fuente,
        p.numero_slides,
        p.fecha_creacion,
        COUNT(*) OVER() AS total_items
      FROM presentaciones p
      JOIN usuarios u ON u.email = p.email
      WHERE u.id = $1
      ORDER BY p.fecha_creacion DESC, p.id DESC
      LIMIT $2
      OFFSET $3
    `;
    
    const result = await pool.query(query, [userId, limit, 0]);
    
    console.log(`Total presentaciones (según COUNT): ${result.rows[0]?.total_items || 0}`);
    console.log(`Presentaciones recuperadas: ${result.rows.length}`);
    
    if (result.rows.length > 0) {
      console.log('\nPrimera presentación:');
      console.log(result.rows[0]);
      
      console.log('\nÚltima presentación:');
      console.log(result.rows[result.rows.length - 1]);
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

main();
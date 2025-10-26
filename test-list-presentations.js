const pool = require('./database');

async function main() {
  try {
    console.log('Probando la función listPresentationsByUserId:');
    
    const { listPresentationsByUserId } = require('./services/usuariosService');
    
    const result = await listPresentationsByUserId(1);
    
    console.log(`Total presentaciones: ${result.pagination.total}`);
    console.log(`Presentaciones devueltas: ${result.presentaciones.length}`);
    
    console.log('\nPrimeras 3 presentaciones:');
    console.log(JSON.stringify(result.presentaciones.slice(0, 3), null, 2));
  } catch (err) {
    console.error('Error al ejecutar la prueba:', err);
  } finally {
    pool.end();
  }
}

main();
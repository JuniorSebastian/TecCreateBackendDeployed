require('dotenv').config();

const {
  crearReporteSoporte,
  actualizarEstadoReporte,
} = require('../controllers/reportesController');

function createMockRes(tag) {
  return {
    statusCode: 200,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.payload = data;
      console.log(`\n[${tag}] status:`, this.statusCode);
      console.log(`[${tag}] body:`, JSON.stringify(data, null, 2));
      return this;
    },
    send(data) {
      this.payload = data;
      console.log(`\n[${tag}] status:`, this.statusCode);
      console.log(`[${tag}] body:`, data);
      return this;
    },
  };
}

async function run() {
  console.log('=== Test backend reportes ===');

  const reqCrear = {
    body: {
      nombre: 'Tester Backend',
        correo: 'rodrigo.diaz.i@tecsup.edu.pe',
      categoria: 'bug',
      detalle: 'Resumen manual desde backend',
      mensaje: 'Mensaje extenso para verificar que el resumen respeta el campo detalle y no cae en "Sin resumen".',
    },
    usuario: null,
  };

  const resCrear = createMockRes('crearReporteSoporte');
  await crearReporteSoporte(reqCrear, resCrear);

  if (!resCrear.payload || !resCrear.payload.id) {
    console.error('\n❌ No se creó el reporte, deteniendo pruebas.');
    process.exit(1);
  }

  const { id, resumen } = resCrear.payload;
  console.log(`\n✅ Reporte creado con ID ${id} y resumen: "${resumen}"`);

  const reqActualizar = {
    params: { id: String(id) },
    body: {
      estado: {
        key: 'en_proceso',
      },
    },
    usuario: {
      email: 'junior.osorio@tecsup.edu.pe',
    },
  };

  const resActualizar = createMockRes('actualizarEstadoReporte');
  await actualizarEstadoReporte(reqActualizar, resActualizar);

  if (!resActualizar.payload || resActualizar.payload.estadoKey !== 'en_proceso') {
    console.error('\n❌ No se actualizó el estado correctamente.');
    process.exit(1);
  }

  console.log(`\n✅ Estado actualizado correctamente a: ${resActualizar.payload.estado} (${resActualizar.payload.estadoKey})`);
  console.log('\n🎉 Pruebas backend finalizadas con éxito.');
  process.exit(0);
}

run().catch((error) => {
  console.error('\n❌ Error durante las pruebas:', error);
  process.exit(1);
});

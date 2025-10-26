require('dotenv').config();

const jwt = require('jsonwebtoken');
const soporteController = require('../controllers/soporteController');
const { verificarToken } = require('../middlewares/authMiddleware');

function createMockRes(tag) {
  return {
    statusCode: 200,
    payload: null,
    nextCalled: false,
    headers: {},
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
    setHeader(name, value) {
      this.headers[name] = value;
    },
  };
}

async function callController(tag, handler, req) {
  const res = createMockRes(tag);
  await handler(req, res);
  return res;
}

async function callVerificarToken(tag, tokenPayload) {
  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '5m' });
  const req = {
    headers: {
      authorization: `Bearer ${token}`,
    },
  };
  const res = createMockRes(tag);
  await new Promise((resolve) => {
    verificarToken(req, res, () => {
      res.nextCalled = true;
      console.log(`\n[${tag}] next() fue invocado. Token permitido.`);
      resolve();
    }).catch((error) => {
      console.error(`\n[${tag}] verificarToken lanzó error:`, error);
      resolve();
    });
  });
  return { req, res };
}

async function run() {
  console.log('=== Test modo mantenimiento ===');

  const soporteReq = { body: { activo: false }, usuario: { email: 'junior.osorio@tecsup.edu.pe' } };
  await callController('desactivarInicial', soporteController.actualizarModoMantenimiento, soporteReq);

  const activarReq = {
    body: { activo: true, mensaje: 'Mantenimiento programado para validación.' },
    usuario: { email: 'junior.osorio@tecsup.edu.pe' },
  };
  await callController('activar', soporteController.actualizarModoMantenimiento, activarReq);

  const { res: resBloqueado } = await callVerificarToken('verificarUsuarioMantenimiento', {
    email: 'rodrigo.diaz.i@tecsup.edu.pe',
    nombre: 'Rodrigo Diaz',
    rol: 'usuario',
  });

  if (resBloqueado.nextCalled) {
    console.error('\n❌ El middleware permitió el acceso durante mantenimiento.');
    process.exit(1);
  }
  if (resBloqueado.statusCode !== 503) {
    console.error('\n❌ Se esperaba estado 503 durante mantenimiento.');
    process.exit(1);
  }

  const desactivarReq = {
    body: { activo: false },
    usuario: { email: 'junior.osorio@tecsup.edu.pe' },
  };
  await callController('desactivar', soporteController.actualizarModoMantenimiento, desactivarReq);

  const { res: resPermitido } = await callVerificarToken('verificarUsuarioNormal', {
    email: 'rodrigo.diaz.i@tecsup.edu.pe',
    nombre: 'Rodrigo Diaz',
    rol: 'usuario',
  });

  if (!resPermitido.nextCalled) {
    console.error('\n❌ El middleware no permitió el acceso tras desactivar mantenimiento.');
    process.exit(1);
  }

  console.log('\n✅ Modo mantenimiento bloquea y restablece el acceso correctamente.');
  process.exit(0);
}

run().catch((error) => {
  console.error('\n❌ Error en pruebas de mantenimiento:', error);
  process.exit(1);
});

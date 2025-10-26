require('dotenv').config();
const jwt = require('jsonwebtoken');
const { verificarToken } = require('../middlewares/authMiddleware');

const email = 'rodrigo.diaz.i@tecsup.edu.pe';

async function main() {
  const token = jwt.sign(
    {
      email,
      nombre: 'Rodrigo Daniel Diaz Isla',
      rol: 'usuario',
      estado: 'activo',
    },
    process.env.JWT_SECRET,
    { expiresIn: '15m' },
  );

  const req = {
    headers: {
      authorization: `Bearer ${token}`,
    },
  };

  const res = {
    status(code) {
      console.log('status called:', code);
      return {
        json(payload) {
          console.log('json payload:', payload);
        },
      };
    },
  };

  let nextCalled = false;
  const next = () => {
    nextCalled = true;
    console.log('next() executed; req.usuario =', req.usuario);
  };

  await verificarToken(req, res, next);

  console.log('nextCalled=', nextCalled);
}

main().catch((error) => {
  console.error('Middleware test failed:', error);
});

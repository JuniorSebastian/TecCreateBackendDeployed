require('dotenv').config();
const jwt = require('jsonwebtoken');

const API_BASE = process.env.TEST_API_BASE || 'http://localhost:3001';
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
    { expiresIn: '30m' },
  );

  const response = await fetch(`${API_BASE}/presentaciones/mias`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log('Status:', response.status);
  const bodyText = await response.text();
  console.log('Body:', bodyText);
}

main().catch((error) => {
  console.error('Test failed:', error);
  process.exit(1);
});

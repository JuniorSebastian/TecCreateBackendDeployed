require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const passport = require('passport');
require('./config/passport'); // Configura la estrategia de Google

// Rutas
const authRoutes = require('./routes/authRoutes');
const presentacionesRoutes = require('./routes/presentacionesRoutes');
const adminRoutes = require('./routes/adminRoutes');
const reportesRoutes = require('./routes/reportesRoutes');
const soporteRoutes = require('./routes/soporteRoutes');

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';
const isProduction = process.env.NODE_ENV === 'production';

const normalizeOrigin = (origin) => {
  if (!origin || typeof origin !== 'string') {
    return null;
  }
  return origin.trim().replace(/\/+$/g, '');
};

app.disable('x-powered-by');
app.set('trust proxy', 1);

// Debug helper to confirm critical env vars get loaded (no real key exposure)
console.log('🔑 GEMINI_API_KEY cargada:', Boolean(process.env.GEMINI_API_KEY));

// 🛡️ CORS (habilita solicitudes desde el frontend)
const defaultAllowedOrigins = new Set();

if (!isProduction) {
  [
    'http://localhost:3000',
    'http://localhost:3001',
  ].map(normalizeOrigin)
    .filter(Boolean)
    .forEach((origin) => defaultAllowedOrigins.add(origin));
}

[process.env.CLIENT_URL, process.env.PUBLIC_BASE_URL]
  .map(normalizeOrigin)
  .filter(Boolean)
  .forEach((origin) => defaultAllowedOrigins.add(origin));

if (process.env.ALLOWED_ORIGINS) {
  process.env.ALLOWED_ORIGINS
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean)
    .forEach((origin) => defaultAllowedOrigins.add(origin));
}

const corsOptions = {
  origin: (origin, callback) => {
    const normalizedOrigin = normalizeOrigin(origin);
    if (!normalizedOrigin || defaultAllowedOrigins.has(normalizedOrigin)) {
      return callback(null, true);
    }

    if (!isProduction) {
      console.warn(`CORS permitido dinámicamente para ${origin} en modo no productivo.`);
      return callback(null, true);
    }

    console.warn(`CORS bloqueado para origen no permitido: ${origin}`);
    return callback(new Error('Origen no permitido por CORS'));
  },
  credentials: true,
};

app.use(cors(corsOptions));

// 🔌 Middleware para JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 📁 Archivos estáticos (imágenes generadas y otros recursos)
const STATIC_PUBLIC_DIR = path.join(__dirname, 'public');
app.use('/images', express.static(path.join(STATIC_PUBLIC_DIR, 'images')));
app.use('/public', express.static(STATIC_PUBLIC_DIR));

// 🔐 Session y Passport
const sessionSecret = process.env.SESSION_SECRET || process.env.JWT_SECRET || 'secret';
const sessionConfig = {
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: isProduction ? 'none' : 'lax',
    secure: isProduction,
  },
};

const sessionMaxAge = Number.parseInt(process.env.SESSION_MAX_AGE || '', 10);
if (Number.isFinite(sessionMaxAge) && sessionMaxAge > 0) {
  sessionConfig.cookie.maxAge = sessionMaxAge;
}

app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());

// 🔍 Healthcheck
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    name: 'TecCreate Backend',
    status: 'running',
    uptime: process.uptime(),
    version: process.env.npm_package_version,
  });
});

// 🌐 Rutas
app.use('/auth', authRoutes);
app.use('/presentaciones', presentacionesRoutes);
app.use('/admin', adminRoutes);
app.use('/reportes', reportesRoutes);
app.use('/soporte', soporteRoutes);
// Antes de arrancar el servidor, comprobamos la conexión a la base de datos
const pool = require('./db');

async function startServer() {
  try {
    console.log('DB: comprobando conexión al arrancar...');
    // Hacemos una consulta simple para validar TLS/credenciales
    await pool.query('SELECT 1');
    console.log('DB: conexión verificada correctamente.');
  } catch (err) {
    console.error('DB: fallo en la comprobación al inicio. Deteniendo proceso.');
    console.error(err && err.message ? err.message : err);
    // Salimos con código 1 para que la plataforma marque el deploy como fallido
    process.exit(1);
  }

  // ✅ Servidor funcionando
  const server = app.listen(PORT, HOST, () => {
    console.log(`✅ Servidor corriendo en http://${HOST}:${PORT}`);
  });

  server.on('close', () => {
    console.log('🛑 Servidor detenido');
  });

  module.exports = server;
}

startServer();

process.on('unhandledRejection', (reason) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Excepción no capturada:', err);
});

setInterval(() => {}, 60_000);

module.exports = server;

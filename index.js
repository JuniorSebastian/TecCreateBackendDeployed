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
// Server reference (initialized in startServer)
let server = null;
// DigitalOcean App Platform typically expects apps to listen on 8080
const PORT = Number(process.env.PORT || process.env.APP_PORT || 8080);
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

async function waitForDb({ attempts = 12, delayMs = 5000 } = {}) {
  console.log(`DB: comprobando conexión al arrancar (max ${attempts} intentos, ${delayMs}ms intervalo)...`);
  for (let i = 1; i <= attempts; i += 1) {
    try {
      await pool.query('SELECT 1');
      console.log('DB: conexión verificada correctamente.');
      return true;
    } catch (err) {
      const msg = err && err.message ? err.message : String(err);
      console.warn(`DB: intento ${i}/${attempts} fallido: ${msg}`);
      if (i < attempts) {
        await new Promise((r) => setTimeout(r, delayMs));
      } else {
        console.error('DB: máximos intentos de conexión alcanzados. No se puede iniciar la app.');
        return false;
      }
    }
  }
  return false;
}

async function startServer() {
  const ok = await waitForDb();
  if (!ok) {
    // Salimos con código 1 para que DigitalOcean marque el despliegue como fallido
    process.exit(1);
    return;
  }

  // ✅ Servidor funcionando
  server = app.listen(PORT, HOST, () => {
    console.log(`✅ Servidor corriendo en http://${HOST}:${PORT}`);
  });

  server.on('close', () => {
    console.log('🛑 Servidor detenido');
  });
}

startServer();

// Graceful shutdown: cerramos servidor y pool de Postgres
async function shutdown(signal) {
  console.log(`\n🛑 Recibida señal ${signal} — cerrando servidor y conexiones...`);
  try {
    if (server && server.close) {
      await new Promise((resolve) => server.close(resolve));
      console.log('Servidor cerrado.');
    }
  } catch (e) {
    console.warn('Error cerrando servidor:', e && e.message ? e.message : e);
  }

  try {
    if (pool && pool.end) {
      await pool.end();
      console.log('Pool de Postgres finalizado.');
    }
  } catch (e) {
    console.warn('Error cerrando pool de DB:', e && e.message ? e.message : e);
  }

  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Excepción no capturada:', err);
});

setInterval(() => {}, 60_000);

// Export startup and helpers so tests or external tools can control lifecycle.
module.exports = {
  startServer,
  getServer: () => server,
  app,
};

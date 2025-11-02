require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const passport = require('passport');
require('./config/passport'); // Configura la estrategia de Google
// Optional dependencies: require them only if available so deploys without them still work.
let logger = console;
let _pinoHttpMiddleware = null;
try {
  const pino = require('pino');
  const pinoHttp = require('pino-http');
  logger = pino({ level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug') });
  _pinoHttpMiddleware = pinoHttp({ logger });
} catch (e) {
  // If pino isn't installed, fall back to console without crashing the process.
  console.warn('Optional dependency `pino` not available — falling back to console logger. Install `pino` to enable structured logging.');
}

let helmetMiddleware = null;
try { helmetMiddleware = require('helmet')(); } catch (e) { /* optional */ }

let compressionMiddleware = null;
try { compressionMiddleware = require('compression')(); } catch (e) { /* optional */ }

let rateLimitMiddleware = null;
try {
  const rateLimit = require('express-rate-limit');
  rateLimitMiddleware = rateLimit({ windowMs: 60_000, max: Number(process.env.RATE_LIMIT_MAX || 200) });
} catch (e) { /* optional */ }

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

// Structured logger (pino) - optional
if (_pinoHttpMiddleware) {
  app.use(_pinoHttpMiddleware);
} else {
  // ensure we have a logger object with common methods used below
  if (!logger.info) logger.info = (...args) => console.log(...args);
  if (!logger.warn) logger.warn = (...args) => console.warn(...args);
  if (!logger.error) logger.error = (...args) => console.error(...args);
}

// Security & performance middleware (optional depending on presence of packages)
if (helmetMiddleware) app.use(helmetMiddleware);
if (compressionMiddleware) app.use(compressionMiddleware);
if (rateLimitMiddleware) app.use(rateLimitMiddleware);

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
// Limit request body size to avoid OOM from large payloads; can be overridden with BODY_LIMIT env
app.use(express.json({ limit: process.env.BODY_LIMIT || '100kb' }));
app.use(express.urlencoded({ extended: true, limit: process.env.BODY_LIMIT || '100kb' }));

// Minimal request logging (non-intrusive). If pino is available, it will log too.
app.use((req, res, next) => {
  try {
    console.log(`[req] ${req.method} ${req.originalUrl}`);
  } catch (e) {
    // ignore logging errors
  }
  return next();
});

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

// Try to use Redis as session store when REDIS_URL is provided (recommended for prod)
if (process.env.REDIS_URL) {
  try {
    // Note: requires `ioredis` and `connect-redis` to be installed in the runtime environment.
    const Redis = require('ioredis');
    const RedisStore = require('connect-redis')(session);
    const redisClient = new Redis(process.env.REDIS_URL);
    const redisStore = new RedisStore({ client: redisClient });
    sessionConfig.store = redisStore;
    logger.info('Using Redis session store');
  } catch (e) {
    logger.warn('Redis session store requested but failed to initialize (missing deps or connection error):', e && e.message ? e.message : e);
  }
}

app.use(session(sessionConfig));
app.use(passport.initialize());
app.use(passport.session());

// 🔍 Healthcheck
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Readiness: checks DB connectivity and dependencies (used for readiness probe)
app.get('/ready', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.status(200).json({ ready: true });
  } catch (err) {
    logger && logger.warn && logger.warn('Readiness check failed:', err && err.message ? err.message : err);
    return res.status(500).json({ ready: false, error: String(err && err.message ? err.message : err) });
  }
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

// Global error handler (last middleware) — captura errores no manejados en rutas
app.use((err, req, res, next) => {
  try {
    console.error('Global error handler caught:', err && err.stack ? err.stack : err);
  } catch (e) {
    // ignore
  }
  if (res.headersSent) return next(err);
  res.status(500).json({ error: 'internal_server_error' });
});

setInterval(() => {}, 60_000);

// Export startup and helpers so tests or external tools can control lifecycle.
module.exports = {
  startServer,
  getServer: () => server,
  app,
};

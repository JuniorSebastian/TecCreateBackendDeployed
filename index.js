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

// Debug helper to confirm critical env vars get loaded (no real key exposure)
console.log('🔑 GEMINI_API_KEY cargada:', Boolean(process.env.GEMINI_API_KEY));

// 🛡️ CORS (habilita solicitudes desde el frontend)
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// 🔌 Middleware para JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 📁 Archivos estáticos (imágenes generadas y otros recursos)
const STATIC_PUBLIC_DIR = path.join(__dirname, 'public');
app.use('/images', express.static(path.join(STATIC_PUBLIC_DIR, 'images')));
app.use('/public', express.static(STATIC_PUBLIC_DIR));

// 🔐 Session y Passport
app.use(session({
  secret: process.env.JWT_SECRET || 'secret',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// 🌐 Rutas
app.use('/auth', authRoutes);
app.use('/presentaciones', presentacionesRoutes);
app.use('/admin', adminRoutes);
app.use('/reportes', reportesRoutes);
app.use('/soporte', soporteRoutes);

// ✅ Servidor funcionando
const server = app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
});

server.on('close', () => {
  console.log('🛑 Servidor detenido');
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Promesa rechazada no manejada:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Excepción no capturada:', err);
});

setInterval(() => {}, 60_000);

module.exports = server;


// config/passport.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const pool = require('../database');
const { getMaintenanceGateInfo } = require('../services/maintenanceService');
require('dotenv').config();

const ADMIN_EMAILS = process.env.ADMIN_EMAILS
  ? process.env.ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase())
  : [];

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  // Prefer `GOOGLE_REDIRECT_URI` (requested name). Fall back to `GOOGLE_CALLBACK_URL` for compatibility.
  callbackURL: process.env.GOOGLE_REDIRECT_URI || process.env.GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  const email = profile.emails[0].value.toLowerCase();
  const nombre = profile.displayName;
  const foto = profile.photos[0].value;

  if (!email.endsWith('@tecsup.edu.pe')) {
    return done(null, false);
  }

  try {
    // Primero, verificamos si el usuario ya existe y está suspendido
    const userCheck = await pool.query(
      `SELECT id, nombre, email, foto, rol, estado FROM usuarios WHERE email = $1`,
      [email]
    );

    // Si el usuario existe y está suspendido, devolver sus datos en info
    if (userCheck.rows.length > 0 && userCheck.rows[0].estado === 'suspendido') {
      const suspendidoUser = userCheck.rows[0];
      return done(null, false, { 
        message: 'Usuario suspendido',
        user: {
          id: suspendidoUser.id,
          nombre: suspendidoUser.nombre,
          email: suspendidoUser.email,
          foto: suspendidoUser.foto,
          rol: (suspendidoUser.rol || 'usuario').toLowerCase(),
          estado: 'suspendido'
        }
      });
    }

    await pool.query(`
      INSERT INTO usuarios (nombre, email, foto)
      VALUES ($1, $2, $3)
      ON CONFLICT (email) DO UPDATE SET nombre = EXCLUDED.nombre, foto = EXCLUDED.foto`,
      [nombre, email, foto]);

    // Después de insertar/actualizar, obtenemos toda la información del usuario
    const userResult = await pool.query(
      `SELECT id, nombre, email, foto, rol, estado FROM usuarios WHERE email = $1`,
      [email]
    );

    if (!userResult.rows.length) {
      return done(null, false, { message: 'Error al obtener información del usuario' });
    }

    const user = userResult.rows[0];

    // Si el usuario está marcado como suspendido, no permitimos el login
    if (user.estado === 'suspendido') {
      return done(null, false, { message: 'Usuario suspendido' });
    }

    const shouldBeAdmin = ADMIN_EMAILS.includes(email);
    let rol = user.rol || 'usuario';

    if (shouldBeAdmin && user.rol !== 'admin') {
      await pool.query(
        'UPDATE usuarios SET rol = $1 WHERE email = $2',
        ['admin', email],
      );
      rol = 'admin';
    } else if (!shouldBeAdmin && !rol) {
      rol = 'usuario';
    }

    const estado = (user.estado || 'activo').toLowerCase();
    const rolNormalizado = (rol || 'usuario').toLowerCase();

    try {
      const mantenimiento = await getMaintenanceGateInfo();
      if (mantenimiento.activo && rolNormalizado === 'usuario') {
        return done(null, false, {
          message: 'mantenimiento_activo',
          code: 'MAINTENANCE_ACTIVE',
          maintenance: mantenimiento,
        });
      }
    } catch (maintenanceError) {
      console.error('Error consultando modo mantenimiento:', maintenanceError);
      return done(maintenanceError);
    }

    return done(null, {
      id: user.id,
      nombre: user.nombre,
      email: user.email,
      foto: user.foto,
      rol: rolNormalizado,
      estado,
    });
  } catch (error) {
    console.error('Error en autenticación:', error);
    return done(error);
  }
}));

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// middlewares/authMiddleware.js
const jwt = require('jsonwebtoken');
const pool = require('../database');
const { getMaintenanceGateInfo } = require('../services/maintenanceService');

const normalizeUser = (row) => ({
  id: row.id,
  nombre: row.nombre,
  email: row.email,
  foto: row.foto,
  rol: String(row.rol || 'usuario').toLowerCase(),
  estado: String(row.estado || 'activo').toLowerCase(),
});

const resolveUserFromToken = async (token) => {
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const email = decoded?.email;
  if (!email) {
    const error = new Error('Token sin información de usuario');
    error.code = 'TOKEN_MISSING_EMAIL';
    throw error;
  }

  const { rows } = await pool.query(
    `SELECT id, nombre, email, foto, COALESCE(rol, 'usuario') AS rol, COALESCE(estado, 'activo') AS estado
     FROM usuarios
     WHERE email = $1
     LIMIT 1`,
    [email],
  );

  if (!rows.length) {
    const error = new Error('Cuenta no encontrada');
    error.code = 'USER_NOT_FOUND';
    throw error;
  }

  return normalizeUser(rows[0]);
};

async function verificarToken(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ mensaje: 'Token no proporcionado' });

  let usuario;
  try {
    usuario = await resolveUserFromToken(token);
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(403).json({ mensaje: 'Token inválido' });
    }
    if (error.code === 'TOKEN_MISSING_EMAIL') {
      return res.status(401).json({ mensaje: 'Token sin información de usuario' });
    }
    if (error.code === 'USER_NOT_FOUND') {
      return res.status(403).json({ mensaje: 'Cuenta no encontrada. Contacta con soporte.' });
    }
    console.error('Error al verificar token contra la base de datos:', error);
    return res.status(500).json({ mensaje: 'Error al validar tu sesión. Intenta nuevamente.' });
  }

  if (usuario.estado === 'suspendido') {
    return res.status(403).json({ mensaje: 'Tu cuenta está suspendida. Contacta con soporte.' });
  }

  if (usuario.rol === 'usuario') {
    try {
      const mantenimiento = await getMaintenanceGateInfo();
      if (mantenimiento.activo) {
        return res.status(503).json({
          mensaje: mantenimiento.mensaje,
          mantenimiento,
        });
      }
    } catch (maintenanceError) {
      console.error('Error al validar modo mantenimiento:', maintenanceError);
      return res.status(500).json({ mensaje: 'No se pudo validar el modo mantenimiento. Intenta nuevamente.' });
    }
  }

  req.usuario = usuario;
  req.user = req.usuario;
  return next();
}

async function intentarAdjuntarUsuario(req, _res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return next();

  try {
    const usuario = await resolveUserFromToken(token);
    // Adjuntamos el usuario incluso si está suspendido
    // porque este middleware es opcional y no debe bloquear
    req.usuario = usuario;
    req.user = usuario;
  } catch (error) {
    if (!(error instanceof jwt.JsonWebTokenError)) {
      console.warn('No se pudo adjuntar usuario desde token opcional:', error.message);
    }
  }

  return next();
}

function verificarEstado(req, res, next) {
  const estado = (req.usuario?.estado || 'activo').toLowerCase();
  if (estado === 'suspendido') {
    return res.status(403).json({ mensaje: 'Tu cuenta está suspendida. Contacta con soporte.' });
  }
  req.estadoUsuario = estado;
  return next();
}

function verificarRol(rolesPermitidos = []) {
  const roles = Array.isArray(rolesPermitidos) ? rolesPermitidos : [rolesPermitidos];
  const normalized = roles.map((role) => String(role).toLowerCase());

  return (req, res, next) => {
    const rol = String(req.usuario?.rol || '').toLowerCase();
    if (normalized.includes(rol)) {
      return next();
    }
    return res.status(403).json({ mensaje: 'Acceso no autorizado para este recurso' });
  };
}

function soloAdmin(req, res, next) {
  return verificarRol(['admin'])(req, res, next);
}

module.exports = {
  verificarToken,
  verificarEstado,
  verificarRol,
  intentarAdjuntarUsuario,
  soloAdmin,
};

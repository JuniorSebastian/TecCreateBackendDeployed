const {
  listUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
  deleteUserById,
  listPresentationsByUserId,
  ROLE_VALUES,
  STATUS_VALUES,
} = require('../services/usuariosService');

const parseIdParam = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const handleServiceError = (res, error) => {
  // Columnas opcionales ausentes → devolver 501 Not Implemented (degradación funcional)
  if (error.code === 'ROLE_COLUMN_MISSING') {
    return res.status(501).json({
      error: 'La columna rol no existe en la tabla usuarios. Operación no implementada en este esquema.',
      solucion: 'Agrega la columna rol (admin|usuario) o usa solo lectura.',
      sqlSugerido:
        "ALTER TABLE usuarios ADD COLUMN rol VARCHAR(20); UPDATE usuarios SET rol='usuario' WHERE rol IS NULL;",
    });
  }
  if (error.code === 'STATUS_COLUMN_MISSING') {
    return res.status(501).json({
      error: 'La columna estado no existe en la tabla usuarios. Operación no implementada en este esquema.',
      solucion: 'Agrega la columna estado (activo|inactivo|suspendido) o usa solo lectura.',
      sqlSugerido:
        "ALTER TABLE usuarios ADD COLUMN estado VARCHAR(20); UPDATE usuarios SET estado='activo' WHERE estado IS NULL;",
    });
  }

  // Validaciones de entrada incorrecta → 400
  if (error.code === 'INVALID_ROLE' || error.code === 'INVALID_STATUS') {
    return res.status(400).json({ error: error.message });
  }

  console.error('❌ Error en gestión de usuarios:', error);
  return res.status(500).json({ error: 'Error interno al procesar la solicitud' });
};

const sanitizeRole = (value) => {
  if (!value) return undefined;
  const normalized = String(value).trim().toLowerCase();
  return normalized && ROLE_VALUES.includes(normalized) ? normalized : normalized;
};

const sanitizeStatus = (value) => {
  if (!value) return undefined;
  const normalized = String(value).trim().toLowerCase();
  return normalized && STATUS_VALUES.includes(normalized) ? normalized : normalized;
};

exports.listarUsuarios = async (req, res) => {
  try {
    const search = req.query.q ?? req.query.search ?? null;
    const rol = sanitizeRole(req.query.rol ?? req.query.role);
    const estado = sanitizeStatus(req.query.estado ?? req.query.status);
    const limit = req.query.limit;
    const offset = req.query.offset;

    const resultado = await listUsers({ search, rol, estado, limit, offset });
    res.json(resultado);
  } catch (error) {
    handleServiceError(res, error);
  }
};

exports.obtenerUsuarioDetalle = async (req, res) => {
  const id = parseIdParam(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Identificador de usuario inválido' });
  }

  try {
    const usuario = await getUserById(id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(usuario);
  } catch (error) {
    handleServiceError(res, error);
  }
};

exports.listarPresentacionesDeUsuario = async (req, res) => {
  const id = parseIdParam(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Identificador de usuario inválido' });
  }

  try {
    const usuario = await getUserById(id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const limit = req.query.limit;
    const offset = req.query.offset;
    const presentaciones = await listPresentationsByUserId(id, { limit, offset });

    res.json({
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
      },
      ...presentaciones,
    });
  } catch (error) {
    handleServiceError(res, error);
  }
};

exports.actualizarRolUsuario = async (req, res) => {
  const id = parseIdParam(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Identificador de usuario inválido' });
  }

  const rol = sanitizeRole(req.body?.rol);
  if (!rol || !ROLE_VALUES.includes(rol)) {
    return res.status(400).json({
      error: 'Rol no válido. Usa admin, soporte o usuario.',
      rolesDisponibles: ROLE_VALUES,
    });
  }

  if (req.usuario?.id && Number(req.usuario.id) === id && rol !== 'admin') {
    return res.status(400).json({
      error: 'No puedes modificar tu propio rol a uno inferior.',
    });
  }

  try {
    const actualizado = await updateUserRole(id, rol);
    if (!actualizado) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    console.info('[AUDITORIA] Rol actualizado', {
      ejecutor: req.usuario?.email,
      usuarioObjetivo: actualizado.email,
      rolNuevo: actualizado.rol,
    });

    res.json({ mensaje: 'Rol actualizado', usuario: actualizado });
  } catch (error) {
    handleServiceError(res, error);
  }
};

exports.actualizarEstadoUsuario = async (req, res) => {
  const id = parseIdParam(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Identificador de usuario inválido' });
  }

  const estado = sanitizeStatus(req.body?.estado);
  if (!estado || !STATUS_VALUES.includes(estado)) {
    return res.status(400).json({
      error: 'Estado no válido. Usa activo, inactivo o suspendido.',
      estadosDisponibles: STATUS_VALUES,
    });
  }

  try {
    const usuarioObjetivo = await getUserById(id);
    if (!usuarioObjetivo) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const actorRol = (req.usuario?.rol || '').toLowerCase();
    const objetivoRol = (usuarioObjetivo.rol || 'usuario').toLowerCase();
    const actorEsSoporte = actorRol === 'soporte';

    const esMismaPersona = Number(req.usuario?.id || 0) === usuarioObjetivo.id;
    const nuevoEstadoEsSuspension = estado === 'suspendido';
    const objetivoEsAdmin = (usuarioObjetivo.rol || '').toLowerCase() === 'admin';

    if (actorEsSoporte && objetivoRol !== 'usuario') {
      return res.status(403).json({
        error: 'Solo puedes modificar el estado de usuarios finales.',
        rolPermitido: 'usuario',
        rolObjetivo: objetivoRol,
      });
    }

    if (actorEsSoporte && esMismaPersona && nuevoEstadoEsSuspension) {
      return res.status(400).json({
        error: 'No puedes suspender tu propia cuenta.',
      });
    }

    if (nuevoEstadoEsSuspension) {
      if (esMismaPersona) {
        return res.status(400).json({
          error: 'No puedes suspender tu propia cuenta.',
        });
      }

      if (objetivoEsAdmin) {
        return res.status(400).json({
          error: 'No puedes suspender a otros administradores.',
        });
      }
    }

    const actualizado = await updateUserStatus(id, estado);
    if (!actualizado) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    console.info('[AUDITORIA] Estado actualizado', {
      ejecutor: req.usuario?.email,
      usuarioObjetivo: actualizado.email,
      estadoNuevo: actualizado.estado,
    });

    res.json({ mensaje: 'Estado actualizado', usuario: actualizado });
  } catch (error) {
    handleServiceError(res, error);
  }
};

exports.eliminarUsuario = async (req, res) => {
  const id = parseIdParam(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Identificador de usuario inválido' });
  }

  try {
    const eliminado = await deleteUserById(id);
    if (!eliminado) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json({ mensaje: 'Usuario eliminado correctamente' });
  } catch (error) {
    handleServiceError(res, error);
  }
};

exports.obtenerCatalogosUsuarios = async (req, res) => {
  try {
    res.json({ roles: ROLE_VALUES, estados: STATUS_VALUES });
  } catch (error) {
    handleServiceError(res, error);
  }
};

/**
 * Controlador principal para funcionalidades del rol Soporte.
 */
const {
  getLatestMaintenance,
} = require('../services/maintenanceService');
const soporteService = require('../services/soporteService');
const { normalizeStatus } = require('../utils/supportReports');

const parsePositiveInt = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

/**
 * @route GET /soporte/mantenimiento
 * @summary Devuelve el estado actual del modo mantenimiento.
 */
exports.obtenerEstadoMantenimiento = async (_req, res) => {
  try {
    const estado = await getLatestMaintenance();
    return res.json({ ok: true, data: estado });
  } catch (error) {
    console.error('Error al obtener estado de mantenimiento:', error);
    return res.status(500).json({ ok: false, error: 'No se pudo obtener el estado de mantenimiento.' });
  }
};

/**
 * @route PATCH /soporte/mantenimiento
 * @summary Activa o desactiva el modo mantenimiento.
 */
exports.actualizarModoMantenimiento = async (req, res) => {
  try {
    const { activo, mensaje } = req.body || {};
    if (typeof activo !== 'boolean') {
      return res.status(400).json({ ok: false, error: 'El parámetro "activo" debe ser booleano.' });
    }

    const soporteEmail = req.usuario?.email || null;
    const resultado = await soporteService.updateMaintenanceState({
      activo,
      mensaje,
      soporteEmail,
    });

    if (!resultado.changed) {
      return res.json({ ok: true, data: resultado.record, message: 'No se detectaron cambios en el modo mantenimiento.' });
    }

    return res.json({
      ok: true,
      data: resultado.record,
      message: activo ? 'Modo mantenimiento activado correctamente.' : 'Modo mantenimiento desactivado correctamente.',
    });
  } catch (error) {
    console.error('Error al actualizar modo mantenimiento:', error);
    return res.status(500).json({ ok: false, error: 'No se pudo actualizar el modo mantenimiento.' });
  }
};

/**
 * @route GET /soporte/usuarios
 * @summary Lista de usuarios para personal de soporte (solo lectura).
 */
exports.listarUsuarios = async (req, res) => {
  try {
    const { rol, estado, limit, offset } = req.query;
    const usuarios = await soporteService.listUsersForSupport({ rol, estado, limit, offset });
    return res.json({ ok: true, data: usuarios });
  } catch (error) {
    console.error('Error al listar usuarios (soporte):', error);
    return res.status(500).json({ ok: false, error: 'No se pudieron recuperar los usuarios.' });
  }
};

/**
 * @route GET /soporte/usuarios/:email
 * @summary Obtiene información puntual de un usuario.
 */
exports.obtenerUsuarioPorEmail = async (req, res) => {
  try {
    const usuario = await soporteService.getUserByEmail(req.params.email);
    if (!usuario) {
      return res.status(404).json({ ok: false, error: 'Usuario no encontrado.' });
    }
    return res.json({ ok: true, data: usuario });
  } catch (error) {
    console.error('Error al obtener usuario para soporte:', error);
    return res.status(500).json({ ok: false, error: 'No se pudo obtener la información del usuario.' });
  }
};

exports.listarPresentacionesDeUsuario = async (req, res) => {
  try {
    const userId = parsePositiveInt(req.params.id);
    if (!userId) {
      return res.status(400).json({ ok: false, error: 'Identificador de usuario inválido.' });
    }

    const { limit, offset } = req.query;
    const resultado = await soporteService.listPresentationsForSupport({ userId, limit, offset });

    if (!resultado.usuario) {
      return res.status(404).json({ ok: false, error: 'Usuario no encontrado.' });
    }

    return res.json({
      ok: true,
      data: {
        usuario: resultado.usuario,
        presentaciones: resultado.presentaciones,
        pagination: resultado.pagination,
      },
      usuario: resultado.usuario,
      presentaciones: resultado.presentaciones,
      pagination: resultado.pagination,
    });
  } catch (error) {
    console.error('Error al listar presentaciones para soporte:', error);
    return res.status(500).json({ ok: false, error: 'No se pudieron obtener las presentaciones del usuario.' });
  }
};

exports.obtenerPresentacionDeUsuario = async (req, res) => {
  try {
    const userId = parsePositiveInt(req.params.id);
    const presentacionId = parsePositiveInt(req.params.presentacionId);

    if (!userId || !presentacionId) {
      return res.status(400).json({ ok: false, error: 'Identificadores inválidos para la consulta de presentación.' });
    }

    const resultado = await soporteService.getPresentationForSupport({ userId, presentacionId });

    if (!resultado.usuario) {
      return res.status(404).json({ ok: false, error: 'Usuario no encontrado.' });
    }

    if (!resultado.presentacion) {
      return res.status(404).json({ ok: false, error: 'Presentación no encontrada para el usuario indicado.' });
    }

    return res.json({
      ok: true,
      data: {
        usuario: resultado.usuario,
        presentacion: resultado.presentacion,
      },
      usuario: resultado.usuario,
      presentacion: resultado.presentacion,
    });
  } catch (error) {
    console.error('Error al obtener presentación para soporte:', error);
    return res.status(500).json({ ok: false, error: 'No se pudo obtener la presentación solicitada.' });
  }
};

/**
 * @route GET /soporte/reportes
 * @summary Lista todos los reportes de soporte disponibles.
 */
exports.listarReportes = async (req, res) => {
  try {
    const { categoria, estado, search } = req.query;
    const reportes = await soporteService.listSupportReports({ categoria, estado, search });
    return res.json({ ok: true, data: reportes });
  } catch (error) {
    console.error('Error al listar reportes para soporte:', error);
    return res.status(500).json({ ok: false, error: 'No se pudieron recuperar los reportes.' });
  }
};

/**
 * @route PATCH /soporte/reportes/:id
 * @summary Actualiza el estado de un reporte y registra al agente que lo atiende.
 */
exports.actualizarReporte = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body || {};

    if (!estado || !normalizeStatus(estado)) {
      return res.status(400).json({ ok: false, error: 'Debes proporcionar un estado válido (pendiente, en_proceso, resuelto).' });
    }

    const actualizado = await soporteService.updateReportState({
      id,
      estado,
      soporteEmail: req.usuario?.email || null,
    });

    if (!actualizado) {
      return res.status(404).json({ ok: false, error: 'Reporte no encontrado.' });
    }

    return res.json({
      ok: true,
      data: actualizado,
      message: 'Estado del reporte actualizado correctamente.',
    });
  } catch (error) {
    console.error('Error al actualizar reporte (soporte):', error);
    return res.status(500).json({ ok: false, error: 'No se pudo actualizar el reporte de soporte.' });
  }
};

/**
 * @route GET /soporte/reportes/metricas
 * @summary Devuelve métricas agregadas del módulo de reportes.
 */
exports.obtenerMetricasReportes = async (_req, res) => {
  try {
    const metricas = await soporteService.getReportMetrics();
    return res.json({ ok: true, data: metricas });
  } catch (error) {
    console.error('Error al obtener métricas de reportes (soporte):', error);
    return res.status(500).json({ ok: false, error: 'No se pudieron obtener las métricas de reportes.' });
  }
};

/**
 * @route GET /soporte/reportes/exportar
 * @summary Exporta los reportes en formato CSV.
 */
exports.exportarReportes = async (req, res) => {
  try {
    const { categoria, estado, formato } = req.query;
    const csv = await soporteService.exportReportsAsCsv({ categoria, estado });
    const buffer = Buffer.from(csv, 'utf8');

    const shouldStreamFile = typeof formato === 'string'
      ? ['archivo', 'csv', 'stream'].includes(formato.toLowerCase())
      : req.headers.accept?.includes('text/csv');

    if (shouldStreamFile) {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="reportes_soporte.csv"');
      return res.status(200).send(buffer);
    }

    return res.json({
      ok: true,
      data: {
        filename: 'reportes_soporte.csv',
        mimeType: 'text/csv; charset=utf-8',
        base64: buffer.toString('base64'),
        size: buffer.length,
      },
      message: 'Exportación generada. Decodifica el campo base64 para obtener el CSV.',
    });
  } catch (error) {
    console.error('Error al exportar reportes (soporte):', error);
    return res.status(500).json({ ok: false, error: 'No se pudieron exportar los reportes.' });
  }
};

/**
 * @route GET /soporte/historial/mantenimientos
 * @summary Lista el historial completo de cambios en modo mantenimiento.
 */
exports.listarHistorialMantenimientos = async (req, res) => {
  try {
    const { limit, offset } = req.query;
    const historial = await soporteService.listMaintenanceHistoryEntries({ limit, offset });
    return res.json({ ok: true, data: historial });
  } catch (error) {
    console.error('Error al listar historial de mantenimiento:', error);
    return res.status(500).json({ ok: false, error: 'No se pudo obtener el historial de mantenimiento.' });
  }
};

/**
 * @route GET /soporte/historial/reportes
 * @summary Lista las acciones del equipo de soporte relacionadas a reportes.
 */
exports.listarHistorialReportes = async (req, res) => {
  try {
    const { limit, offset } = req.query;
    const historial = await soporteService.listReportHistory({ limit, offset });
    return res.json({ ok: true, data: historial });
  } catch (error) {
    console.error('Error al listar historial de reportes (soporte):', error);
    return res.status(500).json({ ok: false, error: 'No se pudo obtener el historial de reportes.' });
  }
};

/**
 * @route GET /soporte/logs
 * @summary Listado de logs del sistema filtrables por tipo y origen.
 */
exports.listarLogsSistema = async (req, res) => {
  try {
    const { tipo, origen, limit, offset } = req.query;
    const logs = await soporteService.getSupportLogs({ tipo, origen, limit, offset });
    return res.json({ ok: true, data: logs });
  } catch (error) {
    console.error('Error al listar logs del sistema (soporte):', error);
    return res.status(500).json({ ok: false, error: 'No se pudieron obtener los logs del sistema.' });
  }
};

/**
 * @route POST /soporte/logs
 * @summary Registra un log manual desde el panel de soporte.
 */
exports.crearLogSistema = async (req, res) => {
  try {
    const { tipo, origen, mensaje, usuarioEmail } = req.body || {};
    if (!tipo || !mensaje) {
      return res.status(400).json({ ok: false, error: 'Los campos "tipo" y "mensaje" son obligatorios para registrar un log.' });
    }

    const log = await soporteService.createSupportLog({ tipo, origen, mensaje, usuarioEmail });
    return res.status(201).json({ ok: true, data: log, message: 'Log registrado correctamente.' });
  } catch (error) {
    console.error('Error al crear log del sistema (soporte):', error);
    return res.status(500).json({ ok: false, error: 'No se pudo registrar el log del sistema.' });
  }
};

/**
 * @route GET /soporte/notificaciones
 * @summary Obtiene las notificaciones generadas para el equipo de soporte.
 */
exports.listarNotificaciones = async (req, res) => {
  try {
    const { soloNoLeidas, limit, offset } = req.query;
    const notificaciones = await soporteService.listSupportNotifications({
      soloNoLeidas: soloNoLeidas === 'true',
      limit,
      offset,
    });
    return res.json({ ok: true, data: notificaciones });
  } catch (error) {
    console.error('Error al listar notificaciones (soporte):', error);
    return res.status(500).json({ ok: false, error: 'No se pudieron obtener las notificaciones.' });
  }
};

/**
 * @route PATCH /soporte/notificaciones/:id/leido
 * @summary Marca una notificación como leída.
 */
exports.marcarNotificacionLeida = async (req, res) => {
  try {
    const { id } = req.params;
    const actualizada = await soporteService.markNotificationAsRead(id);
    if (!actualizada) {
      return res.status(404).json({ ok: false, error: 'Notificación no encontrada.' });
    }
    return res.json({ ok: true, data: actualizada, message: 'Notificación marcada como leída.' });
  } catch (error) {
    console.error('Error al marcar notificación como leída (soporte):', error);
    return res.status(500).json({ ok: false, error: 'No se pudo actualizar la notificación.' });
  }
};

/**
 * @route POST /soporte/notificaciones
 * @summary Crea una notificación manual para el equipo de soporte.
 */
exports.crearNotificacion = async (req, res) => {
  try {
    const { tipo, mensaje } = req.body || {};
    if (!tipo || !mensaje) {
      return res.status(400).json({ ok: false, error: 'Los campos "tipo" y "mensaje" son obligatorios.' });
    }

    const notificacion = await soporteService.createSupportNotification({ tipo, mensaje });
    return res.status(201).json({ ok: true, data: notificacion, message: 'Notificación creada correctamente.' });
  } catch (error) {
    console.error('Error al crear notificación (soporte):', error);
    return res.status(500).json({ ok: false, error: 'No se pudo crear la notificación.' });
  }
};

/**
 * @route DELETE /soporte/reportes/:id
 * @summary Marca un reporte como eliminado (soft delete) para el equipo de soporte.
 */
exports.eliminarReporte = async (req, res) => {
  try {
    const { id } = req.params;
    const eliminado = await soporteService.deleteReport({
      id,
      soporteEmail: req.usuario?.email || null,
    });

    if (!eliminado) {
      return res.status(404).json({ ok: false, error: 'Reporte no encontrado o ya fue eliminado.' });
    }

    return res.json({
      ok: true,
      data: eliminado,
      message: 'Reporte eliminado correctamente.',
    });
  } catch (error) {
    console.error('Error al eliminar reporte (soporte):', error);
    return res.status(500).json({ ok: false, error: 'No se pudo eliminar el reporte de soporte.' });
  }
};

/**
 * @route GET /soporte/reportes/:id/comentarios
 * @summary Devuelve la lista de comentarios asociados a un reporte.
 */
exports.listarComentariosReporte = async (req, res) => {
  try {
    const { id } = req.params;
    const reporte = await soporteService.getReportWithComments(id, { includeComments: true });

    if (!reporte) {
      return res.status(404).json({ ok: false, error: 'Reporte no encontrado.' });
    }

    return res.json({ ok: true, data: reporte.comentarios || [] });
  } catch (error) {
    console.error('Error al listar comentarios de reporte (soporte):', error);
    return res.status(500).json({ ok: false, error: 'No se pudieron obtener los comentarios del reporte.' });
  }
};

/**
 * @route POST /soporte/reportes/:id/comentarios
 * @summary Crea un comentario asociado a un reporte de soporte.
 */
exports.crearComentarioReporte = async (req, res) => {
  try {
    const { id } = req.params;
    const { mensaje, tipo } = req.body || {};

    if (typeof mensaje !== 'string' || !mensaje.trim()) {
      return res.status(400).json({ ok: false, error: 'El comentario no puede estar vacío.' });
    }

    const comentario = await soporteService.addCommentToReport({
      id,
      soporteEmail: req.usuario?.email || null,
      mensaje: mensaje.trim(),
      tipo,
    });

    if (!comentario) {
      return res.status(404).json({ ok: false, error: 'Reporte no encontrado o no disponible.' });
    }

    return res.status(201).json({
      ok: true,
      data: comentario,
      message: 'Comentario agregado correctamente.',
    });
  } catch (error) {
    console.error('Error al crear comentario de reporte (soporte):', error);
    return res.status(500).json({ ok: false, error: 'No se pudo crear el comentario para el reporte.' });
  }
};

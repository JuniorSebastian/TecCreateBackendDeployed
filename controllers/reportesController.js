const {
  createSupportReport,
  listSupportReports,
  updateSupportReportState,
  deleteSupportReport,
} = require('../services/reportesService');
const {
  listSupportCategories,
  listSupportStatuses,
  normalizeCategory,
  normalizeStatus,
} = require('../lib/supportReports');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const sanitizeText = (value) => {
  if (typeof value !== 'string') {
    return '';
  }
  return value.replace(/\s+/g, ' ').trim();
};

const buildResumenFromMessage = (mensaje, { maxLength = 140 } = {}) => {
  if (typeof mensaje !== 'string') {
    return '';
  }

  const normalized = mensaje.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return '';
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trim()}…`;
};

const pickField = (body, keys = []) => {
  if (!body || typeof body !== 'object') {
    return undefined;
  }
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(body, key) && body[key] != null) {
      return body[key];
    }
  }
  return undefined;
};

const pickFieldByPredicate = (body, predicate) => {
  if (!body || typeof body !== 'object' || typeof predicate !== 'function') {
    return undefined;
  }

  for (const [key, value] of Object.entries(body)) {
    if (predicate(key, value)) {
      return value;
    }
  }

  return undefined;
};

exports.obtenerCategoriasReportes = (req, res) => {
  res.json({ categorias: listSupportCategories() });
};

exports.obtenerEstadosReportes = (req, res) => {
  res.json({ estados: listSupportStatuses() });
};

exports.crearReporteSoporte = async (req, res) => {
  try {
    const rawNombre = pickField(req.body, ['nombre', 'nombreCompleto', 'fullName', 'name']);
    let nombre = sanitizeText(rawNombre);

    const rawCorreo = pickField(req.body, ['correo', 'email', 'correoContacto']);
    let correo = sanitizeText(rawCorreo);

    const rawCategoria = pickField(req.body, ['categoria', 'category']);
    const categoriaFuente = sanitizeText(rawCategoria);
    let categoria = normalizeCategory(categoriaFuente);
    let categoriaOriginal = categoriaFuente;
    if (!categoria) {
      const fallbackCategoriaRaw = pickFieldByPredicate(
        req.body,
        (key, value) => typeof key === 'string'
          && key.toLowerCase().includes('categoria')
          && typeof value === 'string'
          && value.trim(),
      );
      const fallbackCategoria = sanitizeText(fallbackCategoriaRaw);
      categoriaOriginal = categoriaOriginal || fallbackCategoria;
      categoria = normalizeCategory(fallbackCategoria);
    }

  let resumen = sanitizeText(pickField(req.body, ['resumen', 'summary', 'resumenBreve', 'shortSummary', 'detalle']) || '');
    const rawMensaje = pickField(req.body, ['mensaje', 'message']);
    const mensajeFuente = rawMensaje ?? pickFieldByPredicate(
      req.body,
      (key, value) => typeof key === 'string'
        && key.toLowerCase().includes('mensaje')
        && typeof value === 'string'
    );
    const mensaje = typeof mensajeFuente === 'string' ? mensajeFuente.trim() : '';

  const usuarioEmail = req.usuario?.email || req.user?.email || null;
    const usuarioNombre = sanitizeText(
      req.usuario?.nombre
      || req.usuario?.name
      || (usuarioEmail ? usuarioEmail.split('@')[0] : ''),
    );

    if (usuarioEmail) {
      correo = usuarioEmail;
    }

    if (!nombre && usuarioNombre) {
      nombre = usuarioNombre;
    }

    if (!nombre || nombre.length < 2) {
      return res.status(400).json({ error: 'El nombre es obligatorio.' });
    }

    if (!correo || !EMAIL_REGEX.test(correo)) {
      return res.status(400).json({ error: 'Debes proporcionar un correo válido.' });
    }

    if (!categoria) {
      return res.status(400).json({
        error: 'Categoría no válida.',
        categoriaRecibida: categoriaOriginal || null,
        categoriasDisponibles: listSupportCategories(),
      });
    }

    if (!mensaje || mensaje.length < 5) {
      return res.status(400).json({ error: 'El mensaje debe contener al menos 5 caracteres.' });
    }

    if (!resumen) {
      resumen = buildResumenFromMessage(mensaje);
    }

    const report = await createSupportReport({
  usuarioEmail: usuarioEmail || correo,
      nombre,
      correo,
      categoria,
      resumen: resumen || null,
      mensaje,
    });

    res.status(201).json(report);
  } catch (error) {
    console.error('Error al crear reporte de soporte:', error);
    res.status(500).json({ error: 'No se pudo registrar el reporte de soporte.' });
  }
};

exports.listarReportesSoporte = async (req, res) => {
  try {
  const categoriaQuery = pickField(req.query, ['categoria', 'category']);
  const estadoQuery = pickField(req.query, ['estado', 'status']);
  const search = sanitizeText(pickField(req.query, ['q', 'search']) || '');

    const categoria = categoriaQuery ? normalizeCategory(categoriaQuery) : null;
    if (categoriaQuery && !categoria) {
      return res.status(400).json({
        error: 'Categoría no válida.',
        categoriasDisponibles: listSupportCategories(),
      });
    }

    const estado = estadoQuery ? normalizeStatus(estadoQuery) : null;
    if (estadoQuery && !estado) {
      return res.status(400).json({
        error: 'Estado no válido.',
        estadosDisponibles: listSupportStatuses(),
      });
    }

    const reports = await listSupportReports({
      categoria,
      estado,
      search: search || '',
    });

    res.json(reports);
  } catch (error) {
    console.error('Error al listar reportes de soporte:', error);
    res.status(500).json({ error: 'No se pudieron recuperar los reportes de soporte.' });
  }
};

exports.actualizarEstadoReporte = async (req, res) => {
  try {
    const { id } = req.params;
    let rawEstado = pickField(req.body, ['estado', 'status', 'estadoKey', 'statusKey', 'nuevoEstado']);
    if (rawEstado && typeof rawEstado === 'object') {
      rawEstado = pickField(rawEstado, ['key', 'value', 'label']);
    }
    if (!rawEstado && typeof req.body?.estado === 'object' && req.body.estado !== null) {
      rawEstado = pickField(req.body.estado, ['key', 'value', 'label']);
    }
    if (!rawEstado && typeof req.body?.status === 'object' && req.body.status !== null) {
      rawEstado = pickField(req.body.status, ['key', 'value', 'label']);
    }
    const nuevoEstado = normalizeStatus(rawEstado);

    if (!nuevoEstado) {
      return res.status(400).json({
        error: 'Estado no válido. Usa pendiente, en_proceso o resuelto.',
        estadosDisponibles: listSupportStatuses(),
      });
    }

    const updated = await updateSupportReportState(id, nuevoEstado, {
      atendidoPor: req.usuario?.email || req.user?.email || null,
    });

    if (!updated) {
      return res.status(404).json({ error: 'Reporte de soporte no encontrado.' });
    }

  res.json(updated);
  } catch (error) {
    console.error('Error al actualizar reporte de soporte:', error);
    res.status(500).json({ error: 'No se pudo actualizar el reporte de soporte.' });
  }
};

exports.eliminarReporteSoporte = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await deleteSupportReport(id);

    if (!deleted) {
      return res.status(404).json({ error: 'Reporte de soporte no encontrado.' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error al eliminar reporte de soporte:', error);
    res.status(500).json({ error: 'No se pudo eliminar el reporte de soporte.' });
  }
};

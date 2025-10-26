const pool = require('../database');
const {
  DEFAULT_MAINTENANCE_MESSAGE,
  getLatestMaintenance,
  insertMaintenanceRecord,
  listMaintenanceHistory,
} = require('./maintenanceService');
const {
  listSupportReports,
  updateSupportReportState,
  getSupportReportMetrics,
  getSupportReportRawList,
  softDeleteSupportReport,
  listReportComments,
  createReportComment,
  getSupportReportById,
} = require('./reportesService');
const {
  getUserById,
  listPresentationsByUserId,
} = require('./usuariosService');
const {
  obtenerPresentacionPorId,
} = require('./presentacionService');

const normalizeUserRow = (row) => ({
  id: row.id,
  nombre: row.nombre,
  email: row.email,
  foto: row.foto,
  rol: (row.rol || 'usuario').toLowerCase(),
  estado: (row.estado || 'activo').toLowerCase(),
  fecha_registro: row.fecha_registro,
});

const normalizeSupportHistoryRow = (row) => ({
  id: row.id,
  soporte_email: row.soporte_email,
  accion: row.accion,
  detalle: row.detalle,
  fecha: row.fecha,
});

const normalizeLogRow = (row) => ({
  id: row.id,
  tipo: row.tipo,
  origen: row.origen,
  mensaje: row.mensaje,
  usuario_email: row.usuario_email,
  fecha: row.fecha,
});

const normalizeNotificationRow = (row) => ({
  id: row.id,
  tipo: row.tipo,
  mensaje: row.mensaje,
  leido: row.leido,
  creado_en: row.creado_en,
});

const ensurePagination = (value, fallback) => {
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric < 0) {
    return fallback;
  }
  return numeric;
};

async function listUsersForSupport({ rol, estado, limit = 50, offset = 0 } = {}) {
  const filters = [];
  const values = [];
  let param = 1;

  if (rol) {
    filters.push(`LOWER(rol) = LOWER($${param})`);
    values.push(rol);
    param += 1;
  }

  if (estado) {
    filters.push(`LOWER(estado) = LOWER($${param})`);
    values.push(estado);
    param += 1;
  }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const query = `
    SELECT id, nombre, email, foto, rol, estado, fecha_registro
    FROM usuarios
    ${whereClause}
    ORDER BY fecha_registro DESC
    LIMIT $${param} OFFSET $${param + 1}
  `;

  values.push(ensurePagination(limit, 50));
  values.push(ensurePagination(offset, 0));

  const { rows } = await pool.query(query, values);
  return rows.map(normalizeUserRow);
}

async function getUserByEmail(email) {
  const query = `
    SELECT id, nombre, email, foto, rol, estado, fecha_registro
    FROM usuarios
    WHERE LOWER(email) = LOWER($1)
    LIMIT 1
  `;
  const { rows } = await pool.query(query, [email]);
  if (!rows.length) {
    return null;
  }
  return normalizeUserRow(rows[0]);
}

async function recordSupportAction({ soporteEmail, accion, detalle }) {
  const query = `
    INSERT INTO historial_acciones_soporte (soporte_email, accion, detalle)
    VALUES ($1, $2, $3)
  `;
  await pool.query(query, [soporteEmail || null, accion, detalle || null]);
}

async function createSupportNotification({ tipo, mensaje }) {
  const query = `
    INSERT INTO notificaciones_soporte (tipo, mensaje)
    VALUES ($1, $2)
    RETURNING id, tipo, mensaje, leido, creado_en
  `;
  const { rows } = await pool.query(query, [tipo, mensaje]);
  return normalizeNotificationRow(rows[0]);
}

async function updateMaintenanceState({ activo, mensaje, soporteEmail }) {
  const latest = await getLatestMaintenance();
  if (Boolean(latest.activo) === Boolean(activo) && (!mensaje || mensaje === latest.mensaje)) {
    return {
      changed: false,
      record: latest,
    };
  }

  const record = await insertMaintenanceRecord({
    activo,
    mensaje: mensaje || DEFAULT_MAINTENANCE_MESSAGE,
    activadoPor: soporteEmail || null,
  });

  const detalle = activo
    ? `Activó el modo mantenimiento con mensaje: "${record.mensaje}"`
    : 'Desactivó el modo mantenimiento';

  await recordSupportAction({
    soporteEmail,
    accion: 'modo_mantenimiento',
    detalle,
  });

  await createSupportNotification({
    tipo: 'mantenimiento',
    mensaje: activo
      ? 'Modo mantenimiento activado para usuarios finales.'
      : 'Modo mantenimiento desactivado. El sistema está disponible nuevamente.',
  });

  return {
    changed: true,
    record,
  };
}

async function listMaintenanceRecords(params) {
  const limit = ensurePagination(params?.limit, 50);
  const offset = ensurePagination(params?.offset, 0);
  return listMaintenanceHistory({ limit, offset });
}

async function listReportHistory({ limit = 50, offset = 0 } = {}) {
  const query = `
    SELECT id, soporte_email, accion, detalle, fecha
    FROM historial_acciones_soporte
    WHERE accion IN ('reporte_estado', 'reporte_comentario', 'reporte_eliminado')
    ORDER BY fecha DESC
    LIMIT $1 OFFSET $2
  `;
  const { rows } = await pool.query(query, [ensurePagination(limit, 50), ensurePagination(offset, 0)]);
  return rows.map(normalizeSupportHistoryRow);
}

async function listMaintenanceHistoryEntries({ limit = 50, offset = 0 } = {}) {
  return listMaintenanceHistory({ limit: ensurePagination(limit, 50), offset: ensurePagination(offset, 0) });
}

async function getSupportLogs({ tipo, origen, limit = 100, offset = 0 } = {}) {
  const filters = [];
  const values = [];
  let param = 1;

  if (tipo) {
    filters.push(`LOWER(tipo) = LOWER($${param})`);
    values.push(tipo);
    param += 1;
  }

  if (origen) {
    filters.push(`LOWER(origen) = LOWER($${param})`);
    values.push(origen);
    param += 1;
  }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const query = `
    SELECT id, tipo, origen, mensaje, usuario_email, fecha
    FROM logs_sistema
    ${whereClause}
    ORDER BY fecha DESC
    LIMIT $${param} OFFSET $${param + 1}
  `;

  values.push(ensurePagination(limit, 100));
  values.push(ensurePagination(offset, 0));

  const { rows } = await pool.query(query, values);
  return rows.map(normalizeLogRow);
}

async function createSupportLog({ tipo, origen, mensaje, usuarioEmail }) {
  const query = `
    INSERT INTO logs_sistema (tipo, origen, mensaje, usuario_email)
    VALUES ($1, $2, $3, $4)
    RETURNING id, tipo, origen, mensaje, usuario_email, fecha
  `;
  const { rows } = await pool.query(query, [tipo, origen || null, mensaje, usuarioEmail || null]);
  return normalizeLogRow(rows[0]);
}

async function listSupportNotifications({ soloNoLeidas = false, limit = 50, offset = 0 } = {}) {
  const filters = [];
  const values = [];
  let param = 1;

  if (soloNoLeidas) {
    filters.push('leido = FALSE');
  }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const query = `
    SELECT id, tipo, mensaje, leido, creado_en
    FROM notificaciones_soporte
    ${whereClause}
    ORDER BY creado_en DESC
    LIMIT $${param} OFFSET $${param + 1}
  `;

  values.push(ensurePagination(limit, 50));
  values.push(ensurePagination(offset, 0));

  const { rows } = await pool.query(query, values);
  return rows.map(normalizeNotificationRow);
}

async function markNotificationAsRead(id) {
  const query = `
    UPDATE notificaciones_soporte
    SET leido = TRUE
    WHERE id = $1
    RETURNING id, tipo, mensaje, leido, creado_en
  `;
  const { rows } = await pool.query(query, [id]);
  if (!rows.length) {
    return null;
  }
  return normalizeNotificationRow(rows[0]);
}

const CSV_HEADERS = [
  'id',
  'categoria',
  'estado',
  'atendido_por',
  'nombre',
  'correo',
  'resumen',
  'mensaje',
  'creado_en',
  'actualizado_en',
  'resuelto_en',
];

const escapeCsv = (value) => {
  if (value == null) {
    return '';
  }
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

async function exportReportsAsCsv(filters) {
  const reports = await getSupportReportRawList(filters || {});
  const rows = reports.map((report) => [
    report.id,
    report.categoria,
    report.estado,
    report.atendido_por || '',
    report.nombre,
    report.correo,
    report.resumen,
    report.mensaje,
    report.creado_en,
    report.actualizado_en,
    report.resuelto_en || '',
  ].map(escapeCsv).join(','));

  return [CSV_HEADERS.join(','), ...rows].join('\n');
}

async function updateReportState({ id, estado, soporteEmail }) {
  const updated = await updateSupportReportState(id, estado, { atendidoPor: soporteEmail || null });
  if (!updated) {
    return null;
  }

  await recordSupportAction({
    soporteEmail,
    accion: 'reporte_estado',
    detalle: `Cambió el estado del reporte #${updated.id} a ${updated.estadoKey}`,
  });

  await createSupportNotification({
    tipo: 'nuevo_estado_reporte',
    mensaje: `Reporte #${updated.id} actualizado a ${updated.estado}.`,
  });

  return updated;
}

async function getReportMetrics() {
  return getSupportReportMetrics();
}

async function deleteReport({ id, soporteEmail }) {
  const eliminado = await softDeleteSupportReport(id, { eliminadoPor: soporteEmail || null });
  if (!eliminado) {
    return null;
  }

  await recordSupportAction({
    soporteEmail,
    accion: 'reporte_eliminado',
    detalle: `Eliminó el reporte #${eliminado.id}`,
  });

  await createSupportNotification({
    tipo: 'reporte_eliminado',
    mensaje: `Reporte #${eliminado.id} fue eliminado por el equipo de soporte.`,
  });

  return eliminado;
}

async function getReportWithComments(id, { includeComments = false } = {}) {
  const reporte = await getSupportReportById(id);
  if (!reporte) {
    return null;
  }

  if (!includeComments) {
    return reporte;
  }

  const comentarios = await listReportComments(id);
  return { ...reporte, comentarios };
}

async function listCommentsForReport(id) {
  return listReportComments(id);
}

async function addCommentToReport({ id, soporteEmail, mensaje, tipo }) {
  const reporte = await getSupportReportById(id);
  if (!reporte) {
    return null;
  }

  const comment = await createReportComment({
    reporteId: id,
    autorEmail: soporteEmail || null,
    mensaje,
    tipo,
  });

  if (!comment) {
    return null;
  }

  const detalleMensaje = mensaje.length > 80 ? `${mensaje.slice(0, 77)}...` : mensaje;
  await recordSupportAction({
    soporteEmail,
    accion: 'reporte_comentario',
    detalle: `Añadió un comentario al reporte #${reporte.id}: ${detalleMensaje}`,
  });

  await createSupportNotification({
    tipo: 'reporte_comentario',
    mensaje: `Nuevo comentario agregado al reporte #${reporte.id}.`,
  });

  return comment;
}

async function listPresentationsForSupport({ userId, limit, offset } = {}) {
  if (!Number.isInteger(userId) || userId <= 0) {
    return { usuario: null, presentaciones: [], pagination: { total: 0, limit: 0, offset: 0 } };
  }

  const usuario = await getUserById(userId);
  if (!usuario) {
    return { usuario: null, presentaciones: [], pagination: { total: 0, limit: 0, offset: 0 } };
  }

  const listado = await listPresentationsByUserId(userId, { limit, offset });

  return {
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
    },
    presentaciones: listado.presentaciones,
    pagination: listado.pagination,
  };
}

async function getPresentationForSupport({ userId, presentacionId } = {}) {
  if (!Number.isInteger(userId) || userId <= 0) {
    return { usuario: null, presentacion: null };
  }

  const usuario = await getUserById(userId);
  if (!usuario) {
    return { usuario: null, presentacion: null };
  }

  if (!Number.isInteger(presentacionId) || presentacionId <= 0) {
    return { usuario, presentacion: null };
  }

  const presentacion = await obtenerPresentacionPorId(presentacionId);
  if (!presentacion) {
    return { usuario, presentacion: null };
  }

  const sameOwner = typeof presentacion.email === 'string'
    && presentacion.email.toLowerCase() === (usuario.email || '').toLowerCase();

  if (!sameOwner) {
    return { usuario, presentacion: null };
  }

  return {
    usuario: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol,
    },
    presentacion,
  };
}

module.exports = {
  listUsersForSupport,
  getUserByEmail,
  updateMaintenanceState,
  listMaintenanceRecords,
  listMaintenanceHistoryEntries,
  listReportHistory,
  listSupportReports,
  updateReportState,
  getReportMetrics,
  exportReportsAsCsv,
  getSupportLogs,
  createSupportLog,
  listSupportNotifications,
  markNotificationAsRead,
  createSupportNotification,
  deleteReport,
  getReportWithComments,
  listCommentsForReport,
  addCommentToReport,
  listPresentationsForSupport,
  getPresentationForSupport,
};

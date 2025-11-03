const pool = require('../database');
const {
  normalizeCategory,
  normalizeStatus,
  getSupportCategorySummary,
  getSupportStatusSummary,
} = require('../lib/supportReports');

const buildResumenFromMessage = (mensaje, maxLength = 140) => {
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

const mapReportRow = (row) => {
  const categoriaInfo = getSupportCategorySummary(row.categoria);
  const estadoInfo = getSupportStatusSummary(row.estado);
  const mensaje = typeof row.mensaje === 'string'
    ? row.mensaje.replace(/\s+/g, ' ').trim()
    : row.mensaje;
  const resumen = typeof row.resumen === 'string' && row.resumen.trim()
    ? row.resumen.trim()
    : buildResumenFromMessage(mensaje || '');

  return {
    id: row.id,
    usuario_email: row.usuario_email,
    nombre: row.nombre,
    correo: row.correo,
    correoContacto: row.correo,
    categoria: categoriaInfo?.label || row.categoria,
    categoriaKey: categoriaInfo?.key || row.categoria,
    categoriaInfo,
    resumen,
    mensaje,
    estado: estadoInfo?.label || row.estado,
    estadoKey: estadoInfo?.key || row.estado,
    estadoInfo,
    atendido_por: row.atendido_por || null,
    resuelto_en: row.resuelto_en || null,
    eliminado: Boolean(row.eliminado),
    eliminado_por: row.eliminado_por || null,
    eliminado_en: row.eliminado_en || null,
    creado_en: row.creado_en,
    actualizado_en: row.actualizado_en,
  };
};

async function createSupportReport({ usuarioEmail, nombre, correo, categoria, resumen, mensaje }) {
  const client = await pool.connect();
  try {
    const insertQuery = `
      INSERT INTO reportes_soporte (usuario_email, nombre, correo, categoria, resumen, mensaje)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, usuario_email, nombre, correo, categoria, resumen, mensaje, estado, atendido_por, creado_en, actualizado_en
    `;

    const values = [
      usuarioEmail || null,
      nombre,
      correo,
      categoria,
      resumen || null,
      mensaje,
    ];

    const { rows } = await client.query(insertQuery, values);
    return mapReportRow(rows[0]);
  } finally {
    client.release();
  }
}

async function listSupportReports({ categoria, estado, search, incluirEliminados = false }) {
  const filters = [];
  const values = [];
  let param = 1;

  if (!incluirEliminados) {
    filters.push('eliminado = FALSE');
  }

  if (categoria) {
    const categoriaKey = normalizeCategory(categoria);
    if (categoriaKey) {
      filters.push(`categoria = $${param}`);
      values.push(categoriaKey);
      param += 1;
    }
  }

  if (estado) {
    const statusKey = normalizeStatus(estado);
    if (statusKey) {
      filters.push(`estado = $${param}`);
      values.push(statusKey);
      param += 1;
    }
  }

  if (search) {
    filters.push(`(
      nombre ILIKE $${param} OR
      correo ILIKE $${param} OR
      COALESCE(resumen, '') ILIKE $${param} OR
      mensaje ILIKE $${param}
    )`);
    values.push(`%${search}%`);
    param += 1;
  }

  const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  const query = `
  SELECT id, usuario_email, nombre, correo, categoria, resumen, mensaje, estado, atendido_por,
         creado_en, actualizado_en, eliminado, eliminado_por, eliminado_en, resuelto_en
    FROM reportes_soporte
    ${whereClause}
    ORDER BY creado_en DESC
  `;

  const { rows } = await pool.query(query, values);
  return rows.map(mapReportRow);
}

async function updateSupportReportState(id, estado, options = {}) {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return null;
  }

  const statusKey = normalizeStatus(estado);
  if (!statusKey) {
    return null;
  }

  const setClauses = ['estado = $1', 'actualizado_en = CURRENT_TIMESTAMP'];
  const values = [statusKey];

  if (statusKey === 'resuelto') {
    setClauses.push('resuelto_en = COALESCE(resuelto_en, CURRENT_TIMESTAMP)');
  } else {
    setClauses.push('resuelto_en = NULL');
  }

  if (options && options.atendidoPor) {
    setClauses.push(`atendido_por = $${values.length + 1}`);
    values.push(options.atendidoPor);
  }

  const query = `
    UPDATE reportes_soporte
    SET ${setClauses.join(', ')}
    WHERE id = $${values.length + 1} AND eliminado = FALSE
    RETURNING id, usuario_email, nombre, correo, categoria, resumen, mensaje, estado, atendido_por,
              creado_en, actualizado_en, eliminado, eliminado_por, eliminado_en, resuelto_en
  `;

  values.push(numericId);
  const { rows } = await pool.query(query, values);
  if (!rows.length) {
    return null;
  }

  return mapReportRow(rows[0]);
}

async function deleteSupportReport(id) {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return false;
  }

  const query = 'DELETE FROM reportes_soporte WHERE id = $1';
  const { rowCount } = await pool.query(query, [numericId]);
  return rowCount > 0;
}

async function softDeleteSupportReport(id, { eliminadoPor } = {}) {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return null;
  }

  const query = `
    UPDATE reportes_soporte
    SET eliminado = TRUE,
        eliminado_por = $1,
        eliminado_en = CURRENT_TIMESTAMP
    WHERE id = $2 AND eliminado = FALSE
    RETURNING id, usuario_email, nombre, correo, categoria, resumen, mensaje, estado, atendido_por,
              creado_en, actualizado_en, eliminado, eliminado_por, eliminado_en, resuelto_en
  `;

  const { rows } = await pool.query(query, [eliminadoPor || null, numericId]);
  if (!rows.length) {
    return null;
  }

  return mapReportRow(rows[0]);
}

async function restoreSupportReport(id) {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return null;
  }

  const query = `
    UPDATE reportes_soporte
    SET eliminado = FALSE,
        eliminado_por = NULL,
        eliminado_en = NULL
    WHERE id = $1 AND eliminado = TRUE
    RETURNING id, usuario_email, nombre, correo, categoria, resumen, mensaje, estado, atendido_por,
              creado_en, actualizado_en, eliminado, eliminado_por, eliminado_en, resuelto_en
  `;

  const { rows } = await pool.query(query, [numericId]);
  if (!rows.length) {
    return null;
  }

  return mapReportRow(rows[0]);
}

async function getSupportReportMetrics() {
  const query = `
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE estado = 'pendiente')::int AS pendientes,
      COUNT(*) FILTER (WHERE estado = 'en_proceso')::int AS en_proceso,
      COUNT(*) FILTER (WHERE estado = 'resuelto')::int AS resueltos,
      COUNT(DISTINCT usuario_email)::int AS usuarios_unicos
    FROM reportes_soporte
    WHERE eliminado = FALSE
  `;
  const { rows } = await pool.query(query);
  return rows[0] || {
    total: 0,
    pendientes: 0,
    en_proceso: 0,
    resueltos: 0,
    usuarios_unicos: 0,
  };
}

async function getSupportReportRawList(filters) {
  const reports = await listSupportReports({ ...(filters || {}), incluirEliminados: false });
  return reports;
}

async function getSupportReportById(id, { incluirEliminados = false } = {}) {
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return null;
  }

  const query = `
    SELECT id, usuario_email, nombre, correo, categoria, resumen, mensaje, estado, atendido_por,
           creado_en, actualizado_en, eliminado, eliminado_por, eliminado_en, resuelto_en
    FROM reportes_soporte
    WHERE id = $1 ${incluirEliminados ? '' : 'AND eliminado = FALSE'}
    LIMIT 1
  `;

  const { rows } = await pool.query(query, [numericId]);
  if (!rows.length) {
    return null;
  }

  return mapReportRow(rows[0]);
}

const mapCommentRow = (row) => ({
  id: row.id,
  reporte_id: row.reporte_id,
  autor_email: row.autor_email,
  autor_nombre: row.autor_nombre || null,
  autor_foto: row.autor_foto || null,
  mensaje: row.mensaje,
  tipo: row.tipo || 'interno',
  creado_en: row.creado_en,
});

async function listReportComments(reporteId) {
  const numericId = Number(reporteId);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return [];
  }

  const query = `
    SELECT c.id, c.reporte_id, c.autor_email, c.mensaje, c.tipo, c.creado_en,
           u.nombre AS autor_nombre, u.foto AS autor_foto
    FROM comentarios_reporte c
    LEFT JOIN usuarios u ON u.email = c.autor_email
    WHERE c.reporte_id = $1
    ORDER BY c.creado_en ASC
  `;

  const { rows } = await pool.query(query, [numericId]);
  return rows.map(mapCommentRow);
}

async function createReportComment({ reporteId, autorEmail, mensaje, tipo }) {
  const numericId = Number(reporteId);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return null;
  }

  const query = `
    INSERT INTO comentarios_reporte (reporte_id, autor_email, mensaje, tipo)
    VALUES ($1, $2, $3, $4)
    RETURNING id, reporte_id, autor_email, mensaje, tipo, creado_en
  `;

  const { rows } = await pool.query(query, [numericId, autorEmail || null, mensaje, tipo || 'interno']);
  if (!rows.length) {
    return null;
  }

  const baseComment = rows[0];
  const comment = mapCommentRow({ ...baseComment, autor_nombre: null, autor_foto: null });

  if (comment.autor_email) {
    const { rows: userRows } = await pool.query(
      'SELECT nombre, foto FROM usuarios WHERE email = $1 LIMIT 1',
      [comment.autor_email],
    );
    if (userRows.length) {
      comment.autor_nombre = userRows[0].nombre || comment.autor_nombre;
      comment.autor_foto = userRows[0].foto || comment.autor_foto;
    }
  }

  return comment;
}

module.exports = {
  createSupportReport,
  listSupportReports,
  updateSupportReportState,
  deleteSupportReport,
  getSupportReportMetrics,
  getSupportReportRawList,
  softDeleteSupportReport,
  restoreSupportReport,
  getSupportReportById,
  listReportComments,
  createReportComment,
};

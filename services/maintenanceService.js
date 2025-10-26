const pool = require('../database');

const DEFAULT_MAINTENANCE_MESSAGE = 'La aplicación está en mantenimiento temporalmente.';

const normalizeMaintenanceRow = (row = {}) => ({
  id: row.id ?? null,
  activo: Boolean(row.activo),
  mensaje: row.mensaje || DEFAULT_MAINTENANCE_MESSAGE,
  activado_por: row.activado_por || null,
  fecha_activacion: row.fecha_activacion || null,
});

/**
 * Obtiene el último registro de mantenimiento creado.
 * @returns {Promise<{id:number|null,activo:boolean,mensaje:string,activado_por:string|null,fecha_activacion:string|null}>}
 */
async function getLatestMaintenance() {
  const query = `
    SELECT id, activo, mensaje, activado_por, fecha_activacion
    FROM modo_mantenimiento
    ORDER BY fecha_activacion DESC
    LIMIT 1
  `;
  const { rows } = await pool.query(query);
  if (!rows.length) {
    return normalizeMaintenanceRow();
  }
  return normalizeMaintenanceRow(rows[0]);
}

/**
 * Inserta un nuevo registro de mantenimiento y devuelve el registro normalizado.
 * @param {Object} params
 * @param {boolean} params.activo
 * @param {string} [params.mensaje]
 * @param {string|null} [params.activadoPor]
 * @returns {Promise<Object>}
 */
async function insertMaintenanceRecord({ activo, mensaje, activadoPor }) {
  const query = `
    INSERT INTO modo_mantenimiento (activo, mensaje, activado_por)
    VALUES ($1, $2, $3)
    RETURNING id, activo, mensaje, activado_por, fecha_activacion
  `;
  const values = [Boolean(activo), mensaje || DEFAULT_MAINTENANCE_MESSAGE, activadoPor || null];
  const { rows } = await pool.query(query, values);
  return normalizeMaintenanceRow(rows[0]);
}

/**
 * Lista el historial de registros de mantenimiento.
 * @param {Object} params
 * @param {number} [params.limit=20]
 * @param {number} [params.offset=0]
 * @returns {Promise<Array<Object>>}
 */
async function listMaintenanceHistory({ limit = 20, offset = 0 } = {}) {
  const query = `
    SELECT id, activo, mensaje, activado_por, fecha_activacion
    FROM modo_mantenimiento
    ORDER BY fecha_activacion DESC
    LIMIT $1 OFFSET $2
  `;
  const { rows } = await pool.query(query, [limit, offset]);
  return rows.map(normalizeMaintenanceRow);
}

/**
 * Determina si el modo mantenimiento está activo para usuarios finales.
 * @returns {Promise<{activo:boolean,mensaje:string,fecha_activacion:string|null,activado_por:string|null}>}
 */
async function getMaintenanceGateInfo() {
  const latest = await getLatestMaintenance();
  return {
    activo: Boolean(latest.activo),
    mensaje: latest.mensaje,
    fecha_activacion: latest.fecha_activacion,
    activado_por: latest.activado_por,
  };
}

module.exports = {
  DEFAULT_MAINTENANCE_MESSAGE,
  getLatestMaintenance,
  insertMaintenanceRecord,
  listMaintenanceHistory,
  getMaintenanceGateInfo,
};

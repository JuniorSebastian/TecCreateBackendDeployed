const pool = require('../database');
const { sanitizeContenido } = require('../utils/presentaciones');
const { resolveTemplateKey } = require('../utils/pptThemes');
const { resolveFontKey } = require('../utils/pptFonts');

const normalizeId = (id) => {
  const numeric = Number(id);
  if (!Number.isInteger(numeric) || numeric <= 0) {
    return null;
  }
  return numeric;
};

const mapRowToPresentation = (row = {}) => ({
  id: row.id,
  titulo: row.titulo,
  contenido: sanitizeContenido(row.contenido),
  plantilla: resolveTemplateKey(row.plantilla),
  fuente: resolveFontKey(row.fuente),
  idioma: row.idioma,
  numero_slides: row.numero_slides,
  fecha_creacion: row.fecha_creacion,
  email: row.email,
});

async function obtenerPresentacionPorIdYUsuario(id, email) {
  const numericId = normalizeId(id);
  if (!numericId || !email) {
    return null;
  }

  const result = await pool.query(
    `SELECT id, titulo, contenido, plantilla, fuente, idioma, numero_slides, fecha_creacion, email
     FROM presentaciones
     WHERE id = $1 AND email = $2`,
    [numericId, email]
  );

  if (!result.rowCount) {
    return null;
  }

  return mapRowToPresentation(result.rows[0]);
}

async function obtenerPresentacionPorId(id) {
  const numericId = normalizeId(id);
  if (!numericId) {
    return null;
  }

  const result = await pool.query(
    `SELECT id, titulo, contenido, plantilla, fuente, idioma, numero_slides, fecha_creacion, email
     FROM presentaciones
     WHERE id = $1`,
    [numericId],
  );

  if (!result.rowCount) {
    return null;
  }

  return mapRowToPresentation(result.rows[0]);
}

module.exports = {
  obtenerPresentacionPorIdYUsuario,
  obtenerPresentacionPorId,
  mapRowToPresentation,
};

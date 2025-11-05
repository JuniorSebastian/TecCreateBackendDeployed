const { DateTime } = require('luxon');
const pool = require('../database');
const { resolveTemplateKey, getTemplateSummary } = require('../lib/pptThemes');
const { resolveFontKey, getFontSummary, DEFAULT_FONT_KEY } = require('../lib/pptFonts');

const DASHBOARD_TIMEZONE = process.env.DASHBOARD_TIMEZONE || 'America/Lima';

const parseCount = (value) => {
  const numeric = Number.parseInt(value, 10);
  return Number.isFinite(numeric) && numeric >= 0 ? numeric : 0;
};

const normalizeDateSeries = (rows) => rows.map((row) => {
  let baseDate = null;

  if (row.fecha instanceof Date && !Number.isNaN(row.fecha.getTime())) {
    baseDate = DateTime.fromJSDate(row.fecha, { zone: DASHBOARD_TIMEZONE });
  } else if (typeof row.fecha === 'string' && row.fecha.trim()) {
    baseDate = DateTime.fromISO(row.fecha.trim(), { zone: DASHBOARD_TIMEZONE });
  }

  const safeDate = baseDate && baseDate.isValid
    ? baseDate.startOf('day')
    : DateTime.fromISO('1970-01-01', { zone: DASHBOARD_TIMEZONE });

  const fecha = safeDate.toISODate();
  const fechaIsoLocal = safeDate.toFormat("yyyy-MM-dd'T'HH:mm:ss");
  const fechaUtc = safeDate.toUTC().toISO({ suppressMilliseconds: true, suppressSeconds: true });

  return {
    fecha,
    fechaIsoLocal,
    fechaIsoCompleta: fechaUtc,
    fechaUtc,
    total: parseCount(row.total),
  };
});

const mapLatestPresentation = (row) => {
  const templateKey = resolveTemplateKey(row.plantilla);
  const template = getTemplateSummary(templateKey);
  const fontKey = resolveFontKey(row.fuente || DEFAULT_FONT_KEY);
  const font = getFontSummary(fontKey);

  return {
    id: row.id,
    titulo: row.titulo,
    plantillaKey: templateKey,
    plantilla: template,
    fuenteKey: fontKey,
    fuente: font,
    numero_slides: row.numero_slides,
    fecha_creacion: row.fecha_creacion instanceof Date
      ? row.fecha_creacion.toISOString()
      : row.fecha_creacion,
    email: row.email,
  };
};

const mapTemplateUsage = (row) => {
  const key = resolveTemplateKey(row.plantilla);
  const template = getTemplateSummary(key);

  return {
    key,
    total: parseCount(row.total),
    template,
    name: template.name,
    description: template.description,
  };
};

const mapFontUsage = (row) => {
  const key = resolveFontKey(row.fuente || DEFAULT_FONT_KEY);
  const font = getFontSummary(key);

  return {
    key,
    total: parseCount(row.total),
    font,
    name: font.name,
    description: font.description,
  };
};

const columnExists = async (tableName, columnName) => {
  const { rowCount } = await pool.query(
    `SELECT 1
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = $1
       AND column_name = $2
     LIMIT 1`,
    [tableName, columnName],
  );

  return rowCount > 0;
};

const getDashboardSummary = async () => {
  const hasUserDateColumn = await columnExists('usuarios', 'fecha_registro');

  // Obtener la fecha actual en la zona horaria de Lima
  const hoyLima = DateTime.now().setZone(DASHBOARD_TIMEZONE);
  const fechaFinLima = hoyLima.toISODate(); // Fecha de hoy en formato YYYY-MM-DD
  const fechaInicioLima = hoyLima.minus({ days: 13 }).toISODate(); // Hace 13 días

  // 🔍 LOG DE DEBUG: Ver qué fechas está calculando el servidor
  console.log('🗓️  [Dashboard] Fecha actual del sistema:', new Date().toISOString());
  console.log('🗓️  [Dashboard] Fecha en Lima (Luxon):', hoyLima.toISO());
  console.log('🗓️  [Dashboard] fechaFinLima:', fechaFinLima);
  console.log('🗓️  [Dashboard] fechaInicioLima:', fechaInicioLima);
  console.log('🗓️  [Dashboard] DASHBOARD_TIMEZONE:', DASHBOARD_TIMEZONE);

  const presentacionesTrendQuery = `
    WITH parametros AS (
      SELECT
        $2::date AS fecha_fin,
        $3::date AS fecha_inicio
    ),
    rango AS (
      SELECT generate_series(parametros.fecha_inicio, parametros.fecha_fin, INTERVAL '1 day')::date AS fecha
      FROM parametros
    ),
    totales AS (
      SELECT (p.fecha_creacion AT TIME ZONE $1)::date AS fecha, COUNT(p.id) AS total
      FROM presentaciones p
      JOIN parametros ON TRUE
      WHERE (p.fecha_creacion AT TIME ZONE $1)::date BETWEEN parametros.fecha_inicio AND parametros.fecha_fin
      GROUP BY 1
    )
    SELECT rango.fecha, COALESCE(totales.total, 0) AS total
    FROM rango
    LEFT JOIN totales ON totales.fecha = rango.fecha
    ORDER BY rango.fecha
  `;

  const usuariosTrendQuery = hasUserDateColumn
    ? `
      WITH parametros AS (
        SELECT
          $2::date AS fecha_fin,
          $3::date AS fecha_inicio
      ),
      rango AS (
        SELECT generate_series(parametros.fecha_inicio, parametros.fecha_fin, INTERVAL '1 day')::date AS fecha
        FROM parametros
      ),
      totales AS (
        SELECT (u.fecha_registro AT TIME ZONE $1)::date AS fecha, COUNT(u.id) AS total
        FROM usuarios u
        JOIN parametros ON TRUE
        WHERE (u.fecha_registro AT TIME ZONE $1)::date BETWEEN parametros.fecha_inicio AND parametros.fecha_fin
        GROUP BY 1
      )
      SELECT rango.fecha, COALESCE(totales.total, 0) AS total
      FROM rango
      LEFT JOIN totales ON totales.fecha = rango.fecha
      ORDER BY rango.fecha
    `
    : `
      WITH parametros AS (
        SELECT
          $2::date AS fecha_fin,
          $3::date AS fecha_inicio
      )
      SELECT generate_series(parametros.fecha_inicio, parametros.fecha_fin, INTERVAL '1 day')::date AS fecha,
             0 AS total
      FROM parametros
      ORDER BY fecha
    `;

  const soporteResolvedQuery = `
    SELECT
      r.atendido_por AS soporte_email,
      COALESCE(u.nombre, r.atendido_por) AS soporte_nombre,
      COUNT(*)::int AS total_resueltos,
      MAX(r.resuelto_en) AS ultimo_resuelto_en
    FROM reportes_soporte r
    LEFT JOIN usuarios u ON u.email = r.atendido_por
    WHERE r.estado = 'resuelto'
      AND r.eliminado = FALSE
      AND r.atendido_por IS NOT NULL
    GROUP BY r.atendido_por, u.nombre
    ORDER BY total_resueltos DESC, soporte_nombre ASC
  `;

  const [
    totalUsersResult,
    totalPresentacionesResult,
    latestPresentacionesResult,
    topPromptsResult,
    topTemplatesResult,
    topFontsResult,
    presentacionesTrendResult,
    usuariosTrendResult,
    soporteResolvedResult,
  ] = await Promise.all([
    pool.query('SELECT COUNT(*) AS total FROM usuarios'),
    pool.query('SELECT COUNT(*) AS total FROM presentaciones'),
    pool.query(`
      SELECT id, titulo, plantilla, fuente, numero_slides, fecha_creacion, email
      FROM presentaciones
      ORDER BY fecha_creacion DESC
      LIMIT 5
    `),
    pool.query(`
      SELECT MIN(titulo) AS titulo, COUNT(*) AS total
      FROM presentaciones
      WHERE titulo IS NOT NULL AND BTRIM(titulo) <> ''
      GROUP BY LOWER(BTRIM(titulo))
      ORDER BY total DESC
      LIMIT 5
    `),
    pool.query(`
      SELECT COALESCE(plantilla, 'default') AS plantilla, COUNT(*) AS total
      FROM presentaciones
      GROUP BY 1
      ORDER BY total DESC
      LIMIT 5
    `),
    pool.query(`
      SELECT COALESCE(fuente, $1) AS fuente, COUNT(*) AS total
      FROM presentaciones
      GROUP BY 1
      ORDER BY total DESC
      LIMIT 5
    `, [DEFAULT_FONT_KEY]),
    pool.query(presentacionesTrendQuery, [DASHBOARD_TIMEZONE, fechaFinLima, fechaInicioLima]),
    pool.query(usuariosTrendQuery, [DASHBOARD_TIMEZONE, fechaFinLima, fechaInicioLima]),
    pool.query(soporteResolvedQuery),
  ]);

  const totalUsuarios = parseCount(totalUsersResult.rows[0]?.total);
  const totalPresentaciones = parseCount(totalPresentacionesResult.rows[0]?.total);

  const recientes = latestPresentacionesResult.rows.map(mapLatestPresentation);
  const topPrompts = topPromptsResult.rows.map((row) => ({
    titulo: row.titulo,
    total: parseCount(row.total),
  }));
  const topPlantillas = topTemplatesResult.rows.map(mapTemplateUsage);
  const topFuentes = topFontsResult.rows.map(mapFontUsage);

  const presentacionesPorDia = normalizeDateSeries(presentacionesTrendResult.rows);
  const usuariosPorDia = normalizeDateSeries(usuariosTrendResult.rows);

  // 🔍 LOG DE DEBUG: Ver qué fechas se están retornando
  console.log('📊 [Dashboard] Total filas de presentaciones:', presentacionesTrendResult.rows.length);
  console.log('📊 [Dashboard] Últimas 3 fechas raw:', presentacionesTrendResult.rows.slice(-3));
  console.log('📊 [Dashboard] Últimas 3 fechas normalizadas:', presentacionesPorDia.slice(-3));

  const ticketsResueltosPorAgente = soporteResolvedResult.rows.map((row) => ({
    email: row.soporte_email,
    nombre: row.soporte_nombre || row.soporte_email,
    resueltos: parseCount(row.total_resueltos),
    ultimo_resuelto_en: row.ultimo_resuelto_en,
  }));

  return {
    totales: {
      usuarios: totalUsuarios,
      presentaciones: totalPresentaciones,
    },
    recientes: {
      presentaciones: recientes,
    },
    usoIA: {
      promptsFrecuentes: topPrompts,
      plantillasPreferidas: topPlantillas,
      fuentesPreferidas: topFuentes,
    },
    actividad: {
      presentacionesPorDia,
      usuariosPorDia,
    },
    soporte: {
      ticketsResueltosPorAgente,
    },
  };
};

module.exports = {
  getDashboardSummary,
};

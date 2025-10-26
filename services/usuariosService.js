const pool = require('../database');

const ROLE_VALUES = ['admin', 'soporte', 'usuario'];
const STATUS_VALUES = ['activo', 'inactivo', 'suspendido'];

let userColumnMetadata = null;

const parseInteger = (value, fallback, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) => {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
};

const toIsoString = (value) => (value instanceof Date && !Number.isNaN(value.getTime())
  ? value.toISOString()
  : null);

const ensureUserColumnMetadata = async () => {
  if (userColumnMetadata) return userColumnMetadata;

  const { rows } = await pool.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'usuarios'
       AND column_name IN ('rol', 'estado', 'fecha_registro')`,
  );

  const present = new Set(rows.map((row) => row.column_name));
  userColumnMetadata = {
    hasRole: present.has('rol'),
    hasStatus: present.has('estado'),
    hasRegistration: present.has('fecha_registro'),
  };

  return userColumnMetadata;
};

const buildUserSelectFragments = async () => {
  const meta = await ensureUserColumnMetadata();

  const roleSelect = meta.hasRole
    ? "COALESCE(u.rol, 'usuario') AS rol"
    : "'usuario'::text AS rol";

  const statusSelect = meta.hasStatus
    ? "COALESCE(u.estado, 'activo') AS estado"
    : "'activo'::text AS estado";

  const registrationSelect = meta.hasRegistration
    ? 'u.fecha_registro'
    : 'NULL::timestamp AS fecha_registro';

  const select = [
    'u.id',
    'u.nombre',
    'u.email',
    'u.foto',
    roleSelect,
    statusSelect,
    registrationSelect,
    'COALESCE(up.total_presentaciones, 0) AS total_presentaciones',
    'up.ultima_presentacion',
    'lp.id AS ultima_presentacion_id',
    'lp.titulo AS ultima_presentacion_titulo',
    'lp.fecha_creacion AS ultima_presentacion_fecha',
    'lp.plantilla AS ultima_presentacion_plantilla',
    'lp.fuente AS ultima_presentacion_fuente',
    'lp.numero_slides AS ultima_presentacion_slides',
    'COUNT(*) OVER() AS total_items',
  ].join(', ');

  const ctes = `
    WITH user_presentations AS (
      SELECT email, COUNT(*) AS total_presentaciones, MAX(fecha_creacion) AS ultima_presentacion
      FROM presentaciones
      GROUP BY email
    ),
    last_presentation AS (
      SELECT DISTINCT ON (email)
        email, id, titulo, fecha_creacion, plantilla, fuente, numero_slides
      FROM presentaciones
      ORDER BY email, fecha_creacion DESC, id DESC
    )
  `;

  return { select, ctes, meta };
};

const mapUserRow = (row) => {
  const totalPresentaciones = parseInteger(row.total_presentaciones, 0, { min: 0 });
  const ultimaPresentacion = row.ultima_presentacion_id
    ? {
        id: row.ultima_presentacion_id,
        titulo: row.ultima_presentacion_titulo,
        fecha: toIsoString(row.ultima_presentacion_fecha),
        plantilla: row.ultima_presentacion_plantilla,
        fuente: row.ultima_presentacion_fuente,
        numeroSlides: row.ultima_presentacion_slides != null
          ? parseInteger(row.ultima_presentacion_slides, 0, { min: 0 })
          : null,
      }
    : null;

  return {
    id: row.id,
    nombre: row.nombre,
    email: row.email,
    foto: row.foto || null,
    rol: row.rol || 'usuario',
    estado: row.estado || 'activo',
    fechaRegistro: toIsoString(row.fecha_registro),
    totalPresentaciones,
    ultimaPresentacion,
    ultimaActividad: toIsoString(row.ultima_presentacion),
  };
};

const listUsers = async ({
  search,
  rol,
  estado,
  limit = 20,
  offset = 0,
} = {}) => {
  const { select, ctes, meta } = await buildUserSelectFragments();

  const filters = [];
  const params = [];

  if (search && search.trim()) {
    const value = `%${search.trim()}%`;
    params.push(value, value, value);
    const nameIdx = params.length - 2;
    const emailIdx = params.length - 1;
    const projectIdx = params.length;
    filters.push(`(
      u.nombre ILIKE $${nameIdx}
      OR u.email ILIKE $${emailIdx}
      OR EXISTS (
        SELECT 1 FROM presentaciones p
        WHERE p.email = u.email AND p.titulo ILIKE $${projectIdx}
      )
    )`);
  }

  if (rol) {
    if (!meta.hasRole) {
      const error = new Error('La columna rol no existe en la tabla usuarios');
      error.code = 'ROLE_COLUMN_MISSING';
      throw error;
    }
    params.push(rol);
    filters.push(`COALESCE(u.rol, 'usuario') = $${params.length}`);
  }

  if (estado) {
    if (!meta.hasStatus) {
      const error = new Error('La columna estado no existe en la tabla usuarios');
      error.code = 'STATUS_COLUMN_MISSING';
      throw error;
    }
    params.push(estado);
    filters.push(`COALESCE(u.estado, 'activo') = $${params.length}`);
  }

  const sanitizedLimit = parseInteger(limit, 20, { min: 1, max: 100 });
  const sanitizedOffset = parseInteger(offset, 0, { min: 0 });

  const filterParams = params.slice();

  params.push(sanitizedLimit, sanitizedOffset);
  const limitIdx = params.length - 1;
  const offsetIdx = params.length;

  const query = `
    ${ctes}
    SELECT ${select}
    FROM usuarios u
    LEFT JOIN user_presentations up ON up.email = u.email
    LEFT JOIN last_presentation lp ON lp.email = u.email
    ${filters.length ? `WHERE ${filters.join(' AND ')}` : ''}
    ORDER BY u.nombre ASC
    LIMIT $${limitIdx}
    OFFSET $${offsetIdx}
  `;

  const { rows } = await pool.query(query, params);

  let total = rows[0]?.total_items ? Number(rows[0].total_items) : 0;
  if (!rows.length && sanitizedOffset > 0) {
    const countQuery = `
      SELECT COUNT(*) AS total
      FROM usuarios u
      ${filters.length ? `WHERE ${filters.join(' AND ')}` : ''}
    `;

    const { rows: countRows } = await pool.query(countQuery, filterParams);
    total = countRows[0] ? Number(countRows[0].total) : 0;
  }

  return {
    usuarios: rows.map(mapUserRow),
    pagination: {
      total,
      limit: sanitizedLimit,
      offset: sanitizedOffset,
    },
    meta: {
      rolesDisponibles: meta.hasRole ? ROLE_VALUES : ['usuario'],
      estadosDisponibles: meta.hasStatus ? STATUS_VALUES : ['activo'],
    },
  };
};

const getUserById = async (id) => {
  const { select, ctes } = await buildUserSelectFragments();
  const { rows } = await pool.query(
    `
      ${ctes}
      SELECT ${select}
      FROM usuarios u
      LEFT JOIN user_presentations up ON up.email = u.email
      LEFT JOIN last_presentation lp ON lp.email = u.email
      WHERE u.id = $1
      LIMIT 1
    `,
    [id],
  );

  if (!rows.length) {
    return null;
  }

  return mapUserRow(rows[0]);
};

const updateUserRole = async (id, rol) => {
  const meta = await ensureUserColumnMetadata();
  if (!meta.hasRole) {
    const error = new Error('La columna rol no existe en la tabla usuarios');
    error.code = 'ROLE_COLUMN_MISSING';
    throw error;
  }
  if (!ROLE_VALUES.includes(rol)) {
    const error = new Error('Rol no válido');
    error.code = 'INVALID_ROLE';
    throw error;
  }

  const { rows } = await pool.query(
    `
      UPDATE usuarios
      SET rol = $2
      WHERE id = $1
      RETURNING id, nombre, email, rol
    `,
    [id, rol],
  );

  return rows[0] || null;
};

const updateUserStatus = async (id, estado) => {
  const meta = await ensureUserColumnMetadata();
  if (!meta.hasStatus) {
    const error = new Error('La columna estado no existe en la tabla usuarios');
    error.code = 'STATUS_COLUMN_MISSING';
    throw error;
  }
  if (!STATUS_VALUES.includes(estado)) {
    const error = new Error('Estado no válido');
    error.code = 'INVALID_STATUS';
    throw error;
  }

  const { rows } = await pool.query(
    `
      UPDATE usuarios
      SET estado = $2
      WHERE id = $1
      RETURNING id, nombre, email, estado
    `,
    [id, estado],
  );

  return rows[0] || null;
};

const deleteUserById = async (id) => {
  const { rows } = await pool.query(
    'DELETE FROM usuarios WHERE id = $1 RETURNING id',
    [id],
  );
  return Boolean(rows[0]);
};

const listPresentationsByUserId = async (id, { limit = 20, offset = 0 } = {}) => {
  const sanitizedLimit = parseInteger(limit, 20, { min: 1, max: 100 });
  const sanitizedOffset = parseInteger(offset, 0, { min: 0 });

  const { rows } = await pool.query(
    `
      SELECT
        p.id,
        p.titulo,
        p.plantilla,
        p.fuente,
        p.numero_slides,
        p.fecha_creacion,
        COUNT(*) OVER() AS total_items
      FROM presentaciones p
      JOIN usuarios u ON u.email = p.email
      WHERE u.id = $1
      ORDER BY p.fecha_creacion DESC, p.id DESC
      LIMIT $2
      OFFSET $3
    `,
    [id, sanitizedLimit, sanitizedOffset],
  );

  const total = rows[0]?.total_items ? Number(rows[0].total_items) : 0;

  return {
    presentaciones: rows.map((row) => ({
      id: row.id,
      titulo: row.titulo,
      plantilla: row.plantilla,
      fuente: row.fuente,
      numeroSlides: row.numero_slides != null
        ? parseInteger(row.numero_slides, 0, { min: 0 })
        : null,
      fechaCreacion: toIsoString(row.fecha_creacion),
    })),
    pagination: {
      total,
      limit: sanitizedLimit,
      offset: sanitizedOffset,
    },
  };
};

module.exports = {
  listUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
  deleteUserById,
  listPresentationsByUserId,
  ROLE_VALUES,
  STATUS_VALUES,
};

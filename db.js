const { Pool } = require('pg');

const hasExplicitSslFlag = typeof process.env.DATABASE_SSL === 'string';
const shouldForceSsl = hasExplicitSslFlag
  ? process.env.DATABASE_SSL === 'true'
  : process.env.RENDER === 'true' || process.env.NODE_ENV === 'production';

const resolveDatabaseConfig = () => {
  const connectionString = process.env.DATABASE_URL;

  const ssl = shouldForceSsl
    ? { require: true, rejectUnauthorized: false }
    : false;

  if (connectionString) {
    return { connectionString, ssl };
  }

  if (!process.env.PGHOST) {
    throw new Error('No se pudo inicializar la base de datos: define DATABASE_URL o las variables PGHOST/PGUSER/PGPASSWORD/PGDATABASE.');
  }

  return {
    host: process.env.PGHOST,
    port: Number.parseInt(process.env.PGPORT || '5432', 10),
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    ssl,
  };
};

const pool = new Pool(resolveDatabaseConfig());

module.exports = pool;

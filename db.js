const { Pool } = require('pg');

const hasExplicitSslFlag = typeof process.env.DATABASE_SSL === 'string';
const shouldForceSsl = hasExplicitSslFlag
  ? process.env.DATABASE_SSL === 'true'
  : process.env.RENDER === 'true' || process.env.NODE_ENV === 'production';

const resolveDatabaseConfig = () => {
  const maxConnections = Number.parseInt(process.env.PGPOOL_MAX || '5', 10);
  const idleTimeoutMillis = Number.parseInt(process.env.PGPOOL_IDLE_TIMEOUT || '10000', 10);
  const connectionTimeoutMillis = Number.parseInt(process.env.PGPOOL_CONNECTION_TIMEOUT || '5000', 10);

  const baseConfig = {
    max: Number.isFinite(maxConnections) && maxConnections > 0 ? maxConnections : 5,
    idleTimeoutMillis: Number.isFinite(idleTimeoutMillis) && idleTimeoutMillis >= 0 ? idleTimeoutMillis : 10000,
    connectionTimeoutMillis: Number.isFinite(connectionTimeoutMillis) && connectionTimeoutMillis > 0
      ? connectionTimeoutMillis
      : 5000,
  };

  const connectionString = process.env.DATABASE_URL;

  const ssl = shouldForceSsl
    ? { require: true, rejectUnauthorized: false }
    : false;

  if (connectionString) {
    return { connectionString, ssl, ...baseConfig };
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
    ...baseConfig,
  };
};

const pool = new Pool(resolveDatabaseConfig());

module.exports = pool;

const { Pool } = require('pg');
const fs = require('fs');

const hasExplicitSslFlag = typeof process.env.DATABASE_SSL === 'string';
// For backwards compatibility: if not explicitly set, require SSL in production
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

  // Detect if the connection string explicitly requests SSL (e.g. ?sslmode=require)
  const connectionStringRequiresSsl = typeof connectionString === 'string' && /ssl(mode)?=(require|verify-ca|verify-full)|\bssl=true\b/i.test(connectionString);

  // SSL options: allow providing a CA PEM via DATABASE_SSL_CA (either the PEM text or a path)
  // or allow self-signed certs when DATABASE_SSL_ALLOW_SELF_SIGNED=true
  let ssl = false;
  if (shouldForceSsl || connectionStringRequiresSsl) {
    const allowSelfSigned = String(process.env.DATABASE_SSL_ALLOW_SELF_SIGNED || 'false').toLowerCase() === 'true';
    // Support both a raw PEM in DATABASE_SSL_CA or a base64-encoded PEM in DATABASE_SSL_CA_B64
    const rawCaB64 = process.env.DATABASE_SSL_CA_B64;
    let rawCa = process.env.DATABASE_SSL_CA; // optional: PEM string or path to file
    if (!rawCa && rawCaB64) {
      try {
        rawCa = Buffer.from(rawCaB64, 'base64').toString('utf8');
        console.log('DB: decoded DATABASE_SSL_CA_B64 into PEM content');
      } catch (e) {
        console.warn('DB: failed to decode DATABASE_SSL_CA_B64, ignoring');
      }
    }

    if (rawCa) {
      let caContent = rawCa;
      try {
        // If the env var looks like a path to a file, try to read it
        if (!rawCa.includes('-----BEGIN') && fs.existsSync(rawCa)) {
          caContent = fs.readFileSync(rawCa, 'utf8');
        }
      } catch (e) {
        // ignore read errors; we'll fallback
      }

      ssl = { ca: caContent, rejectUnauthorized: true };
    } else if (allowSelfSigned) {
      // WARNING: allow self-signed certs (insecure). Use only for testing or if you trust the network.
      ssl = { rejectUnauthorized: false };
      // Also set the Node option to allow self-signed certs in case lower-level TLS blocks
      try {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
      } catch (e) {
        // ignore
      }
    } else {
      // Default: try to connect but do not reject unauthorized by default to improve compatibility
      ssl = { rejectUnauthorized: false };
    }
  }

  // Build connection options explicitly and only include `ssl` when it's an object.
  if (connectionString) {
    // Do not log sensitive values; but help debugging by indicating SSL mode and masked host
    try {
      const masked = connectionString.replace(/(postgres(?:ql)?:\/\/)([^:@]+)(:[^@]+)?@/, '$1****:****@');
      console.log('DB config: using connectionString, ssl enabled:', Boolean(ssl), 'conn:', masked.substring(0, 120));
    } catch (e) {
      console.log('DB config: using connectionString, ssl enabled:', Boolean(ssl));
    }

    const options = { ...baseConfig, connectionString };
    if (ssl && typeof ssl === 'object') options.ssl = ssl;
    return options;
  }

  if (!process.env.PGHOST) {
    throw new Error('No se pudo inicializar la base de datos: define DATABASE_URL o las variables PGHOST/PGUSER/PGPASSWORD/PGDATABASE.');
  }

  const options = {
    host: process.env.PGHOST,
    port: Number.parseInt(process.env.PGPORT || '5432', 10),
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    ...baseConfig,
  };
  if (ssl && typeof ssl === 'object') options.ssl = ssl;
  return options;
};

// Create the Pool with explicit options so `ssl` is passed directly to pg client.
const poolOptions = resolveDatabaseConfig();
console.log('Initializing PG Pool with ssl present:', Boolean(poolOptions.ssl));
const pool = new Pool(poolOptions);

module.exports = pool;

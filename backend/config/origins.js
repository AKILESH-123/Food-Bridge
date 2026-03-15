const DEFAULT_DEV_ORIGINS = ['http://localhost:3000', 'http://127.0.0.1:3000'];

function normalizeOrigin(origin) {
  return origin?.trim().replace(/\/+$/, '') || null;
}

function parseEnvOrigins(value) {
  return (value || '')
    .split(',')
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean);
}

function isLocalDevOrigin(origin) {
  if (!origin) {
    return false;
  }

  try {
    const parsed = new URL(origin);
    return parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

function getRailwayOrigin() {
  const publicDomain = process.env.RAILWAY_PUBLIC_DOMAIN?.trim();
  if (!publicDomain) {
    return null;
  }

  return normalizeOrigin(`https://${publicDomain}`);
}

function getAllowedOrigins() {
  const configuredOrigins = parseEnvOrigins(process.env.CLIENT_URL);
  const railwayOrigin = getRailwayOrigin();
  const allowDevelopmentOrigins = process.env.NODE_ENV !== 'production';

  return [...new Set([
    ...configuredOrigins,
    railwayOrigin,
    ...(allowDevelopmentOrigins ? DEFAULT_DEV_ORIGINS : []),
  ].filter(Boolean))];
}

function isAllowedOrigin(origin) {
  if (!origin) {
    return true;
  }

  if (process.env.NODE_ENV !== 'production' && isLocalDevOrigin(origin)) {
    return true;
  }

  const normalizedOrigin = normalizeOrigin(origin);
  const allowedOrigins = getAllowedOrigins();

  if (allowedOrigins.length === 0) {
    return true;
  }

  return allowedOrigins.includes(normalizedOrigin);
}

function getPrimaryClientOrigin() {
  return getAllowedOrigins()[0] || null;
}

module.exports = { getAllowedOrigins, getPrimaryClientOrigin, isAllowedOrigin, normalizeOrigin };
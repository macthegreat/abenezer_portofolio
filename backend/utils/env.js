function parseNumber(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function getEnv() {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseNumber(process.env.PORT, 4000),
    jwtSecret: process.env.JWT_SECRET || 'dev-secret',
    logFormat: process.env.LOG_FORMAT || 'combined'
  };
}

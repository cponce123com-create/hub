function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`[env] Variable de entorno requerida: ${name}`);
    process.exit(1);
  }
  return value;
}

export const env = {
  DATABASE_URL: requireEnv("DATABASE_URL"),
  SESSION_SECRET: process.env["SESSION_SECRET"] || "controlhub-dev-secret-change-in-prod",
  NODE_ENV: (process.env["NODE_ENV"] || "development") as "development" | "production" | "test",
  ALLOWED_ORIGINS: process.env["ALLOWED_ORIGINS"],
  PORT: process.env["PORT"] || "8080",
};

if (env.NODE_ENV === "production" && env.SESSION_SECRET.length < 32) {
  console.error("[env] SESSION_SECRET debe tener al menos 32 caracteres en producción");
  process.exit(1);
}

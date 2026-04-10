function requireFiniteNumber(name: string, value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error(
      `Variable de entorno ${name} debe ser un número válido (recibido: ${JSON.stringify(process.env[name])})`
    );
  }
  return value;
}

function readRequiredNumber(name: string): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") {
    throw new Error(`Falta la variable de entorno obligatoria: ${name}`);
  }
  return requireFiniteNumber(name, Number(raw));
}

const min = readRequiredNumber("MIN_PRICE");
const max = readRequiredNumber("MAX_PRICE");

if (min >= max) {
  throw new Error("MIN_PRICE debe ser estrictamente menor que MAX_PRICE");
}

export const alertConfig = {
  min,
  max,
  cronSchedule: process.env.CRON_SCHEDULE ?? "*/5 * * * *",
  cronTimezone: process.env.CRON_TZ ?? "America/Argentina/Buenos_Aires"
} as const;

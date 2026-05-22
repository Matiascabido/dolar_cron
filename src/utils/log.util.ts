import { formatArs, formatDateAr } from "./format.util";

export function logCycleStart(): void {
  console.log("");
  console.log("─".repeat(52));
  console.log(`Consulta de dólar · ${formatDateAr()}`);
  console.log("─".repeat(52));
}

export function logCycleEnd(): void {
  console.log("─".repeat(52));
  console.log("");
}

export function logInfo(message: string): void {
  console.log(`  ${message}`);
}

export function logSuccess(message: string): void {
  console.log(`  ✓ ${message}`);
}

export function logSkip(message: string): void {
  console.log(`  · ${message}`);
}

export function logWarn(message: string): void {
  console.warn(`  ⚠ ${message}`);
}

export function logError(message: string, detail?: unknown): void {
  console.error(`  ✗ ${message}`);
  if (detail !== undefined) {
    console.error("   ", detail);
  }
}

export function logQuoteLine(
  label: string,
  venta: number,
  isBest = false
): void {
  const suffix = isBest ? "  ← mejor precio" : "";
  console.log(`    · ${label.padEnd(28)} ${formatArs(venta)}${suffix}`);
}

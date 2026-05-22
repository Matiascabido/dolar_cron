import fs from "fs";
import path from "path";

const logsDir = path.resolve("logs");
const logFile = path.join(logsDir, "dollar.log");

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

export function saveLog(data: { source: string; compra?: number; venta: number }) {
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    ...data
  });

  try {
    fs.appendFileSync(logFile, line + "\n");
  } catch (err) {
    console.error("  ✗ No se pudo guardar el historial en disco:", err);
  }
}
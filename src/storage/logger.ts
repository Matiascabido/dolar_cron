import fs from "fs";
import path from "path";

const logsDir = path.resolve("logs");
const logFile = path.join(logsDir, "dollar.log");

if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

export function saveLog(data: any) {
  const line = JSON.stringify({
    timestamp: new Date().toISOString(),
    ...data
  });

  fs.appendFileSync(logFile, line + "\n");
}
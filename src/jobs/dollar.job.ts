import { getAllDollars, normalize } from "../services/dollar.service";
import { sendTelegram } from "../services/notification.service";
import { getBestPrice } from "../utils/alert.util";
import { saveLog } from "../storage/logger";
import { alertConfig } from "../config/alert.config";

let lastAlert = 0;

async function runCycle() {
  console.log("🔄 Ejecutando ciclo:", new Date().toLocaleString());

  try {
    const data = await getAllDollars();
    const normalized = normalize(data);

    console.log("📊 Normalizados:", normalized);

    if (!normalized.length) {
      console.log("⚠️ Sin datos");
      return;
    }

    // 📝 Guardar logs SIEMPRE
    normalized.forEach(d => saveLog(d));

    const best = getBestPrice(normalized);
    console.log("🏆 Mejor precio:", best);

    const isInRange =
      best.venta >= alertConfig.min && best.venta <= alertConfig.max;

    console.log("🎯 Rango:", alertConfig.min, "-", alertConfig.max);
    console.log("📊 ¿Está dentro del rango?", isInRange);

    // ❌ Si está fuera → no notifica
    if (!isInRange) {
      console.log("⛔ Fuera del rango, no se notifica");
      return;
    }

    // ⏱️ Control de cooldown
    const now = Date.now();

    if (now - lastAlert < alertConfig.cooldownMs) {
      console.log("⏳ En cooldown, no se envía alerta");
      return;
    }

    lastAlert = now;

    console.log("📲 Enviando notificación (dentro de rango)...");

    await sendTelegram(
`📊 DÓLAR EN RANGO

💰 Precio: ${best.venta}
🏦 Fuente: ${best.source}

📊 Rango: ${alertConfig.min} - ${alertConfig.max}
⏰ ${new Date().toLocaleString()}`
    );

    console.log("✅ Notificación enviada");

  } catch (error: any) {
    console.error("❌ Error:", error?.response?.data || error.message);
  }
}

export function startDollarJob() {
  console.log("⏱️ Job iniciado");

  runCycle(); // ejecución inmediata
  setInterval(runCycle, 5 * 60 * 1000);
}
import { getAllDollars, normalize } from "../services/dollar.service";
import { sendTelegram } from "../services/notification.service";
import { alertConfig } from "../config/alert.config";
import {
  shouldAlert,
  canSendAlert,
  getBestPrice
} from "../utils/alert.util";
import { saveLog } from "../storage/logger";

async function runCycle() {
  console.log("🔄 Ejecutando ciclo:", new Date().toLocaleString());

  try {
    const data = await getAllDollars();
    console.log("📡 Datos crudos:", JSON.stringify(data, null, 2));

    const normalized = normalize(data);
    console.log("📊 Datos normalizados:", normalized);

    if (!normalized.length) {
      console.log("⚠️ No hay datos válidos");
      return;
    }

    normalized.forEach(d => saveLog(d));

    console.log("💵 Valores:");
    normalized.forEach(d => console.log(`${d.source}: ${d.venta}`));

    const best = getBestPrice(normalized);
    console.log("🏆 Mejor precio:", best);

    const should = shouldAlert(
      best.venta,
      alertConfig.min,
      alertConfig.max
    );

    console.log("🚨 ¿Dispara alerta?", should);

    if (should) {
      const canSend = canSendAlert(alertConfig.cooldownMs);
      console.log("⏱️ ¿Puede enviar?", canSend);

      if (canSend) {
        console.log("📲 Enviando Telegram...");

        await sendTelegram(
`🚨 ALERTA DÓLAR

💰 ${best.venta}
🏦 ${best.source}
📊 ${alertConfig.min}-${alertConfig.max}`
        );

        console.log("✅ Telegram enviado");
      }
    }

  } catch (error: any) {
    console.error("❌ Error en ciclo:", error?.response?.data || error.message);
  }
}

export function startDollarJob() {
  console.log("⏱️ Job iniciado");

  // 👇 EJECUCIÓN INMEDIATA
  runCycle();

  // 👇 EJECUCIÓN CADA 5 MIN
  setInterval(runCycle, 5 * 60 * 1000);
}
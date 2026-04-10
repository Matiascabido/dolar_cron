import cron from "node-cron";
import { getAllDollars, normalize } from "../services/dollar.service";
import { sendTelegram } from "../services/notification.service";
import { alertConfig } from "../config/alert.config";
import { shouldAlert, canSendAlert, getBestPrice } from "../utils/alert.util";
import { saveLog } from "../storage/logger";

export function startDollarJob() {
  cron.schedule("*/5 * * * *", async () => {
    try {
      const data = await getAllDollars();
      const normalized = normalize(data);

      // guardar histórico
      normalized.forEach(d => saveLog(d));

      // log consola
      console.log("💵 Valores actuales:");
      normalized.forEach(d => {
        console.log(`${d.source}: ${d.venta}`);
      });

      // mejor precio
      const best = getBestPrice(normalized);

      // alerta por rango
      if (shouldAlert(best.venta, alertConfig.min, alertConfig.max)) {
        if (canSendAlert(alertConfig.cooldownMs)) {
          await sendTelegram(
            `🚨 ALERTA DÓLAR

            💰 Mejor precio: ${best.venta}
            🏦 Fuente: ${best.source}
            📊 Rango: ${alertConfig.min} - ${alertConfig.max}
            ⏰ ${new Date().toLocaleString()}`
          );
        }
      }

    } catch (error) {
      console.error("❌ Error en cron:", error);
    }
  });
}
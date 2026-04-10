import { getAllDollars, normalize } from "../services/dollar.service";
import { sendTelegram } from "../services/notification.service";
import { getBestPrice } from "../utils/alert.util";
import { saveLog } from "../storage/logger";

async function runCycle() {
  console.log("🔄 Ejecutando ciclo:", new Date().toLocaleString());

  try {
    // 1. Obtener datos
    const data = await getAllDollars();
    console.log("📡 Datos crudos:", JSON.stringify(data, null, 2));

    // 2. Normalizar
    const normalized = normalize(data);
    console.log("📊 Normalizados:", normalized);

    if (!normalized.length) {
      console.log("⚠️ No hay datos");
      return;
    }

    // 3. Guardar logs
    normalized.forEach(d => saveLog(d));

    // 4. Mejor precio
    const best = getBestPrice(normalized);
    console.log("🏆 Mejor precio:", best);

    // 5. 🚨 SIEMPRE enviar Telegram
    console.log("📲 Enviando Telegram...");

    await sendTelegram(
`📊 UPDATE DÓLAR

💰 Mejor precio: ${best.venta}
🏦 Fuente: ${best.source}

📋 Todas las fuentes:
${normalized.map(d => `- ${d.source}: ${d.venta}`).join("\n")}

⏰ ${new Date().toLocaleString()}`
    );

    console.log("✅ Mensaje enviado");

  } catch (error: any) {
    console.error("❌ Error en ciclo:");
    console.error(error?.response?.data || error.message || error);
  }
}

export function startDollarJob() {
  console.log("⏱️ Job iniciado");

  // ✅ Ejecuta inmediatamente
  runCycle();

  // ✅ Ejecuta cada 5 minutos
  setInterval(runCycle, 5 * 60 * 1000);
}
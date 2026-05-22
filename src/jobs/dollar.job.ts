import axios from "axios";
import { schedule, validate } from "node-cron";
import type { ScheduledTask } from "node-cron";
import {
  getOfficialDollars,
  getTradeableQuotes
} from "../services/dollar.service";
import { sendTelegram } from "../services/notification.service";
import { getBestPrice } from "../utils/alert.util";
import { saveLog } from "../storage/logger";
import { alertConfig, getPriceRange } from "../config/alert.config";
import { formatArs, formatPercentChange } from "../utils/format.util";
import {
  logCycleEnd,
  logCycleStart,
  logError,
  logInfo,
  logQuoteLine,
  logSkip,
  logSuccess,
  logWarn
} from "../utils/log.util";
import { buildRangeAlertMessage } from "../utils/telegram-message.util";

/** Mejor venta oficial del ciclo anterior (todas las lecturas, esté o no en rango). */
let lastCycleBestVenta: number | null = null;
let scheduledTask: ScheduledTask | null = null;
let isRunning = false;

export type DollarJobRunResult =
  | { executed: true }
  | { executed: false; reason: "already_running" };

async function runCycle() {
  logCycleStart();

  try {
    const { quotes, fetchErrors } = await getOfficialDollars();

    if (fetchErrors.length) {
      logWarn(
        `Fuentes no disponibles: ${fetchErrors.join(", ")}. Se continúa con las restantes.`
      );
    }

    if (!quotes.length) {
      logError("No se obtuvo el dólar oficial de ninguna fuente.");
      logCycleEnd();
      return;
    }

    quotes.forEach((d) => saveLog(d));

    const tradeableQuotes = getTradeableQuotes(quotes);

    if (!tradeableQuotes.length) {
      logError("No hay cotizaciones de venta oficiales para evaluar alertas.");
      logCycleEnd();
      return;
    }

    const best = getBestPrice(tradeableQuotes);
    const { min, max } = getPriceRange();
    const isInRange = best.venta >= min && best.venta <= max;
    const priceChangedSinceLastCycle =
      lastCycleBestVenta !== null && best.venta !== lastCycleBestVenta;

    logInfo(`Dólar oficial · ${quotes.length} fuentes consultadas:`);

    const sorted = [...quotes].sort((a, b) => a.venta - b.venta);
    for (const quote of sorted) {
      logQuoteLine(
        quote.label,
        quote.venta,
        !quote.isReference && quote.source === best.source
      );
    }

    console.log("");
    logInfo(`Mejor venta oficial: ${formatArs(best.venta)} (${best.label})`);
    logInfo(`Rango de alerta: ${formatArs(min)} – ${formatArs(max)}`);

    if (isInRange) {
      logSuccess("El dólar oficial está dentro del rango configurado.");
    } else if (best.venta < min) {
      logSkip(
        `Por debajo del mínimo (faltan ${formatArs(min - best.venta)} para entrar en rango).`
      );
    } else {
      logSkip(
        `Por encima del máximo (excede en ${formatArs(best.venta - max)}).`
      );
    }

    if (lastCycleBestVenta !== null) {
      const variation = formatPercentChange(lastCycleBestVenta, best.venta);

      if (priceChangedSinceLastCycle) {
        logInfo(
          `Variación: ${formatArs(lastCycleBestVenta)} → ${formatArs(best.venta)} · ${variation.text}`
        );
      } else {
        logSkip(`Sin cambios respecto al ciclo anterior (${variation.text}).`);
      }
    }

    if (
      isInRange &&
      priceChangedSinceLastCycle &&
      lastCycleBestVenta !== null
    ) {
      logInfo("Enviando alerta por Telegram...");

      const message = buildRangeAlertMessage({
        best,
        quotes,
        min,
        max,
        previousBest: lastCycleBestVenta
      });

      const sent = await sendTelegram(message);

      if (sent) {
        logSuccess("Alerta enviada por Telegram.");
      } else {
        logWarn(
          "No se pudo enviar la alerta (revisá TELEGRAM_TOKEN y TELEGRAM_CHAT_ID)."
        );
      }
    } else if (isInRange && !priceChangedSinceLastCycle) {
      logSkip("Precio estable en rango — no se envía alerta duplicada.");
    } else if (!isInRange) {
      logSkip("Fuera de rango — no corresponde alerta.");
    }

    lastCycleBestVenta = best.venta;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      logError(
        "Error al consultar cotizaciones",
        error.response?.data ?? error.message
      );
    } else if (error instanceof Error) {
      logError("Error inesperado", error.message);
    } else {
      logError("Error desconocido", error);
    }
  }

  logCycleEnd();
}

export async function runDollarJob(): Promise<DollarJobRunResult> {
  if (isRunning) {
    logSkip("Ciclo omitido: ya hay una consulta en curso.");
    return { executed: false, reason: "already_running" };
  }

  isRunning = true;
  try {
    await runCycle();
    return { executed: true };
  } finally {
    isRunning = false;
  }
}

export function startDollarJob() {
  const expression = alertConfig.cronSchedule;
  if (!validate(expression)) {
    throw new Error(
      `CRON_SCHEDULE no es una expresión válida: ${JSON.stringify(expression)}`
    );
  }

  console.log(
    `Monitor de dólar oficial activo · cron: ${expression} · zona horaria: ${alertConfig.cronTimezone}`
  );

  void runDollarJob();

  scheduledTask = schedule(
    expression,
    () => {
      void runDollarJob();
    },
    { timezone: alertConfig.cronTimezone, noOverlap: true }
  );
}

export function stopDollarJob() {
  scheduledTask?.stop();
  scheduledTask = null;
  console.log("Monitor de dólar oficial detenido.");
}

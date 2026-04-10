import axios from "axios";
import { schedule, validate } from "node-cron";
import type { ScheduledTask } from "node-cron";
import { getAllDollars, normalize } from "../services/dollar.service";
import { sendTelegram } from "../services/notification.service";
import { getBestPrice } from "../utils/alert.util";
import { saveLog } from "../storage/logger";
import { alertConfig } from "../config/alert.config";

/** Mejor `venta` del ciclo anterior (todas las lecturas, esté o no en rango). */
let lastCycleBestVenta: number | null = null;
let scheduledTask: ScheduledTask | null = null;

async function runCycle() {
  console.log("Ejecutando ciclo:", new Date().toLocaleString());

  try {
    const data = await getAllDollars();
    const normalized = normalize(data);

    console.log("Normalizados:", normalized);

    if (!normalized.length) {
      console.log("Sin datos");
      return;
    }

    normalized.forEach((d) => saveLog(d));

    const best = getBestPrice(normalized);
    console.log("Mejor precio:", best);

    const isInRange =
      best.venta >= alertConfig.min && best.venta <= alertConfig.max;

    const priceChangedSinceLastCycle =
      lastCycleBestVenta !== null && best.venta !== lastCycleBestVenta;

    console.log("Rango:", alertConfig.min, "-", alertConfig.max);
    console.log("¿Está dentro del rango?", isInRange);
    console.log("¿Cambió el mejor precio respecto al ciclo anterior?", priceChangedSinceLastCycle);

    if (isInRange && priceChangedSinceLastCycle) {
      console.log("Enviando notificación (cambio de precio y en rango)...");

      const sent = await sendTelegram(
        `DÓLAR EN RANGO

Precio: ${best.venta}
Fuente: ${best.source}

Rango: ${alertConfig.min} - ${alertConfig.max}
${new Date().toLocaleString()}`
      );

      if (sent) {
        console.log("Notificación enviada");
      }
    } else if (isInRange && !priceChangedSinceLastCycle) {
      console.log("Precio sin cambios respecto al ciclo anterior, no se notifica");
    } else if (!isInRange) {
      console.log("Fuera del rango, no se notifica");
    }

    lastCycleBestVenta = best.venta;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error(
        "Error HTTP:",
        error.response?.data ?? error.message
      );
    } else if (error instanceof Error) {
      console.error("Error:", error.message);
    } else {
      console.error("Error desconocido:", error);
    }
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
    "Job iniciado (cron:",
    expression,
    "tz:",
    alertConfig.cronTimezone + ")"
  );

  void runCycle();

  scheduledTask = schedule(
    expression,
    () => {
      void runCycle();
    },
    { timezone: alertConfig.cronTimezone, noOverlap: true }
  );
}

export function stopDollarJob() {
  scheduledTask?.stop();
  scheduledTask = null;
}

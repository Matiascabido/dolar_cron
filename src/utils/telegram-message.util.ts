import type { DollarQuote } from "../services/dollar.service";
import {
  formatArs,
  formatCompraVenta,
  formatDateAr,
  formatPercentChange,
  formatPriceChange
} from "./format.util";

function formatQuoteLine(quote: DollarQuote): string {
  if (quote.isReference) {
    return `Referencia: ${formatArs(quote.venta)}`;
  }

  return formatCompraVenta(quote.compra, quote.venta);
}

export function buildRangeAlertMessage(params: {
  best: DollarQuote;
  quotes: DollarQuote[];
  min: number;
  max: number;
  previousBest: number;
}): string {
  const { best, quotes, min, max, previousBest } = params;
  const variation = formatPercentChange(previousBest, best.venta);
  const variationEmoji =
    variation.direction === "up"
      ? "📈"
      : variation.direction === "down"
        ? "📉"
        : "➡️";

  const lines: string[] = [
    "🔔 DÓLAR OFICIAL EN TU RANGO DE ALERTA",
    "",
    `Valor anterior (venta): ${formatArs(previousBest)}`,
    `Valor actual (venta): ${formatArs(best.venta)}`,
    `Variación: ${variationEmoji} ${variation.text}`,
    `Detalle: ${formatPriceChange(previousBest, best.venta)}`,
    "",
    `Mejor cotización: ${formatQuoteLine(best)}`,
    `Fuente: ${best.label}`,
    "",
    `Rango configurado: ${formatArs(min)} – ${formatArs(max)}`,
    "Estado: el dólar oficial está dentro del rango que definiste."
  ];

  lines.push("");
  lines.push("Cotizaciones oficiales consultadas:");

  const sorted = [...quotes].sort((a, b) => a.venta - b.venta);

  for (const quote of sorted) {
    const marker = quote.source === best.source ? " ← referencia" : "";
    lines.push(`  • ${quote.label}: ${formatQuoteLine(quote)}${marker}`);
  }

  lines.push("");
  lines.push(`Consultado: ${formatDateAr()} (Argentina)`);

  return lines.join("\n");
}

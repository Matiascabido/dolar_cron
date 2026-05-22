import type { DollarQuote } from "../services/dollar.service";

export function getBestPrice(data: DollarQuote[]): DollarQuote {
  if (!data.length) {
    throw new Error("getBestPrice: el arreglo de cotizaciones está vacío");
  }

  return data.reduce((best, current) =>
    current.venta < best.venta ? current : best
  );
}

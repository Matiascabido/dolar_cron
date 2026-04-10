export function getBestPrice(data: { source: string; venta: number }[]) {
  if (!data.length) {
    throw new Error("getBestPrice: el arreglo de cotizaciones está vacío");
  }
  return data.reduce((best, current) =>
    current.venta < best.venta ? current : best
  );
}

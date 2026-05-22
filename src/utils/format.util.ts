const AR_TIMEZONE = "America/Argentina/Buenos_Aires";

export function formatArs(amount: number): string {
  return `$ ${amount.toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
}

export function formatDateAr(date = new Date()): string {
  return date.toLocaleString("es-AR", {
    timeZone: AR_TIMEZONE,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

export function formatPriceChange(
  previous: number,
  current: number
): string {
  const diff = current - previous;
  const sign = diff > 0 ? "+" : "";

  return `${formatArs(previous)} → ${formatArs(current)} (${sign}${formatArs(diff)})`;
}

export function formatCompraVenta(
  compra: number | undefined,
  venta: number
): string {
  if (typeof compra === "number" && Number.isFinite(compra)) {
    return `Compra ${formatArs(compra)} · Venta ${formatArs(venta)}`;
  }

  return `Venta ${formatArs(venta)}`;
}

export function formatPercentChange(
  previous: number,
  current: number
): { text: string; direction: "up" | "down" | "unchanged" } {
  if (previous === 0) {
    return { text: "0,00% (sin cambio)", direction: "unchanged" };
  }

  const pct = ((current - previous) / previous) * 100;
  const sign = pct > 0 ? "+" : "";
  const direction = pct > 0 ? "up" : pct < 0 ? "down" : "unchanged";
  const verb =
    direction === "up" ? "subió" : direction === "down" ? "bajó" : "sin cambio";

  return {
    text: `${sign}${pct.toFixed(2).replace(".", ",")}% (${verb})`,
    direction
  };
}

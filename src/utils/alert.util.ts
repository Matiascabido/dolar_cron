let lastAlert = 0;

export function shouldAlert(price: number, min: number, max: number) {
  return price < min || price > max;
}

export function canSendAlert(cooldownMs: number) {
  const now = Date.now();

  if (now - lastAlert > cooldownMs) {
    lastAlert = now;
    return true;
  }

  return false;
}

export function getBestPrice(data: { source: string; venta: number }[]) {
  return data.reduce((best, current) =>
    current.venta < best.venta ? current : best
  );
}
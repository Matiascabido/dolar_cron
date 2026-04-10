export const alertConfig = {
  min: Number(process.env.MIN_PRICE),
  max: Number(process.env.MAX_PRICE),
  cooldownMs: Number(process.env.COOLDOWN_MINUTES || 30) * 60 * 1000
};
import "./env";
import { buildApp } from "./app";
import { startDollarJob, stopDollarJob } from "./jobs/dollar.job";

const PORT = Number(process.env.PORT) || 3000;

const app = buildApp();

async function main() {
  await app.listen({ port: PORT, host: "0.0.0.0" });
  app.log.info(`Servidor en puerto ${PORT}`);
  startDollarJob();

  const shutdown = async (signal: string) => {
    app.log.info({ signal }, "Cerrando");
    stopDollarJob();
    await app.close();
    process.exit(0);
  };

  process.once("SIGINT", () => {
    void shutdown("SIGINT");
  });
  process.once("SIGTERM", () => {
    void shutdown("SIGTERM");
  });
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});

import Fastify from "fastify";
import { getPriceRange } from "./config/alert.config";
import { runDollarJob } from "./jobs/dollar.job";
import { testTelegram } from "./services/notification.service";

export function buildApp() {
  const app = Fastify({
    logger: true
  });

  app.get("/health", async () => {
    return { status: "ok" };
  });

  app.get("/telegram/test", async (_request, reply) => {
    const result = await testTelegram();

    if (!result.ok) {
      return reply.status(400).send({
        status: "error",
        ...result
      });
    }

    return {
      status: "ok",
      ...result
    };
  });

  app.get("/", async () => {
    const result = await runDollarJob();

    return {
      status: "ok",
      job: result.executed ? "executed" : result.reason,
      range: getPriceRange()
    };
  });

  return app;
}
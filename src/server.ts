import { buildApp } from "./app";
import { startDollarJob } from "./jobs/dollar.job";
import dotenv from "dotenv";

dotenv.config();

const app = buildApp();

const start = async () => {
  try {
    await app.listen({ port: 3000 });

    console.log("🚀 Server corriendo");
    startDollarJob();

  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();
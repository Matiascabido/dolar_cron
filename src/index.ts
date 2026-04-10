import dotenv from "dotenv";
import { startDollarJob } from "./jobs/dollar.job";

function main() {
  dotenv.config();

  console.log("🚀 Iniciando dolar cron...");
  startDollarJob();
}

main();
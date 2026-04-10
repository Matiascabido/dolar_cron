import dotenv from "dotenv";
import { startDollarJob } from "./jobs/dollar.job";
import http from "http";

dotenv.config();

const PORT = process.env.PORT || 3000;

// 👇 IMPORTANTE: iniciar el job
startDollarJob();

http.createServer((req, res) => {
  res.writeHead(200);
  res.end("OK");
}).listen(PORT, () => {
  console.log(`🌐 Server activo en puerto ${PORT}`);
});
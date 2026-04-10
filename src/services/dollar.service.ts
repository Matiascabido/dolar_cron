import axios from "axios";

export async function getAllDollars() {
  const [dolarapiRes, bluelyticsRes] = await Promise.all([
    axios.get("https://dolarapi.com/v1/dolares"),
    axios.get("https://api.bluelytics.com.ar/v2/latest")
  ]);

  return {
    dolarapi: dolarapiRes.data,
    bluelytics: bluelyticsRes.data
  };
}

export function normalize(data: any) {
  return [
    {
      source: "oficial_dolarapi",
      venta: data.dolarapi.find((d: any) => d.casa === "oficial")?.venta
    },
    {
      source: "blue_dolarapi",
      venta: data.dolarapi.find((d: any) => d.casa === "blue")?.venta
    },
    {
      source: "blue_bluelytics",
      venta: data.bluelytics.blue.value_sell
    },
    {
      source: "oficial_bluelytics",
      venta: data.bluelytics.oficial.value_sell
    }
  ].filter(d => d.venta !== undefined);
}
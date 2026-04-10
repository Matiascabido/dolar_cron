import axios from "axios";

const HTTP_TIMEOUT_MS = 15_000;

type DolarApiCasa = { casa: string; venta: number };

type BluelyticsLatest = {
  blue: { value_sell: number };
  oficial: { value_sell: number };
};

export type DollarQuote = {
  source: string;
  venta: number;
};

export type DollarSourcesPayload = {
  dolarapi: DolarApiCasa[];
  bluelytics: BluelyticsLatest;
};

export async function getAllDollars(): Promise<DollarSourcesPayload> {
  const [dolarapiRes, bluelyticsRes] = await Promise.all([
    axios.get<DolarApiCasa[]>("https://dolarapi.com/v1/dolares", {
      timeout: HTTP_TIMEOUT_MS
    }),
    axios.get<BluelyticsLatest>("https://api.bluelytics.com.ar/v2/latest", {
      timeout: HTTP_TIMEOUT_MS
    })
  ]);

  return {
    dolarapi: dolarapiRes.data,
    bluelytics: bluelyticsRes.data
  };
}

export function normalize(data: DollarSourcesPayload): DollarQuote[] {
  return [
    {
      source: "oficial_dolarapi",
      venta: data.dolarapi.find((d) => d.casa === "oficial")?.venta
    },
    {
      source: "blue_dolarapi",
      venta: data.dolarapi.find((d) => d.casa === "blue")?.venta
    },
    {
      source: "blue_bluelytics",
      venta: data.bluelytics.blue.value_sell
    },
    {
      source: "oficial_bluelytics",
      venta: data.bluelytics.oficial.value_sell
    }
  ].filter(
    (d): d is DollarQuote =>
      typeof d.venta === "number" && Number.isFinite(d.venta)
  );
}

import axios from "axios";

const HTTP_TIMEOUT_MS = 15_000;

type DolarApiOficial = {
  venta: number;
  compra?: number;
  fechaActualizacion?: string;
};

type BluelyticsLatest = {
  oficial: { value_sell: number; value_buy: number };
};

type ArgentinaDatosOficial = {
  venta: number;
  compra?: number;
  fecha?: string;
};

type BcraCotizacionResponse = {
  results: Array<{
    fecha: string;
    detalle: Array<{
      tipoCotizacion: number;
    }>;
  }>;
};

export type DollarQuote = {
  source: string;
  label: string;
  compra?: number;
  venta: number;
  /** Cotización de referencia del BCRA, no precio de venta minorista. */
  isReference?: boolean;
};

export type OfficialDollarPayload = {
  quotes: DollarQuote[];
  fetchErrors: string[];
};

function getArgentinaDatePath(date = new Date()): string {
  const iso = date.toLocaleDateString("en-CA", {
    timeZone: "America/Argentina/Buenos_Aires"
  });
  const [year, month, day] = iso.split("-");

  return `${year}/${month}/${day}`;
}

function shiftDays(date: Date, days: number): Date {
  const shifted = new Date(date);
  shifted.setDate(shifted.getDate() + days);
  return shifted;
}

function makeQuote(
  source: string,
  label: string,
  venta: number | undefined,
  compra?: number | undefined,
  isReference = false
): DollarQuote | null {
  if (typeof venta !== "number" || !Number.isFinite(venta)) {
    return null;
  }

  const quote: DollarQuote = { source, label, venta, isReference };

  if (typeof compra === "number" && Number.isFinite(compra)) {
    quote.compra = compra;
  }

  return quote;
}

async function fetchArgentinaDatosOficial(): Promise<ArgentinaDatosOficial | null> {
  const today = new Date();

  for (const offset of [0, -1]) {
    const datePath = getArgentinaDatePath(shiftDays(today, offset));

    try {
      const response = await axios.get<ArgentinaDatosOficial>(
        `https://api.argentinadatos.com/v1/cotizaciones/dolares/oficial/${datePath}`,
        { timeout: HTTP_TIMEOUT_MS }
      );

      if (
        typeof response.data.venta === "number" &&
        Number.isFinite(response.data.venta)
      ) {
        return response.data;
      }
    } catch {
      // Intenta con el día anterior si hoy aún no está publicado.
    }
  }

  return null;
}

export async function getOfficialDollars(): Promise<OfficialDollarPayload> {
  const [
    dolarapiRes,
    ambitoRes,
    bluelyticsRes,
    argentinaDatosRes,
    bcraRes
  ] = await Promise.allSettled([
    axios.get<DolarApiOficial>("https://dolarapi.com/v1/dolares/oficial", {
      timeout: HTTP_TIMEOUT_MS
    }),
    axios.get<DolarApiOficial>(
      "https://dolarapi.com/v1/ambito/dolares/oficial",
      { timeout: HTTP_TIMEOUT_MS }
    ),
    axios.get<BluelyticsLatest>("https://api.bluelytics.com.ar/v2/latest", {
      timeout: HTTP_TIMEOUT_MS
    }),
    fetchArgentinaDatosOficial(),
    axios.get<BcraCotizacionResponse>(
      "https://api.bcra.gob.ar/estadisticascambiarias/v1.0/Cotizaciones/USD",
      { timeout: HTTP_TIMEOUT_MS, headers: { Accept: "application/json" } }
    )
  ]);

  const quotes: DollarQuote[] = [];
  const fetchErrors: string[] = [];

  if (dolarapiRes.status === "fulfilled") {
    const { venta, compra } = dolarapiRes.value.data;
    const quote = makeQuote(
      "oficial_dolarapi",
      "Oficial (DolarAPI)",
      venta,
      compra
    );
    if (quote) quotes.push(quote);
  } else {
    fetchErrors.push("DolarAPI");
  }

  if (ambitoRes.status === "fulfilled") {
    const { venta, compra } = ambitoRes.value.data;
    const quote = makeQuote(
      "oficial_ambito",
      "Oficial (Ámbito Financiero)",
      venta,
      compra
    );
    if (quote) quotes.push(quote);
  } else {
    fetchErrors.push("Ámbito Financiero");
  }

  if (bluelyticsRes.status === "fulfilled") {
    const { value_sell, value_buy } = bluelyticsRes.value.data.oficial;
    const quote = makeQuote(
      "oficial_bluelytics",
      "Oficial (Bluelytics)",
      value_sell,
      value_buy
    );
    if (quote) quotes.push(quote);
  } else {
    fetchErrors.push("Bluelytics");
  }

  if (argentinaDatosRes.status === "fulfilled" && argentinaDatosRes.value) {
    const { venta, compra } = argentinaDatosRes.value;
    const quote = makeQuote(
      "oficial_argentinadatos",
      "Oficial (ArgentinaDatos)",
      venta,
      compra
    );
    if (quote) quotes.push(quote);
  } else {
    fetchErrors.push("ArgentinaDatos");
  }

  if (bcraRes.status === "fulfilled") {
    const bcraValue =
      bcraRes.value.data.results[0]?.detalle[0]?.tipoCotizacion;
    const quote = makeQuote(
      "oficial_bcra",
      "Oficial (BCRA · referencia)",
      bcraValue,
      undefined,
      true
    );
    if (quote) quotes.push(quote);
  } else {
    fetchErrors.push("BCRA");
  }

  return { quotes, fetchErrors };
}

/** Compatibilidad con el job: devuelve solo cotizaciones de venta oficial. */
export function getTradeableQuotes(quotes: DollarQuote[]): DollarQuote[] {
  return quotes.filter((quote) => !quote.isReference);
}

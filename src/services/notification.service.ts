import axios from "axios";

const HTTP_TIMEOUT_MS = 15_000;

type TelegramConfig = {
  token: string;
  chatId: string;
};

type TelegramApiError = {
  ok: false;
  error_code?: number;
  description?: string;
};

type TelegramBotInfo = {
  ok: true;
  result: {
    id: number;
    is_bot: boolean;
    first_name: string;
    username?: string;
  };
};

type TelegramChatInfo = {
  ok: true;
  result: {
    id: number;
    type: string;
    title?: string;
    username?: string;
    first_name?: string;
  };
};

export type TelegramTestResult =
  | {
      ok: true;
      bot: {
        id: number;
        username?: string;
        name: string;
      };
      chat: {
        id: number;
        type: string;
        title?: string;
        username?: string;
        firstName?: string;
      };
      messageSent: true;
    }
  | {
      ok: false;
      step: "config" | "getMe" | "getChat" | "sendMessage";
      message: string;
      telegram?: TelegramApiError;
    };

function readTelegramConfig(): TelegramConfig | null {
  const token = process.env.TELEGRAM_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

  if (!token || !chatId) {
    return null;
  }

  return { token, chatId };
}

function extractTelegramError(err: unknown): TelegramApiError | undefined {
  if (axios.isAxiosError(err) && err.response?.data) {
    return err.response.data as TelegramApiError;
  }

  return undefined;
}

export async function sendTelegram(message: string): Promise<boolean> {
  const config = readTelegramConfig();

  if (!config) {
    console.error(
      "  ✗ Telegram no configurado. Definí TELEGRAM_TOKEN y TELEGRAM_CHAT_ID en el entorno."
    );
    return false;
  }

  try {
    await axios.post(
      `https://api.telegram.org/bot${config.token}/sendMessage`,
      {
        chat_id: config.chatId,
        text: message
      },
      { timeout: HTTP_TIMEOUT_MS }
    );
    return true;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      console.error(
        "  ✗ Fallo al enviar Telegram:",
        err.response?.data ?? err.message
      );
    } else {
      console.error("  ✗ Fallo al enviar Telegram:", err);
    }
    return false;
  }
}

export async function testTelegram(): Promise<TelegramTestResult> {
  const config = readTelegramConfig();

  if (!config) {
    return {
      ok: false,
      step: "config",
      message:
        "Faltan TELEGRAM_TOKEN o TELEGRAM_CHAT_ID. Configuralos en el entorno o en .env."
    };
  }

  let botInfo: TelegramBotInfo["result"];

  try {
    const response = await axios.get<TelegramBotInfo>(
      `https://api.telegram.org/bot${config.token}/getMe`,
      { timeout: HTTP_TIMEOUT_MS }
    );
    botInfo = response.data.result;
  } catch (err: unknown) {
    return {
      ok: false,
      step: "getMe",
      message: "El token del bot no es válido o Telegram no respondió.",
      telegram: extractTelegramError(err)
    };
  }

  let chatInfo: TelegramChatInfo["result"];

  try {
    const response = await axios.get<TelegramChatInfo>(
      `https://api.telegram.org/bot${config.token}/getChat`,
      {
        params: { chat_id: config.chatId },
        timeout: HTTP_TIMEOUT_MS
      }
    );
    chatInfo = response.data.result;
  } catch (err: unknown) {
    const telegram = extractTelegramError(err);

    return {
      ok: false,
      step: "getChat",
      message:
        "No se pudo acceder al chat. Verificá el TELEGRAM_CHAT_ID y que le hayas enviado /start al bot.",
      telegram
    };
  }

  const testMessage = [
    "✅ Prueba de dolar_cron",
    "",
    "Telegram está configurado correctamente.",
    `Bot: @${botInfo.username ?? botInfo.first_name}`,
    `Chat ID: ${chatInfo.id}`,
    `Tipo de chat: ${chatInfo.type}`
  ].join("\n");

  try {
    await axios.post(
      `https://api.telegram.org/bot${config.token}/sendMessage`,
      {
        chat_id: config.chatId,
        text: testMessage
      },
      { timeout: HTTP_TIMEOUT_MS }
    );
  } catch (err: unknown) {
    return {
      ok: false,
      step: "sendMessage",
      message:
        "El bot y el chat existen, pero no se pudo enviar el mensaje de prueba.",
      telegram: extractTelegramError(err)
    };
  }

  return {
    ok: true,
    bot: {
      id: botInfo.id,
      username: botInfo.username,
      name: botInfo.first_name
    },
    chat: {
      id: chatInfo.id,
      type: chatInfo.type,
      title: chatInfo.title,
      username: chatInfo.username,
      firstName: chatInfo.first_name
    },
    messageSent: true
  };
}

import axios from "axios";

const HTTP_TIMEOUT_MS = 15_000;

export async function sendTelegram(message: string): Promise<boolean> {
  const token = process.env.TELEGRAM_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    console.error("Telegram no configurado (TELEGRAM_TOKEN / TELEGRAM_CHAT_ID)");
    return false;
  }

  try {
    await axios.post(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        chat_id: chatId,
        text: message
      },
      { timeout: HTTP_TIMEOUT_MS }
    );
    return true;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      console.error(
        "Fallo al enviar Telegram:",
        err.response?.data ?? err.message
      );
    } else {
      console.error("Fallo al enviar Telegram:", err);
    }
    return false;
  }
}

import { createAdminSupabaseClient } from "./server";

/**
 * Send a broadcast message to Supabase Realtime channel
 * @param clientId - Client ID to send message to
 * @param payload - Message payload to broadcast
 */
export async function sendRealtimeBroadcast(
  clientId: string,
  payload: {
    sender: "client" | "support";
    text: string;
    createdAt: string;
  }
) {
  try {
    const supabase = createAdminSupabaseClient();
    const channel = supabase.channel(`support_chat:${clientId}`, {
      config: {
        broadcast: { self: true },
      },
    });

    // Подписываемся на канал с таймаутом
    const subscribePromise = new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Channel subscription timeout"));
      }, 5000);

      channel
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            clearTimeout(timeout);
            resolve();
          } else if (status === "CHANNEL_ERROR") {
            clearTimeout(timeout);
            reject(new Error("Channel subscription failed"));
          }
        });
    });

    await subscribePromise;

    // Отправляем broadcast
    const status = await channel.send({
      type: "broadcast",
      event: "new_message",
      payload,
    });

    // Небольшая задержка перед отключением, чтобы сообщение успело отправиться
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Отключаемся от канала после отправки
    await supabase.removeChannel(channel);

    return status;
  } catch (error) {
    console.error("Error sending realtime broadcast:", error);
    throw error;
  }
}


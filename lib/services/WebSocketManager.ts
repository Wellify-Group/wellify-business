// lib/services/WebSocketManager.ts
// Менеджер WebSocket соединений для мгновенной доставки сообщений

import { saveSupportMessage } from "@/lib/db-support";

export interface WebSocketMessage {
  type: "message" | "ping" | "pong" | "error";
  cid?: string;
  data?: any;
  error?: string;
}

export class WebSocketManager {
  private connections: Map<string, Set<WebSocket>> = new Map();

  /**
   * Добавить WebSocket соединение для CID
   */
  addConnection(cid: string, ws: WebSocket): void {
    if (!this.connections.has(cid)) {
      this.connections.set(cid, new Set());
    }
    this.connections.get(cid)!.add(ws);

    console.log(`[WebSocketManager] Added connection for CID: ${cid} (total: ${this.connections.get(cid)!.size})`);

    // Отправляем ping каждые 30 секунд для поддержания соединения
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({ type: "ping" }));
        } catch (error) {
          console.error("[WebSocketManager] Error sending ping:", error);
          this.removeConnection(cid, ws);
          clearInterval(pingInterval);
        }
      } else {
        clearInterval(pingInterval);
      }
    }, 30000);

    // Обработка закрытия соединения
    ws.addEventListener("close", () => {
      this.removeConnection(cid, ws);
      clearInterval(pingInterval);
    });

    // Обработка ошибок
    ws.addEventListener("error", (error) => {
      console.error(`[WebSocketManager] WebSocket error for CID ${cid}:`, error);
      this.removeConnection(cid, ws);
      clearInterval(pingInterval);
    });

    // Обработка pong
    ws.addEventListener("message", (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data.toString());
        if (message.type === "pong") {
          // Соединение активно
        }
      } catch (error) {
        // Игнорируем некорректные сообщения
      }
    });
  }

  /**
   * Удалить WebSocket соединение
   */
  removeConnection(cid: string, ws: WebSocket): void {
    const connections = this.connections.get(cid);
    if (connections) {
      connections.delete(ws);
      if (connections.size === 0) {
        this.connections.delete(cid);
      }
      console.log(`[WebSocketManager] Removed connection for CID: ${cid} (remaining: ${connections.size})`);
    }
  }

  /**
   * Отправить сообщение всем соединениям для CID
   */
  async sendMessage(cid: string, message: WebSocketMessage): Promise<boolean> {
    const connections = this.connections.get(cid);
    if (!connections || connections.size === 0) {
      return false;
    }

    const messageStr = JSON.stringify(message);
    let sent = false;

    for (const ws of connections) {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(messageStr);
          sent = true;
        } catch (error) {
          console.error(`[WebSocketManager] Error sending message to CID ${cid}:`, error);
          this.removeConnection(cid, ws);
        }
      } else {
        // Удаляем закрытые соединения
        this.removeConnection(cid, ws);
      }
    }

    return sent;
  }

  /**
   * Отправить новое сообщение от поддержки клиенту
   */
  async broadcastSupportMessage(cid: string, text: string): Promise<boolean> {
    const message: WebSocketMessage = {
      type: "message",
      cid,
      data: {
        id: crypto.randomUUID(),
        cid,
        author: "support",
        text,
        createdAt: new Date().toISOString(),
      },
    };

    return await this.sendMessage(cid, message);
  }

  /**
   * Получить количество активных соединений для CID
   */
  getConnectionCount(cid: string): number {
    return this.connections.get(cid)?.size || 0;
  }

  /**
   * Получить общее количество активных соединений
   */
  getTotalConnections(): number {
    let total = 0;
    for (const connections of this.connections.values()) {
      total += connections.size;
    }
    return total;
  }

  /**
   * Проверить, есть ли активные соединения для CID
   */
  hasConnections(cid: string): boolean {
    return (this.connections.get(cid)?.size || 0) > 0;
  }
}

// Singleton instance
export const webSocketManager = new WebSocketManager();


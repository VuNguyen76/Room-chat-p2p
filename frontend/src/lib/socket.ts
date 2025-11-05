import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "@/utils/constants";

// Singleton socket instance to prevent multiple connections in React StrictMode
let socketInstance: Socket | null = null;

export function getSocket(): Socket {
  if (!socketInstance) {
    if (!SOCKET_URL) {
      throw new Error("Socket URL not configured");
    }

    socketInstance = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      timeout: 20000,
      forceNew: false,
      autoConnect: true,
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });
  }

  return socketInstance;
}

export function disconnectSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

export function isSocketConnected(): boolean {
  return socketInstance?.connected || false;
}

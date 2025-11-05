import { useEffect, useRef } from "react";
import { getSocket } from "@/lib/socket";

interface RealtimeMessage {
  id: string;
  content: string;
  userSnapshot: { displayName: string; avatarUrl?: string };
  createdAt: string;
  sessionRef: string;
  type: "text" | "system";
}

interface UseRealtimeMessagesOptions {
  roomId?: string;
  onMessage?: (message: RealtimeMessage) => void;
}

export function useRealtimeMessages({
  roomId,
  onMessage,
}: UseRealtimeMessagesOptions) {
  const processedMessageIds = useRef<Set<string>>(new Set());
  const currentRoomId = useRef<string | undefined>(roomId);

  // Update current room ID
  useEffect(() => {
    if (roomId !== currentRoomId.current) {
      // Clear processed IDs when room changes
      processedMessageIds.current.clear();
      currentRoomId.current = roomId;
    }
  }, [roomId]);

  // Setup socket listener
  useEffect(() => {
    if (!roomId) return;

    const socket = getSocket();
    if (!socket) return;

    const messageHandler = (data: any) => {
      if (!roomId || !onMessage) {
        return;
      }

      if (processedMessageIds.current.has(data.id)) {
        return;
      }

      processedMessageIds.current.add(data.id);

      const message: RealtimeMessage = {
        id: data.id,
        content: data.content,
        userSnapshot: data.userSnapshot,
        createdAt: data.createdAt,
        sessionRef: data.sessionRef,
        type: data.type || "text",
      };

      onMessage(message);
    };

    socket.off("message:created");
    socket.on("message:created", messageHandler);

    return () => {
      socket.off("message:created", messageHandler);
    };
  }, [roomId, onMessage]);

  return {
    clearProcessedMessages: () => {
      processedMessageIds.current.clear();
    },
  };
}

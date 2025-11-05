import { useEffect, useRef, useCallback, useState } from "react";
import { Socket } from "socket.io-client";
import { getSocket } from "@/lib/socket";

export interface SignalingEvents {
  "user-joined": (data: {
    socketId: string;
    sessionId: string;
    userSnapshot: { displayName: string; avatarUrl?: string };
    mediaState: { video: boolean; audio: boolean; screen: boolean };
  }) => void;
  "user-left": (data: { socketId: string; sessionId: string }) => void;
  "user-reconnected": (data: {
    socketId: string;
    sessionId: string;
    userSnapshot: { displayName: string; avatarUrl?: string };
    mediaState: { video: boolean; audio: boolean; screen: boolean };
  }) => void;
  offer: (data: { from: string; sdp: RTCSessionDescriptionInit }) => void;
  answer: (data: { from: string; sdp: RTCSessionDescriptionInit }) => void;
  "ice-candidate": (data: {
    from: string;
    candidate: RTCIceCandidateInit;
  }) => void;
  "event:created": (data: {
    eventType: string;
    userSnapshot: { displayName: string; avatarUrl?: string };
    sessionRef: string;
    metadata?: any;
    createdAt: string;
  }) => void;
  "message:created": (data: {
    id: string;
    sessionRef: string;
    content: string;
    userSnapshot: { displayName: string; avatarUrl?: string };
    createdAt: string;
    type: string;
  }) => void;
  "room-error": (data: {
    error: string;
    message: string;
    details?: any[];
  }) => void;
}

export interface UseSignalingOptions {
  onUserJoined?: (
    socketId: string,
    sessionId: string,
    userSnapshot: { displayName: string; avatarUrl?: string },
    mediaState: { video: boolean; audio: boolean; screen: boolean }
  ) => void;
  onUserLeft?: (socketId: string, sessionId: string) => void;
  onUserReconnected?: (
    socketId: string,
    sessionId: string,
    userSnapshot: { displayName: string; avatarUrl?: string },
    mediaState: { video: boolean; audio: boolean; screen: boolean }
  ) => void;
  onOffer?: (fromSocketId: string, offer: RTCSessionDescriptionInit) => void;
  onAnswer?: (fromSocketId: string, answer: RTCSessionDescriptionInit) => void;
  onIceCandidate?: (
    fromSocketId: string,
    candidate: RTCIceCandidateInit
  ) => void;
  onMediaEvent?: (
    eventType: string,
    userSnapshot: { displayName: string; avatarUrl?: string },
    sessionRef: string,
    metadata?: any
  ) => void;
  onMessage?: (message: {
    id: string;
    sessionRef: string;
    content: string;
    userSnapshot: { displayName: string; avatarUrl?: string };
    createdAt: string;
    type: string;
  }) => void;
  onError?: (error: string, message: string, details?: any[]) => void;
}

export interface UseSignalingReturn {
  socket: Socket | null;
  isConnected: boolean;
  joinRoom: (
    roomId: string,
    displayName: string,
    avatarUrl?: string,
    deviceInfo?: any
  ) => Promise<{
    success: boolean;
    self?: any;
    peers?: any[];
    room?: any;
    error?: string;
    message?: string;
  }>;
  leaveRoom: () => Promise<{
    success: boolean;
    error?: string;
    message?: string;
  }>;
  sendOffer: (toSocketId: string, offer: RTCSessionDescriptionInit) => void;
  sendAnswer: (toSocketId: string, answer: RTCSessionDescriptionInit) => void;
  sendIceCandidate: (
    toSocketId: string,
    candidate: RTCIceCandidateInit
  ) => void;
  sendMediaEvent: (
    roomId: string,
    type: string,
    metadata?: any
  ) => Promise<{
    success: boolean;
    eventId?: string;
    error?: string;
    message?: string;
  }>;
  sendMessage: (
    roomId: string,
    content: string
  ) => Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
    message?: string;
  }>;
  disconnect: () => void;
  getCurrentRoomId: () => string | null;
}

export function useSignaling(
  options: UseSignalingOptions = {}
): UseSignalingReturn {
  const {
    onUserJoined,
    onUserLeft,
    onUserReconnected,
    onOffer,
    onAnswer,
    onIceCandidate,
    onMediaEvent,
    onMessage,
    onError,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const currentRoomRef = useRef<string | null>(null);
  const currentRoomIdRef = useRef<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Initialize socket connection
  useEffect(() => {
    try {
      const socket = getSocket();
      socketRef.current = socket;
      setIsConnected(socket.connected);

      socket.on("connect", () => {
        setIsConnected(true);
      });

      socket.on("disconnect", () => {
        setIsConnected(false);
      });

      socket.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        onError?.("Failed to connect to signaling server", "Connection error");
      });

      socket.on("user-joined", (data) => {
        onUserJoined?.(
          data.socketId,
          data.sessionId,
          data.userSnapshot,
          data.mediaState
        );
      });

      socket.on("user-left", (data) => {
        onUserLeft?.(data.socketId, data.sessionId);
      });

      socket.on("user-reconnected", (data) => {
        onUserReconnected?.(
          data.socketId,
          data.sessionId,
          data.userSnapshot,
          data.mediaState
        );
      });

      socket.on("offer", (data) => {
        onOffer?.(data.from, data.sdp);
      });

      socket.on("answer", (data) => {
        onAnswer?.(data.from, data.sdp);
      });

      socket.on("ice-candidate", (data) => {
        onIceCandidate?.(data.from, data.candidate);
      });

      socket.on("event:created", (data) => {
        onMediaEvent?.(
          data.eventType,
          data.userSnapshot,
          data.sessionRef,
          data.metadata
        );
      });

      socket.off("message:created");

      socket.on("message:created", (data) => {
        onMessage?.(data);
      });

      socket.on("room-error", (data) => {
        console.error("Room error:", data);
        onError?.(data.error, data.message, data.details);
      });
    } catch (error) {
      console.error("Failed to initialize socket:", error);
      onError?.("Failed to connect to signaling server", "Connection error");
    }

    return () => {
      // Don't disconnect singleton socket on cleanup
      socketRef.current = null;
    };
  }, []); // Empty deps - setup once, callbacks captured in closure

  const joinRoom = useCallback(
    (
      roomId: string,
      displayName: string,
      avatarUrl?: string,
      deviceInfo?: any
    ) => {
      return new Promise<{
        success: boolean;
        self?: any;
        peers?: any[];
        room?: unknown;
        error?: string;
        message?: string;
      }>((resolve) => {
        if (socketRef.current?.connected) {
          currentRoomRef.current = roomId;
          currentRoomIdRef.current = roomId;
          socketRef.current.emit(
            "join-room",
            { roomId, displayName, avatarUrl, deviceInfo },
            (response: {
              success: boolean;
              self?: any;
              peers?: any[];
              room?: unknown;
              error?: string;
              message?: string;
            }) => {
              resolve(response);
            }
          );
        } else {
          const error = {
            success: false,
            error: "NOT_CONNECTED",
            message: "Not connected to signaling server",
          };
          onError?.("NOT_CONNECTED", "Not connected to signaling server");
          resolve(error);
        }
      });
    },
    [onError]
  );

  const leaveRoom = useCallback(() => {
    return new Promise<{ success: boolean; error?: string; message?: string }>(
      (resolve) => {
        if (socketRef.current?.connected && currentRoomRef.current) {
          socketRef.current.emit(
            "leave-room",
            { roomId: currentRoomRef.current },
            (response: unknown) => {
              currentRoomRef.current = null;
              resolve(
                response as {
                  success: boolean;
                  error?: string;
                  message?: string;
                }
              );
            }
          );
        } else {
          resolve({
            success: false,
            error: "NOT_IN_ROOM",
            message: "Not in a room",
          });
        }
      }
    );
  }, []);

  const sendOffer = useCallback(
    (toSocketId: string, offer: RTCSessionDescriptionInit) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("offer", {
          to: toSocketId,
          sdp: offer,
        });
      }
    },
    []
  );

  const sendAnswer = useCallback(
    (toSocketId: string, answer: RTCSessionDescriptionInit) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("answer", {
          to: toSocketId,
          sdp: answer,
        });
      }
    },
    []
  );

  const sendIceCandidate = useCallback(
    (toSocketId: string, candidate: RTCIceCandidateInit) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("ice-candidate", {
          to: toSocketId,
          candidate,
        });
      }
    },
    []
  );

  const sendMediaEvent = useCallback(
    (roomId: string, type: string, metadata?: unknown) => {
      return new Promise<{
        success: boolean;
        eventId?: string;
        error?: string;
        message?: string;
      }>((resolve) => {
        if (socketRef.current?.connected) {
          socketRef.current.emit(
            "event:media",
            { roomId, type, metadata },
            (response: unknown) => {
              resolve(
                response as {
                  success: boolean;
                  eventId?: string;
                  error?: string;
                  message?: string;
                }
              );
            }
          );
        } else {
          resolve({
            success: false,
            error: "NOT_CONNECTED",
            message: "Not connected to signaling server",
          });
        }
      });
    },
    []
  );

  const sendMessage = useCallback((roomId: string, content: string) => {
    return new Promise<{
      success: boolean;
      messageId?: string;
      error?: string;
      message?: string;
    }>((resolve) => {
      if (socketRef.current?.connected) {
        socketRef.current.emit(
          "message:new",
          { roomId, content },
          (response: unknown) => {
            resolve(
              response as {
                success: boolean;
                messageId?: string;
                error?: string;
                message?: string;
              }
            );
          }
        );
      } else {
        resolve({
          success: false,
          error: "NOT_CONNECTED",
          message: "Not connected to signaling server",
        });
      }
    });
  }, []);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      currentRoomRef.current = null;
      currentRoomIdRef.current = null;
    }
  }, []);

  const getCurrentRoomId = useCallback(() => {
    return currentRoomIdRef.current;
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    joinRoom,
    leaveRoom,
    sendOffer,
    sendAnswer,
    sendIceCandidate,
    sendMediaEvent,
    sendMessage,
    disconnect,
    getCurrentRoomId,
  };
}

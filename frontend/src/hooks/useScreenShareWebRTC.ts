import { useCallback } from "react";

export interface PeerConnectionData {
  userId: string;
  peerConnection: RTCPeerConnection;
  remoteStream?: MediaStream;
}

export interface UseScreenShareWebRTCOptions {
  peers: Map<string, PeerConnectionData>;
  onError?: (error: Error) => void;
}

export interface UseScreenShareWebRTCReturn {
  replaceTracksWithScreenShare: (screenStream: MediaStream) => Promise<void>;
  replaceTracksWithCamera: (cameraStream: MediaStream) => Promise<void>;
}

/**
 * Hook to manage screen sharing in WebRTC peer connections
 * Handles replacing video tracks between camera and screen
 */
export function useScreenShareWebRTC(
  options: UseScreenShareWebRTCOptions
): UseScreenShareWebRTCReturn {
  const { peers, onError } = options;

  const replaceTracksWithScreenShare = useCallback(
    async (screenStream: MediaStream): Promise<void> => {
      const screenVideoTrack = screenStream.getVideoTracks()[0];
      if (!screenVideoTrack) {
        throw new Error("No video track in screen stream");
      }

      const errors: Error[] = [];

      for (const [userId, peerData] of peers.entries()) {
        try {
          const senders = peerData.peerConnection.getSenders();
          const videoSender = senders.find((s) => s.track?.kind === "video");

          if (videoSender) {
            await videoSender.replaceTrack(screenVideoTrack);
          } else {
            peerData.peerConnection.addTrack(screenVideoTrack, screenStream);
          }
        } catch (err) {
          const error =
            err instanceof Error ? err : new Error("Failed to replace track");
          console.error(`Error replacing track for ${userId}:`, error);
          errors.push(error);
        }
      }

      if (errors.length > 0) {
        const error = new Error(
          `Failed to replace tracks for ${errors.length} peer(s): ${errors[0].message}`
        );
        onError?.(error);
        throw error;
      }
    },
    [peers, onError]
  );

  const replaceTracksWithCamera = useCallback(
    async (cameraStream: MediaStream): Promise<void> => {
      const cameraVideoTrack = cameraStream.getVideoTracks()[0];
      if (!cameraVideoTrack) {
        throw new Error("No video track in camera stream");
      }

      const errors: Error[] = [];

      for (const [userId, peerData] of peers.entries()) {
        try {
          const senders = peerData.peerConnection.getSenders();
          const videoSender = senders.find((s) => s.track?.kind === "video");

          if (videoSender) {
            await videoSender.replaceTrack(cameraVideoTrack);
          } else {
            peerData.peerConnection.addTrack(cameraVideoTrack, cameraStream);
          }
        } catch (err) {
          const error =
            err instanceof Error ? err : new Error("Failed to replace track");
          console.error(`Error replacing track for ${userId}:`, error);
          errors.push(error);
        }
      }

      if (errors.length > 0) {
        const error = new Error(
          `Failed to replace tracks for ${errors.length} peer(s): ${errors[0].message}`
        );
        onError?.(error);
        throw error;
      }
    },
    [peers, onError]
  );

  return {
    replaceTracksWithScreenShare,
    replaceTracksWithCamera,
  };
}

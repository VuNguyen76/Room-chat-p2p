import { useState, useCallback, useRef, useEffect } from "react";
import { WEBRTC_CONFIG } from "@/utils/constants";

export interface PeerConnectionData {
  userId: string;
  peerConnection: RTCPeerConnection;
  remoteStream?: MediaStream;
}

export interface UseWebRTCOptions {
  localStream?: MediaStream | null;
  onRemoteStream?: (userId: string, stream: MediaStream) => void;
  onPeerDisconnected?: (userId: string) => void;
  onIceCandidate?: (userId: string, candidate: RTCIceCandidateInit) => void;
}

export interface UseWebRTCReturn {
  peers: Map<string, PeerConnectionData>;
  createPeerConnection: (
    userId: string,
    stream?: MediaStream
  ) => RTCPeerConnection;
  removePeerConnection: (userId: string) => void;
  createOffer: (userId: string) => Promise<RTCSessionDescriptionInit | null>;
  createAnswer: (
    userId: string,
    offer: RTCSessionDescriptionInit
  ) => Promise<RTCSessionDescriptionInit | null>;
  setRemoteDescription: (
    userId: string,
    description: RTCSessionDescriptionInit
  ) => Promise<void>;
  addIceCandidate: (
    userId: string,
    candidate: RTCIceCandidateInit
  ) => Promise<void>;
  cleanup: () => void;
}

export function useWebRTC(options: UseWebRTCOptions = {}): UseWebRTCReturn {
  const { localStream, onRemoteStream, onPeerDisconnected, onIceCandidate } =
    options;
  const [peers] = useState<Map<string, PeerConnectionData>>(new Map());
  const peersRef = useRef(peers);

  // Update ref when peers change
  useEffect(() => {
    peersRef.current = peers;
  }, [peers]);

  const removePeerConnection = useCallback((userId: string) => {
    const peerData = peersRef.current.get(userId);
    if (peerData) {
      peerData.peerConnection.close();
      peersRef.current.delete(userId);
    }
  }, []);

  const createPeerConnection = useCallback(
    (userId: string, stream?: MediaStream): RTCPeerConnection => {
      // Remove existing peer connection if any
      removePeerConnection(userId);

      const peerConnection = new RTCPeerConnection(WEBRTC_CONFIG);

      const streamToUse = stream || localStream;

      if (streamToUse) {
        streamToUse.getTracks().forEach((track) => {
          peerConnection.addTrack(track, streamToUse);
        });
      }

      peerConnection.ontrack = (event) => {
        const [remoteStream] = event.streams;
        if (remoteStream) {
          const peerData = peersRef.current.get(userId);
          if (peerData) {
            peerData.remoteStream = remoteStream;
            onRemoteStream?.(userId, remoteStream);
          }
        }
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          onIceCandidate?.(userId, event.candidate);
        }
      };

      peerConnection.onconnectionstatechange = () => {
        if (
          peerConnection.connectionState === "disconnected" ||
          peerConnection.connectionState === "failed" ||
          peerConnection.connectionState === "closed"
        ) {
          onPeerDisconnected?.(userId);
          removePeerConnection(userId);
        }
      };

      // Store peer connection
      const peerData: PeerConnectionData = {
        userId,
        peerConnection,
      };

      peersRef.current.set(userId, peerData);

      return peerConnection;
    },
    [
      removePeerConnection,
      localStream,
      onRemoteStream,
      onIceCandidate,
      onPeerDisconnected,
    ]
  );

  const createOffer = useCallback(
    async (userId: string): Promise<RTCSessionDescriptionInit | null> => {
      const peerData = peersRef.current.get(userId);
      if (!peerData) {
        console.error("No peer connection found for user:", userId);
        return null;
      }

      try {
        const offer = await peerData.peerConnection.createOffer();
        await peerData.peerConnection.setLocalDescription(offer);
        return offer;
      } catch (error) {
        console.error("Error creating offer:", error);
        return null;
      }
    },
    []
  );

  const createAnswer = useCallback(
    async (
      userId: string,
      offer: RTCSessionDescriptionInit
    ): Promise<RTCSessionDescriptionInit | null> => {
      const peerData = peersRef.current.get(userId);
      if (!peerData) {
        console.error("No peer connection found for user:", userId);
        return null;
      }

      try {
        await peerData.peerConnection.setRemoteDescription(offer);
        const answer = await peerData.peerConnection.createAnswer();
        await peerData.peerConnection.setLocalDescription(answer);
        return answer;
      } catch (error) {
        console.error("Error creating answer:", error);
        return null;
      }
    },
    []
  );

  const setRemoteDescription = useCallback(
    async (
      userId: string,
      description: RTCSessionDescriptionInit
    ): Promise<void> => {
      const peerData = peersRef.current.get(userId);
      if (!peerData) {
        console.error("No peer connection found for user:", userId);
        return;
      }

      try {
        await peerData.peerConnection.setRemoteDescription(description);
      } catch (error) {
        console.error("Error setting remote description:", error);
      }
    },
    []
  );

  const addIceCandidate = useCallback(
    async (userId: string, candidate: RTCIceCandidateInit): Promise<void> => {
      const peerData = peersRef.current.get(userId);
      if (!peerData) {
        console.error("No peer connection found for user:", userId);
        return;
      }

      try {
        await peerData.peerConnection.addIceCandidate(candidate);
      } catch (error) {
        console.error("Error adding ICE candidate:", error);
      }
    },
    []
  );

  const cleanup = useCallback(() => {
    peersRef.current.forEach((peerData) => {
      peerData.peerConnection.close();
    });
    peersRef.current.clear();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    peers: peersRef.current,
    createPeerConnection,
    removePeerConnection,
    createOffer,
    createAnswer,
    setRemoteDescription,
    addIceCandidate,
    cleanup,
  };
}

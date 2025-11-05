import { useState, useCallback, useRef } from "react";

export interface UseScreenShareOptions {
  onScreenStreamStart?: (stream: MediaStream) => void;
  onScreenStreamStop?: () => void;
  onError?: (error: Error) => void;
}

export interface UseScreenShareReturn {
  isScreenSharing: boolean;
  screenStream: MediaStream | null;
  isLoading: boolean;
  error: string | null;
  startScreenShare: () => Promise<MediaStream | null>;
  stopScreenShare: () => Promise<void>;
}

export function useScreenShare(
  options: UseScreenShareOptions = {}
): UseScreenShareReturn {
  const { onScreenStreamStart, onScreenStreamStop, onError } = options;

  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const screenStreamRef = useRef<MediaStream | null>(null);

  const startScreenShare =
    useCallback(async (): Promise<MediaStream | null> => {
      try {
        setIsLoading(true);
        setError(null);

        // Check if browser supports getDisplayMedia
        if (!navigator.mediaDevices?.getDisplayMedia) {
          throw new Error("Screen sharing is not supported in your browser");
        }

        // Request screen capture
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: "always",
          } as MediaTrackConstraints,
          audio: false, // Don't capture audio from screen
        });

        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.onended = () => stopScreenShare();
        }

        screenStreamRef.current = stream;
        setScreenStream(stream);
        setIsScreenSharing(true);

        onScreenStreamStart?.(stream);

        return stream;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to start screen sharing";

        // Don't show error if user cancelled
        if (
          errorMsg.includes("NotAllowedError") ||
          errorMsg.includes("Permission denied")
        ) {
          /* empty */
        } else {
          setError(errorMsg);
          onError?.(new Error(errorMsg));
        }

        return null;
      } finally {
        setIsLoading(false);
      }
    }, [onScreenStreamStart, onError]);

  const stopScreenShare = useCallback(async (): Promise<void> => {
    try {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
        setScreenStream(null);
        setIsScreenSharing(false);
        onScreenStreamStop?.();
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Failed to stop screen sharing";
      setError(errorMsg);
      onError?.(new Error(errorMsg));
    }
  }, [onScreenStreamStop, onError]);

  return {
    isScreenSharing,
    screenStream,
    isLoading,
    error,
    startScreenShare,
    stopScreenShare,
  };
}

import { useState, useEffect, useCallback, useRef } from "react";

export interface UseMediaStreamOptions {
  video?: boolean | MediaTrackConstraints;
  audio?: boolean | MediaTrackConstraints;
  videoDeviceId?: string;
  audioDeviceId?: string;
}

export interface UseMediaStreamReturn {
  stream: MediaStream | null;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isLoading: boolean;
  error: string | null;
  startStream: (options?: UseMediaStreamOptions) => Promise<MediaStream | null>;
  stopStream: () => void;
  toggleVideo: () => Promise<void>;
  toggleAudio: () => Promise<void>;
  switchVideoDevice: (deviceId: string) => Promise<void>;
  switchAudioDevice: (deviceId: string) => Promise<void>;
}

export function useMediaStream(
  initialOptions?: UseMediaStreamOptions
): UseMediaStreamReturn {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Use ref to avoid dependency cycles
  const streamRef = useRef<MediaStream | null>(null);

  const currentOptionsRef = useRef<UseMediaStreamOptions>(
    initialOptions || {
      video: true,
      audio: true,
    }
  );

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      setStream(null);
      streamRef.current = null;
    }
  }, []); // Remove stream dependency

  const startStream = useCallback(
    async (options?: UseMediaStreamOptions): Promise<MediaStream | null> => {
      try {
        setIsLoading(true);
        setError(null);

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          setStream(null);
          streamRef.current = null;
        }

        const streamOptions = options || currentOptionsRef.current;

        const constraints: MediaStreamConstraints = {
          video: streamOptions.video
            ? {
                ...(typeof streamOptions.video === "object"
                  ? streamOptions.video
                  : {}),
                ...(streamOptions.videoDeviceId
                  ? { deviceId: { exact: streamOptions.videoDeviceId } }
                  : {}),
              }
            : false,
          audio: streamOptions.audio
            ? {
                ...(typeof streamOptions.audio === "object"
                  ? streamOptions.audio
                  : {}),
                ...(streamOptions.audioDeviceId
                  ? { deviceId: { exact: streamOptions.audioDeviceId } }
                  : {}),
              }
            : false,
        };

        const newStream = await navigator.mediaDevices.getUserMedia(
          constraints
        );

        const videoTrack = newStream.getVideoTracks()[0];
        const audioTrack = newStream.getAudioTracks()[0];

        if (videoTrack) {
          videoTrack.enabled = isVideoEnabled;
        }

        if (audioTrack) {
          audioTrack.enabled = isAudioEnabled;
        }

        setStream(newStream);
        streamRef.current = newStream;
        currentOptionsRef.current = streamOptions;

        return newStream;
      } catch (err) {
        console.error("Error starting media stream:", err);
        setError(
          err instanceof Error ? err.message : "Failed to start media stream"
        );
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [isVideoEnabled, isAudioEnabled]
  );

  const toggleVideo = useCallback(async () => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const newEnabled = !isVideoEnabled;
        videoTrack.enabled = newEnabled;
        setIsVideoEnabled(newEnabled);
      }
    }
  }, [stream, isVideoEnabled]);

  const toggleAudio = useCallback(async () => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        const newEnabled = !isAudioEnabled;
        audioTrack.enabled = newEnabled;
        setIsAudioEnabled(newEnabled);
      }
    }
  }, [stream, isAudioEnabled]);

  const switchVideoDevice = useCallback(
    async (deviceId: string) => {
      const newOptions = {
        ...currentOptionsRef.current,
        videoDeviceId: deviceId,
      };
      await startStream(newOptions);
    },
    [startStream]
  );

  const switchAudioDevice = useCallback(
    async (deviceId: string) => {
      const newOptions = {
        ...currentOptionsRef.current,
        audioDeviceId: deviceId,
      };
      await startStream(newOptions);
    },
    [startStream]
  );

  useEffect(() => {
    streamRef.current = stream;
  }, [stream]);

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return {
    stream,
    isVideoEnabled,
    isAudioEnabled,
    isLoading,
    error,
    startStream,
    stopStream,
    toggleVideo,
    toggleAudio,
    switchVideoDevice,
    switchAudioDevice,
  };
}

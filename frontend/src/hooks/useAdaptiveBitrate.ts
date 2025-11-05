import { useEffect, useRef } from "react";
import { getQualityPreset } from "@/utils/constants";

interface PeerConnectionData {
  userId: string;
  peerConnection: RTCPeerConnection;
  remoteStream?: MediaStream;
}

export function useAdaptiveBitrate(
  peers: Map<string, PeerConnectionData>,
  participantCount: number
) {
  const lastQualityRef = useRef<string>("");

  useEffect(() => {
    const preset = getQualityPreset(participantCount);
    const qualityKey = `${participantCount}-${preset.maxBitrate}`;

    // Only update if quality changed
    if (lastQualityRef.current === qualityKey) {
      return;
    }

    lastQualityRef.current = qualityKey;

    // Apply bitrate limits to all peer connections
    peers.forEach((peerData) => {
      const senders = peerData.peerConnection.getSenders();

      senders.forEach(async (sender) => {
        if (sender.track?.kind === "video") {
          try {
            const parameters = sender.getParameters();

            if (!parameters.encodings) {
              parameters.encodings = [{}];
            }

            // Set max bitrate
            parameters.encodings[0].maxBitrate = preset.maxBitrate;

            // Set degradation preference
            // 'maintain-framerate' = reduce resolution when bandwidth is low
            // 'maintain-resolution' = reduce framerate when bandwidth is low
            (
              parameters.encodings[0] as RTCRtpEncodingParameters & {
                degradationPreference?: string;
              }
            ).degradationPreference = "maintain-framerate";

            // Set scale resolution down by factor (1 = no scaling, 2 = half resolution)
            if (participantCount > 4) {
              parameters.encodings[0].scaleResolutionDownBy = 2;
            } else if (participantCount > 2) {
              parameters.encodings[0].scaleResolutionDownBy = 1.5;
            }

            await sender.setParameters(parameters);
          } catch (error) {
            console.error("Failed to set bitrate parameters:", error);
          }
        }
      });
    });
  }, [peers, participantCount]);
}

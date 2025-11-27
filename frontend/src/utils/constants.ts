// API Configuration
// If VITE_API_URL is empty, use relative path (same origin)
export const API_BASE_URL = import.meta.env.VITE_API_URL || "";
// If VITE_SOCKET_URL is empty, use window.location.origin
export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || window.location.origin;

// WebRTC Configuration - Optimized for cross-network connectivity
export const ICE_SERVERS: RTCIceServer[] = [
  // Google STUN servers
  { urls: "stun:stun.l.google.com:19302" },
  { urls: "stun:stun1.l.google.com:19302" },

  // Twilio TURN servers (most reliable)
  {
    urls: "turn:global.turn.twilio.com:3478?transport=udp",
    username:
      "f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d",
    credential: "w1uxM55V9yVoqyVFjt+mxDBV0F87AUCemaYVQGxsPLw=",
  },
  {
    urls: "turn:global.turn.twilio.com:3478?transport=tcp",
    username:
      "f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d",
    credential: "w1uxM55V9yVoqyVFjt+mxDBV0F87AUCemaYVQGxsPLw=",
  },
  {
    urls: "turn:global.turn.twilio.com:443?transport=tcp",
    username:
      "f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334fcc1be9c27212d",
    credential: "w1uxM55V9yVoqyVFjt+mxDBV0F87AUCemaYVQGxsPLw=",
  },
];

export const WEBRTC_CONFIG: RTCConfiguration = {
  iceServers: ICE_SERVERS,
  iceCandidatePoolSize: 10,
  bundlePolicy: "max-bundle",
  rtcpMuxPolicy: "require",
  iceTransportPolicy: "all",
};

// Quality presets based on participant count
export const QUALITY_PRESETS = {
  HIGH: {
    video: {
      width: { ideal: 1280, max: 1920 },
      height: { ideal: 720, max: 1080 },
      frameRate: { ideal: 30, max: 30 },
    },
    maxBitrate: 2500000,
  },
  MEDIUM: {
    video: {
      width: { ideal: 640, max: 960 },
      height: { ideal: 480, max: 720 },
      frameRate: { ideal: 24, max: 24 },
    },
    maxBitrate: 1000000,
  },
  LOW: {
    video: {
      width: { ideal: 480, max: 640 },
      height: { ideal: 360, max: 480 },
      frameRate: { ideal: 15, max: 20 },
    },
    maxBitrate: 500000,
  },
};

export function getQualityPreset(participantCount: number) {
  if (participantCount <= 2) return QUALITY_PRESETS.HIGH;
  if (participantCount <= 4) return QUALITY_PRESETS.MEDIUM;
  return QUALITY_PRESETS.LOW;
}

export const MEDIA_CONSTRAINTS = {
  video: {
    width: { min: 640, ideal: 1280, max: 1920 },
    height: { min: 480, ideal: 720, max: 1080 },
    frameRate: { min: 15, ideal: 30, max: 60 },
  },
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
};

export const MAX_PARTICIPANTS = 6;
export const MIN_PARTICIPANTS = 2;

export const VIDEO_CONSTRAINTS = {
  width: { ideal: 1280, max: 1920 },
  height: { ideal: 720, max: 1080 },
  frameRate: { ideal: 30, max: 60 },
};

export const AUDIO_CONSTRAINTS = {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
};

export const TOAST_DURATION = 3000;
export const RECONNECT_ATTEMPTS = 3;
export const RECONNECT_DELAY = 1000;

export const STORAGE_KEYS = {
  USER_PREFERENCES: "video-chat-user-prefs",
  LAST_ROOM: "video-chat-last-room",
  MEDIA_SETTINGS: "video-chat-media-settings",
} as const;

export const SOCKET_EVENTS = {
  JOIN_ROOM: "join-room",
  LEAVE_ROOM: "leave-room",
  OFFER: "offer",
  ANSWER: "answer",
  ICE_CANDIDATE: "ice-candidate",
  MESSAGE: "message",
  ROOM_JOINED: "room-joined",
  USER_JOINED: "user-joined",
  USER_LEFT: "user-left",
  OFFER_RECEIVED: "offer",
  ANSWER_RECEIVED: "answer",
  ICE_CANDIDATE_RECEIVED: "ice-candidate",
  MESSAGE_RECEIVED: "message",
  ERROR: "error",
} as const;

export const ERROR_MESSAGES = {
  ROOM_NOT_FOUND: "Room not found",
  ROOM_FULL: "Room is full",
  CONNECTION_FAILED: "Failed to connect",
  MEDIA_ACCESS_DENIED: "Camera/microphone access denied",
  NETWORK_ERROR: "Network error occurred",
  UNKNOWN_ERROR: "An unknown error occurred",
} as const;

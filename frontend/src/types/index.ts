// User types
export interface User {
  id: string
  displayName: string
  avatarUrl?: string
}

// Room types
export interface Room {
  id: string
  title?: string
  maxParticipants: number
  participants: User[]
  createdAt: string
  isActive: boolean
}

// Message types
export interface Message {
  id: string
  roomId: string
  userId: string
  userName: string
  content: string
  timestamp: string
  type: 'text' | 'system'
}

// WebRTC types
export interface PeerConnection {
  userId: string
  peer: any // SimplePeer instance
  stream?: MediaStream
}

export interface Participant {
  id: string
  name: string
  isVideoEnabled: boolean
  isAudioEnabled: boolean
  isLocal?: boolean
  stream?: MediaStream
  peerConnection?: RTCPeerConnection
}

export interface WebRTCConfig {
  iceServers: RTCIceServer[]
}

export interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate' | 'join-room' | 'leave-room'
  roomId: string
  fromUserId: string
  toUserId?: string
  data?: any
}

export interface MediaSettings {
  videoDeviceId?: string
  audioDeviceId?: string
  videoEnabled: boolean
  audioEnabled: boolean
}

// Socket event types
export interface SocketEvents {
  'join-room': (data: { roomId: string; user: User }) => void
  'leave-room': (data: { roomId: string; userId: string }) => void
  'offer': (data: { to: string; offer: RTCSessionDescriptionInit }) => void
  'answer': (data: { to: string; answer: RTCSessionDescriptionInit }) => void
  'ice-candidate': (data: { to: string; candidate: RTCIceCandidateInit }) => void
  'message': (data: { roomId: string; message: Omit<Message, 'id' | 'timestamp'> }) => void
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Media device types
export interface MediaDevices {
  videoDevices: MediaDeviceInfo[]
  audioDevices: MediaDeviceInfo[]
  selectedVideoDevice?: string
  selectedAudioDevice?: string
}

// App state types
export interface AppState {
  isLoading: boolean
  error: string | null
  user: User | null
  currentRoom: Room | null
}

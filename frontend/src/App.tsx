import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { VideoGridNew } from '@/components/video'
import { Header, BottomControls, MainLayout } from '@/components/layout'
import { ReconnectionUI, RateLimitUI } from '@/components/common'
import { ChatPanel } from '@/components/chat/ChatPanel'

import { useMediaStream } from '@/hooks/useMediaStream'
import { useMediaDevices } from '@/hooks/useMediaDevices'
import { useSignaling } from '@/hooks/useSignaling'
import { useWebRTC } from '@/hooks/useWebRTC'
import { useAdaptiveBitrate } from '@/hooks/useAdaptiveBitrate'
import { useScreenShare } from '@/hooks/useScreenShare'
import { useScreenShareWebRTC } from '@/hooks/useScreenShareWebRTC'
import { useReconnection } from '@/hooks/useReconnection'
import { useUserStore } from './stores/userStore'
import { useMessageStore } from './stores/messageStore'
import apiClient from '@/lib/api'

function App() {
  const [isInRoom, setIsInRoom] = useState(false)
  const [roomId, setRoomId] = useState('')
  const [userName, setUserName] = useState('')

  const [roomIdError, setRoomIdError] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [rateLimitError, setRateLimitError] = useState<{ retryAfter: number } | null>(null)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)

  // Real participants state
  const [participants, setParticipants] = useState<Array<{
    socketId: string
    sessionId: string
    userSnapshot: { displayName: string; avatarUrl?: string }
    mediaState: { video: boolean; audio: boolean; screen: boolean }
    stream?: MediaStream
    isLocal?: boolean
  }>>([])

  // Stores
  const { setUser } = useUserStore()
  const { addSystemMessage } = useMessageStore()

  // Media hooks
  const mediaDevices = useMediaDevices()
  const mediaStream = useMediaStream()

  // Keep a ref to the current stream to avoid stale closures
  const localStreamRef = useRef<MediaStream | null>(null)

  // Track last sent media state to avoid infinite loops
  const lastSentMediaStateRef = useRef({ video: true, audio: true })

  // Screen sharing hooks
  const wasVideoEnabledRef = useRef(true)

  const screenShare = useScreenShare({
    onScreenStreamStop: async () => {
      if (roomId) {
        signaling.sendMediaEvent(roomId, 'screen-off')
      }
      if (mediaStream.stream) {
        await screenShareWebRTC.replaceTracksWithCamera(mediaStream.stream)
        const videoTrack = mediaStream.stream.getVideoTracks()[0]
        if (videoTrack && wasVideoEnabledRef.current) {
          videoTrack.enabled = true
        }
      }
      setParticipants(prev => prev.map(p =>
        p.isLocal ? { ...p, mediaState: { ...p.mediaState, screen: false } } : p
      ))
    },
    onError: (error) => {
      console.error('Screen share error:', error)
      setError(error.message)
    }
  })

  const reconnection = useReconnection({
    maxRetries: 5,
    initialDelayMs: 1000,
    maxDelayMs: 30000,
    onReconnected: () => setError(''),
    onReconnectionFailed: (error) => setError(`Reconnection failed: ${error.message}`)
  })

  useEffect(() => {
    localStreamRef.current = mediaStream.stream
  }, [mediaStream.stream])

  // WebRTC and Signaling hooks
  const webRTC = useWebRTC({
    localStream: mediaStream.stream,
    onRemoteStream: (socketId, stream) => {
      setParticipants(prev => prev.map(p =>
        p.socketId === socketId ? { ...p, stream } : p
      ))
    },
    onPeerDisconnected: (socketId) => {
      setParticipants(prev => prev.filter(p => p.socketId !== socketId))
    },
    onIceCandidate: (socketId, candidate) => {
      signaling.sendIceCandidate(socketId, candidate)
    }
  })

  // Screen sharing WebRTC hook
  const screenShareWebRTC = useScreenShareWebRTC({
    peers: webRTC.peers,
    onError: (error) => {
      console.error('Screen share WebRTC error:', error)
      setError(error.message)
    }
  })

  const signaling = useSignaling({
    onUserJoined: async (socketId, sessionId, userSnapshot, mediaState) => {
      setParticipants(prev => [...prev, { socketId, sessionId, userSnapshot, mediaState }])
      webRTC.createPeerConnection(socketId, localStreamRef.current || undefined)
    },
    onUserLeft: (socketId) => {
      setParticipants(prev => prev.filter(p => p.socketId !== socketId))
      webRTC.removePeerConnection(socketId)
    },
    onOffer: async (fromSocketId, offer) => {
      if (!webRTC.peers.has(fromSocketId)) {
        webRTC.createPeerConnection(fromSocketId, localStreamRef.current || undefined)
      }

      const answer = await webRTC.createAnswer(fromSocketId, offer)
      if (answer) {
        signaling.sendAnswer(fromSocketId, answer)
      }
    },
    onAnswer: async (fromSocketId, answer) => {
      await webRTC.setRemoteDescription(fromSocketId, answer)
    },
    onIceCandidate: async (fromSocketId, candidate) => {
      await webRTC.addIceCandidate(fromSocketId, candidate)
    },
    onMediaEvent: (eventType, _userSnapshot, sessionRef) => {
      setParticipants(prev => prev.map(p => {
        if (p.sessionId === sessionRef) {
          const newMediaState = { ...p.mediaState }
          switch (eventType) {
            case 'mute':
              newMediaState.audio = false
              break
            case 'unmute':
              newMediaState.audio = true
              break
            case 'video-off':
              newMediaState.video = false
              break
            case 'video-on':
              newMediaState.video = true
              break
            case 'screen-on':
              newMediaState.screen = true
              break
            case 'screen-off':
              newMediaState.screen = false
              break
          }
          return { ...p, mediaState: newMediaState }
        }
        return p
      }))
    },
    onError: (error, message, details) => {
      console.error('Signaling error:', { error, message, details })
      setError(message)
    }
  })

  // Convert backend participants to VideoGrid format
  const convertParticipantsForVideoGrid = (backendParticipants: typeof participants) => {
    return backendParticipants.map(p => ({
      id: p.socketId,
      name: p.userSnapshot.displayName,
      avatarUrl: p.userSnapshot.avatarUrl,
      isVideoEnabled: p.mediaState.video,
      isAudioEnabled: p.mediaState.audio,
      isScreenSharing: p.mediaState.screen,
      isLocal: p.isLocal || false,
      stream: p.stream
    }))
  }

  // Update local participant stream when mediaStream changes
  useEffect(() => {
    if (isInRoom && mediaStream.stream) {
      setParticipants(prev => prev.map(p =>
        p.isLocal ? {
          ...p,
          stream: mediaStream.stream || undefined
        } : p
      ))

      webRTC.peers.forEach((peerData) => {
        const senders = peerData.peerConnection.getSenders()

        // Update video track
        const videoTrack = mediaStream.stream?.getVideoTracks()[0]
        const videoSender = senders.find(s => s.track?.kind === 'video')
        if (videoSender && videoTrack) {
          videoSender.replaceTrack(videoTrack).catch(console.error)
        } else if (!videoSender && videoTrack) {
          peerData.peerConnection.addTrack(videoTrack, mediaStream.stream!)
        }

        const audioTrack = mediaStream.stream?.getAudioTracks()[0]
        const audioSender = senders.find(s => s.track?.kind === 'audio')
        if (audioSender && audioTrack) {
          audioSender.replaceTrack(audioTrack).catch(console.error)
        } else if (!audioSender && audioTrack) {
          peerData.peerConnection.addTrack(audioTrack, mediaStream.stream!)
        }
      })
    }
  }, [mediaStream.stream, isInRoom, webRTC.peers])

  // Apply adaptive bitrate based on participant count
  useAdaptiveBitrate(webRTC.peers, participants.length)

  // Update local participant media state when video/audio is toggled
  useEffect(() => {
    if (isInRoom && roomId) {
      // Check if state actually changed from last sent state
      const videoChanged = lastSentMediaStateRef.current.video !== mediaStream.isVideoEnabled
      const audioChanged = lastSentMediaStateRef.current.audio !== mediaStream.isAudioEnabled

      if (videoChanged || audioChanged) {
        lastSentMediaStateRef.current = {
          video: mediaStream.isVideoEnabled,
          audio: mediaStream.isAudioEnabled
        }

        setParticipants(prev => prev.map(p => {
          if (p.isLocal) {
            return {
              ...p,
              mediaState: {
                video: mediaStream.isVideoEnabled,
                audio: mediaStream.isAudioEnabled,
                screen: false
              }
            }
          }
          return p
        }))

        if (videoChanged) {
          signaling.sendMediaEvent(roomId, mediaStream.isVideoEnabled ? 'video-on' : 'video-off')
        }
        if (audioChanged) {
          signaling.sendMediaEvent(roomId, mediaStream.isAudioEnabled ? 'unmute' : 'mute')
        }
      }
    }
  }, [isInRoom, mediaStream.isVideoEnabled, mediaStream.isAudioEnabled, roomId, signaling])

  const handleCreateRoom = async () => {
    if (userName.trim()) {
      setLoading(true)
      setError('')

      try {
        // Create room via API
        const roomResponse = await apiClient.createRoom({
          title: `${userName}'s Room`,
          maxParticipants: 6,
          createdBy: {
            displayName: userName.trim()
          }
        })

        setRoomId(roomResponse.roomId)

        const localStream = await mediaStream.startStream({
          video: true,
          audio: true,
          videoDeviceId: mediaDevices.selectedVideoDevice,
          audioDeviceId: mediaDevices.selectedAudioDevice
        })

        if (!localStream) {
          setError('Failed to start camera/microphone')
          setLoading(false)
          return
        }

        // Join room via signaling
        const joinResponse = await signaling.joinRoom(
          roomResponse.roomId,
          userName.trim(),
          undefined, // avatarUrl
          { userAgent: navigator.userAgent } // deviceInfo
        )

        if (joinResponse.success) {
          // Setup user in store
          setUser({
            id: joinResponse.self.sessionId,
            displayName: userName.trim()
          })

          addSystemMessage(`Welcome to ${roomResponse.title}!`, roomResponse.roomId)

          setParticipants([{
            socketId: joinResponse.self.socketId,
            sessionId: joinResponse.self.sessionId,
            userSnapshot: { displayName: userName.trim() },
            mediaState: { video: mediaStream.isVideoEnabled, audio: mediaStream.isAudioEnabled, screen: false },
            stream: localStream,
            isLocal: true
          }])

          setIsInRoom(true)
        } else {
          setError(joinResponse.message || 'Failed to join room')
        }
      } catch (err: unknown) {
        console.error('Error creating room:', err)
        const errorMessage = err instanceof Error ? err.message : 'Failed to create room'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleJoinRoom = async () => {
    const trimmedRoomId = roomId.trim()
    const trimmedUserName = userName.trim()

    setRoomIdError('')
    setError('')

    if (!trimmedUserName) {
      setError('Name is required')
      return
    }

    if (!trimmedRoomId) {
      setRoomIdError('Room ID is required')
      return
    }



    setLoading(true)

    try {
      const localStream = await mediaStream.startStream({
        video: true,
        audio: true,
        videoDeviceId: mediaDevices.selectedVideoDevice,
        audioDeviceId: mediaDevices.selectedAudioDevice
      })

      if (!localStream) {
        setError('Failed to start camera/microphone')
        setLoading(false)
        return
      }

      // Join room via signaling (backend will validate room exists)
      const joinResponse = await signaling.joinRoom(
        trimmedRoomId,
        trimmedUserName,
        undefined, // avatarUrl
        { userAgent: navigator.userAgent } // deviceInfo
      )

      if (joinResponse.success) {
        // Set room ID
        setRoomId(trimmedRoomId)

        // Setup user in store
        setUser({
          id: joinResponse.self.sessionId,
          displayName: trimmedUserName
        })

        addSystemMessage(`${trimmedUserName} joined the room`, trimmedRoomId)

        setParticipants([{
          socketId: joinResponse.self.socketId,
          sessionId: joinResponse.self.sessionId,
          userSnapshot: { displayName: trimmedUserName },
          mediaState: { video: true, audio: true, screen: false },
          stream: localStream,
          isLocal: true
        }])

        if (joinResponse.peers && joinResponse.peers.length > 0) {
          const peerParticipants = joinResponse.peers.map((peer: {
            socketId: string
            sessionId: string
            userSnapshot: { displayName: string; avatarUrl?: string }
            mediaState: { video: boolean; audio: boolean; screen: boolean }
          }) => {
            return {
              socketId: peer.socketId,
              sessionId: peer.sessionId,
              userSnapshot: peer.userSnapshot,
              mediaState: peer.mediaState
            }
          })

          setParticipants(prev => [...prev, ...peerParticipants])

          for (const peer of joinResponse.peers) {
            webRTC.createPeerConnection(peer.socketId, localStream)
            const offer = await webRTC.createOffer(peer.socketId)
            if (offer) {
              signaling.sendOffer(peer.socketId, offer)
            } else {
              console.error('Failed to create offer for:', peer.socketId)
            }
          }
        }

        setIsInRoom(true)
      } else {
        if (joinResponse.error === 'ROOM_NOT_FOUND') {
          setRoomIdError('Room not found. Please check the Room ID.')
        } else if (joinResponse.error === 'ROOM_FULL') {
          setError('Room is full. Please try another room.')
        } else if (joinResponse.error === 'ROOM_LOCKED') {
          setError('Room is locked.')
        } else {
          setError(joinResponse.message || 'Failed to join room')
        }
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 429) {
        const retryAfter = (err as { retryAfter?: number }).retryAfter || 60
        setRateLimitError({ retryAfter })
        setError('')
      } else {
        const errorMsg = err instanceof Error ? err.message : 'Failed to join room'
        setError(errorMsg)
      }
    } finally {
      setLoading(false)
    }
  }





  // Room Selection Form
  if (!isInRoom) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">Video Chat</h1>
            <p className="text-gray-500">Simple and clean video conferencing</p>
          </div>

          {/* Main Card */}
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardContent className="p-6 space-y-5">
              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                <Input
                  placeholder="Enter your name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-white border-gray-300"
                />
              </div>

              {/* Create Room */}
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-medium text-gray-900">Create New Room</h3>
                <p className="text-xs text-gray-500">Start a new video conference</p>
                <Button
                  onClick={handleCreateRoom}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                  disabled={!userName.trim() || loading}
                >
                  {loading ? 'Creating...' : 'Create Room'}
                </Button>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-sm text-gray-500">or</span>
                </div>
              </div>

              {/* Join Room */}
              <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="font-medium text-gray-900">Join Existing Room</h3>
                <p className="text-xs text-gray-500">Enter room ID to join</p>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Room ID</label>
                  <Input
                    placeholder="Enter room ID"
                    value={roomId}
                    onChange={(e) => {
                      setRoomId(e.target.value.trim())
                      setRoomIdError('')
                    }}
                    className={roomIdError ? 'border-red-400' : 'bg-white border-gray-300'}
                  />
                  {roomIdError && (
                    <p className="text-xs text-red-500 mt-1">{roomIdError}</p>
                  )}
                </div>
                <Button
                  onClick={handleJoinRoom}
                  className="w-full bg-gray-700 hover:bg-gray-600 text-white"
                  disabled={!roomId.trim() || !userName.trim() || loading}
                >
                  {loading ? 'Joining...' : 'Join Room'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Card className="mt-4 border-gray-300 bg-gray-50">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-700">{error}</p>
              </CardContent>
            </Card>
          )}


        </div>
      </div>
    )
  }

  // Video Chat Room
  if (isInRoom) {
    return (
      <>
        <MainLayout
          header={
            <Header
              roomId={roomId}
              onSettingsClick={() => {
                // Settings panel
              }}
            />
          }
          content={
            <div className="flex-1 overflow-hidden">
              {participants.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-muted-foreground">Waiting for participants</p>
                    <p className="text-sm text-muted-foreground">Share the room ID to invite others</p>
                  </div>
                </div>
              ) : (
                <VideoGridNew participants={convertParticipantsForVideoGrid(participants)} />
              )}
            </div>
          }
          chatPanel={showChat ? (
            <ChatPanel
              roomId={roomId}
              participantCount={participants.length}
            />
          ) : undefined}
          bottomControls={
            <BottomControls
              isAudioEnabled={mediaStream.isAudioEnabled}
              isVideoEnabled={mediaStream.isVideoEnabled}
              isScreenSharing={screenShare.isScreenSharing}
              onToggleAudio={() => mediaStream.toggleAudio()}
              onToggleVideo={() => mediaStream.toggleVideo()}
              onToggleScreenShare={async () => {
                try {
                  if (screenShare.isScreenSharing) {
                    await screenShare.stopScreenShare()
                    setParticipants(prev => prev.map(p =>
                      p.isLocal ? { ...p, mediaState: { ...p.mediaState, screen: false } } : p
                    ))
                  } else {
                    const screenStream = await screenShare.startScreenShare()
                    if (screenStream) {
                      if (mediaStream.stream) {
                        const videoTrack = mediaStream.stream.getVideoTracks()[0]
                        if (videoTrack) {
                          wasVideoEnabledRef.current = videoTrack.enabled
                          videoTrack.enabled = false
                        }
                      }
                      await screenShareWebRTC.replaceTracksWithScreenShare(screenStream)
                      setParticipants(prev => prev.map(p =>
                        p.isLocal ? { ...p, mediaState: { ...p.mediaState, screen: true } } : p
                      ))
                      signaling.sendMediaEvent(roomId, 'screen-on')
                    }
                  }
                } catch (err) {
                  const errorMsg = err instanceof Error ? err.message : 'Screen share error'
                  setError(errorMsg)
                }
              }}
              onToggleChat={() => setShowChat(!showChat)}
              onLeaveCall={() => {
                setShowLeaveConfirm(true)
              }}
              showChat={showChat}
            />
          }
        />

        {/* Reconnection UI */}
        <ReconnectionUI
          isReconnecting={reconnection.isReconnecting}
          reconnectionAttempt={reconnection.reconnectionAttempt}
          nextRetryIn={reconnection.nextRetryIn}
          onCancel={() => {
            reconnection.cancelReconnection()
            setIsInRoom(false)
            setParticipants([])
          }}
        />

        {/* Rate Limit UI */}
        <RateLimitUI
          isVisible={!!rateLimitError}
          retryAfter={rateLimitError?.retryAfter || 60}
          onRetry={() => {
            setRateLimitError(null)
            handleJoinRoom()
          }}
          onDismiss={() => {
            setRateLimitError(null)
          }}
        />

        {/* Leave Confirmation Dialog */}
        <Dialog open={showLeaveConfirm} onOpenChange={setShowLeaveConfirm}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Leave Room?</DialogTitle>
              <DialogDescription>
                Are you sure you want to leave this room? You will disconnect from the video call.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowLeaveConfirm(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setShowLeaveConfirm(false)
                  setIsInRoom(false)
                  setParticipants([])
                  mediaStream.stopStream()
                  signaling.leaveRoom()
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Leave
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }
}

export default App

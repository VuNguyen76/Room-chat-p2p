import { useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Mic, MicOff, Video, VideoOff, Monitor } from 'lucide-react'


interface VideoTileProps {
  participant: {
    id: string
    name: string
    avatarUrl?: string
    isVideoEnabled: boolean
    isAudioEnabled: boolean
    isScreenSharing?: boolean
    isLocal?: boolean
    stream?: MediaStream
  }
  className?: string
  showControls?: boolean
  onClick?: () => void
}

export function VideoTile({
  participant,
  className = '',
  showControls = true,
  onClick
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && participant.stream) {
      videoRef.current.srcObject = participant.stream
    }
  }, [participant.stream])

  const hasVideo = participant.isVideoEnabled && participant.stream
  const isScreenShare = participant.isScreenSharing

  return (
    <div
      className={cn(
        "relative bg-muted rounded-lg overflow-hidden aspect-video group cursor-pointer",
        "border border-border hover:border-border/80 transition-colors",
        participant.isLocal && "ring-2 ring-primary",
        className
      )}
      onClick={onClick}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={participant.isLocal}
        className={`w-full h-full ${isScreenShare ? 'object-contain bg-black' : 'object-cover'} ${hasVideo ? 'block' : 'hidden'}`}
      />

      {!hasVideo && (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-muted">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-muted-foreground flex items-center justify-center text-background text-2xl font-medium mx-auto mb-2">
              {participant.name.charAt(0).toUpperCase()}
            </div>
            <div className="text-foreground font-medium text-sm">
              {participant.name}
            </div>
          </div>
        </div>
      )}

      {showControls && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors">
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-black/60 text-white text-xs px-2 py-1 rounded">
                {participant.name}
                {participant.isLocal && " (You)"}
              </div>
              {isScreenShare && (
                <div className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded flex items-center gap-1">
                  <Monitor className="h-3 w-3" />
                  Screen
                </div>
              )}
            </div>
          </div>

          <div className="absolute bottom-2 left-2 flex items-center gap-2">
            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center",
              participant.isAudioEnabled
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}>
              {participant.isAudioEnabled ? (
                <Mic className="h-3.5 w-3.5" />
              ) : (
                <MicOff className="h-3.5 w-3.5" />
              )}
            </div>

            <div className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center",
              participant.isVideoEnabled
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            )}>
              {participant.isVideoEnabled ? (
                <Video className="h-3.5 w-3.5" />
              ) : (
                <VideoOff className="h-3.5 w-3.5" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

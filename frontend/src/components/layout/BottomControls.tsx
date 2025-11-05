import { Mic, MicOff, Video, VideoOff, Monitor, MessageSquare, PhoneOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BottomControlsProps {
  isAudioEnabled: boolean
  isVideoEnabled: boolean
  isScreenSharing: boolean
  onToggleAudio: () => void
  onToggleVideo: () => void
  onToggleScreenShare: () => void
  onToggleChat: () => void
  onLeaveCall: () => void
  showChat?: boolean
}

export function BottomControls({
  isAudioEnabled,
  isVideoEnabled,
  isScreenSharing,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleChat,
  onLeaveCall,
  showChat = false,
}: BottomControlsProps) {
  return (
    <div className="sticky bottom-0 z-30 w-full bg-background backdrop-blur border-t border-border">
      <div className="h-16 px-6 flex items-center justify-center">
        <div className="flex items-center gap-2 rounded-full bg-background p-2 shadow-lg border border-border">
          <div className="flex items-center space-x-2 pr-4 border-r border-border">
            <Button
              variant={isAudioEnabled ? 'default' : 'outline'}
              size="lg"
              onClick={onToggleAudio}
              className={`rounded-full w-11 h-11 p-0 flex items-center justify-center ${isAudioEnabled
                ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground border-border'
                }`}
              title={`${isAudioEnabled ? 'Mute' : 'Unmute'} (Ctrl+D)`}
            >
              {isAudioEnabled ? (
                <Mic className="h-5 w-5" />
              ) : (
                <MicOff className="h-5 w-5" />
              )}
            </Button>

            <Button
              variant={isVideoEnabled ? 'default' : 'outline'}
              size="lg"
              onClick={onToggleVideo}
              className={`rounded-full w-11 h-11 p-0 flex items-center justify-center ${isVideoEnabled
                ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                : 'bg-muted hover:bg-muted/80 text-muted-foreground border-border'
                }`}
              title={`${isVideoEnabled ? 'Stop' : 'Start'} video (Ctrl+E)`}
            >
              {isVideoEnabled ? (
                <Video className="h-5 w-5" />
              ) : (
                <VideoOff className="h-5 w-5" />
              )}
            </Button>
          </div>

          <div className="flex items-center space-x-2 px-4 border-r border-border">
            <Button
              variant="outline"
              size="lg"
              onClick={onToggleScreenShare}
              className={`rounded-full w-11 h-11 p-0 flex items-center justify-center ${isScreenSharing
                ? 'bg-primary text-primary-foreground'
                : 'bg-background hover:bg-muted text-foreground border-border'
                }`}
              title={`${isScreenSharing ? 'Stop' : 'Start'} screen share`}
            >
              <Monitor className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center space-x-2 px-4 border-r border-border">
            <Button
              variant="outline"
              size="lg"
              onClick={onToggleChat}
              className={`rounded-full w-11 h-11 p-0 flex items-center justify-center ${showChat
                ? 'bg-primary text-primary-foreground'
                : 'bg-background hover:bg-muted text-foreground border-border'
                }`}
              title="Chat"
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center space-x-2 pl-4">
            <Button
              variant="outline"
              size="lg"
              onClick={onLeaveCall}
              className="rounded-full w-11 h-11 p-0 flex items-center justify-center bg-destructive hover:bg-destructive/90 text-destructive-foreground border-destructive"
              title="Leave call"
            >
              <PhoneOff className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}


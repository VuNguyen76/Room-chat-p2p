import { VideoTile } from './VideoTile'
import { cn } from '@/lib/utils'

interface Participant {
  id: string
  name: string
  avatarUrl?: string
  isVideoEnabled: boolean
  isAudioEnabled: boolean
  isScreenSharing?: boolean
  isLocal?: boolean
  stream?: MediaStream
}

interface VideoGridProps {
  participants: Participant[]
  className?: string
  onParticipantClick?: (participant: Participant) => void
}

export function VideoGridNew({
  participants,
  className = '',
  onParticipantClick
}: VideoGridProps) {
  const participantCount = participants.length

  const getGridLayout = (count: number): string => {
    if (count <= 1) return 'grid-cols-1'
    if (count === 2) return 'grid-cols-2'
    if (count === 3) return 'grid-cols-3'
    if (count === 4) return 'grid-cols-2 grid-rows-2'
    if (count <= 6) return 'grid-cols-3 grid-rows-2'
    if (count <= 9) return 'grid-cols-3 grid-rows-3'
    if (count <= 12) return 'grid-cols-4 grid-rows-3'
    if (count <= 16) return 'grid-cols-4 grid-rows-4'
    return 'grid-cols-5 grid-rows-4'
  }

  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.isLocal && !b.isLocal) return -1
    if (!a.isLocal && b.isLocal) return 1
    return 0
  })

  // Check if anyone is screen sharing
  const screenSharingParticipant = participants.find(p => p.isScreenSharing)
  const otherParticipants = screenSharingParticipant
    ? participants.filter(p => p.id !== screenSharingParticipant.id)
    : []

  if (participantCount === 0) {
    return (
      <div className={cn(
        "flex items-center justify-center h-full bg-muted rounded",
        className
      )}>
        <div className="text-center text-muted-foreground">
          <div className="text-4xl mb-4">📹</div>
          <div className="text-lg font-medium mb-2 text-foreground">No participants yet</div>
          <div className="text-sm">Waiting for others to join...</div>
        </div>
      </div>
    )
  }

  // Screen sharing layout: main area + horizontal thumbnail strip
  if (screenSharingParticipant) {
    return (
      <div className={cn("flex flex-col w-full h-full gap-3 p-4", className)}>
        {/* Main screen share area */}
        <div className="flex-1 min-h-0 bg-black rounded-lg overflow-hidden">
          <VideoTile
            participant={screenSharingParticipant}
            className="w-full h-full"
            onClick={() => onParticipantClick?.(screenSharingParticipant)}
          />
        </div>

        {/* Horizontal thumbnail strip for other participants */}
        {otherParticipants.length > 0 && (
          <div className="flex-shrink-0 h-32">
            <div className="flex gap-3 h-full overflow-x-auto">
              {otherParticipants.map((participant) => (
                <div key={participant.id} className="flex-shrink-0 w-40 h-full">
                  <VideoTile
                    participant={participant}
                    className="w-full h-full"
                    onClick={() => onParticipantClick?.(participant)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Single participant view
  if (participantCount === 1) {
    return (
      <div className={cn("w-full h-full", className)}>
        <VideoTile
          participant={sortedParticipants[0]}
          className="w-full h-full"
          onClick={() => onParticipantClick?.(sortedParticipants[0])}
        />
      </div>
    )
  }

  // Normal grid layout
  return (
    <div className={cn(
      "grid gap-4 w-full h-full p-4",
      getGridLayout(participantCount),
      className
    )}>
      {sortedParticipants.map((participant) => (
        <VideoTile
          key={participant.id}
          participant={participant}
          onClick={() => onParticipantClick?.(participant)}
        />
      ))}
    </div>
  )
}

import { Users, Mic, MicOff, Video, VideoOff, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface Participant {
    id: string
    name: string
    isVideoEnabled: boolean
    isAudioEnabled: boolean
    isLocal?: boolean
    isHost?: boolean
}

interface ParticipantsPanelProps {
    participants: Participant[]
    isOpen: boolean
    onClose: () => void
}

export function ParticipantsPanel({ participants, isOpen, onClose }: ParticipantsPanelProps) {
    if (!isOpen) return null

    return (
        <div className="h-full w-full bg-background border-l border-border flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-foreground" />
                    <h2 className="font-medium text-foreground">
                        Participants ({participants.length})
                    </h2>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    className="h-8 w-8 p-0 text-muted-foreground"
                >
                    ×
                </Button>
            </div>

            <ScrollArea className="flex-1">
                <div className="p-2">
                    {participants.map((participant) => (
                        <div
                            key={participant.id}
                            className={cn(
                                "flex items-center gap-3 p-3 rounded hover:bg-muted/50 transition-colors",
                                participant.isLocal && "bg-muted"
                            )}
                        >
                            <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-muted-foreground flex items-center justify-center text-background font-medium">
                                    {participant.name.charAt(0).toUpperCase()}
                                </div>
                                {participant.isHost && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                                        <Crown className="h-3 w-3 text-primary-foreground" />
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="font-medium text-foreground truncate">
                                        {participant.name}
                                    </p>
                                    {participant.isLocal && (
                                        <span className="text-xs text-muted-foreground font-medium">(You)</span>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <div
                                        className={cn(
                                            "flex items-center gap-1 text-xs",
                                            participant.isAudioEnabled ? "text-foreground" : "text-muted-foreground"
                                        )}
                                    >
                                        {participant.isAudioEnabled ? (
                                            <Mic className="h-3 w-3" />
                                        ) : (
                                            <MicOff className="h-3 w-3" />
                                        )}
                                    </div>
                                    <div
                                        className={cn(
                                            "flex items-center gap-1 text-xs",
                                            participant.isVideoEnabled ? "text-foreground" : "text-muted-foreground"
                                        )}
                                    >
                                        {participant.isVideoEnabled ? (
                                            <Video className="h-3 w-3" />
                                        ) : (
                                            <VideoOff className="h-3 w-3" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    )
}

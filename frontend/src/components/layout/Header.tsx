import { useState } from 'react'
import { Copy, Check, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface HeaderProps {
  roomId: string
  onSettingsClick?: () => void
}

export function Header({ roomId, onSettingsClick }: HeaderProps) {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopyRoomId = () => {
    navigator.clipboard.writeText(roomId)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background backdrop-blur border-border">
      <div className="h-16 px-6 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-8 rounded-xl bg-muted text-muted-foreground grid place-items-center font-semibold text-sm flex-shrink-0">
            VC
          </div>
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground leading-none">Room</div>
            <div className="font-semibold text-sm leading-tight text-foreground truncate">{roomId}</div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyRoomId}
            className="gap-2"
            title="Copy room ID"
          >
            {isCopied ? (
              <>
                <Check className="h-4 w-4" />
                <span className="text-xs hidden sm:inline">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span className="text-xs hidden sm:inline">Copy ID</span>
              </>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onSettingsClick}
            title="Settings"
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            <span className="text-xs hidden sm:inline">Settings</span>
          </Button>
        </div>
      </div>
    </header>
  )
}


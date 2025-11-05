import { Loader2, WifiOff } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ReconnectionUIProps {
  isReconnecting: boolean
  reconnectionAttempt: number
  nextRetryIn: number
  onCancel?: () => void
  className?: string
}

export function ReconnectionUI({
  isReconnecting,
  reconnectionAttempt,
  nextRetryIn,
  onCancel,
  className = ''
}: ReconnectionUIProps) {
  if (!isReconnecting) {
    return null
  }

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${className}`}
    >
      <div className="bg-background rounded-lg shadow-xl p-6 max-w-sm mx-4">
        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <WifiOff className="h-12 w-12 text-destructive" />
            <Loader2 className="h-8 w-8 text-primary absolute bottom-0 right-0 animate-spin" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-lg font-semibold text-center mb-2 text-foreground">
          Connection Lost
        </h2>

        {/* Message */}
        <p className="text-sm text-muted-foreground text-center mb-4">
          Attempting to reconnect to the server...
        </p>

        {/* Attempt Info */}
        <div className="bg-muted border border-border rounded-lg p-3 mb-4">
          <div className="text-sm text-foreground">
            <div className="font-medium mb-1">Reconnection Status</div>
            <div className="text-xs space-y-1 text-muted-foreground">
              <div>Attempt: {reconnectionAttempt}</div>
              {nextRetryIn > 0 && (
                <div>Next retry in: {nextRetryIn}s</div>
              )}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-muted rounded-full h-1 mb-4 overflow-hidden">
          <div
            className="h-full bg-primary animate-pulse"
            style={{
              width: `${Math.max(20, 100 - nextRetryIn * 10)}%`
            }}
          />
        </div>

        {/* Cancel Button */}
        {onCancel && (
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="w-full"
          >
            Cancel
          </Button>
        )}

        <p className="text-xs text-muted-foreground text-center mt-4">
          Please wait while we restore your connection...
        </p>
      </div>
    </div>
  )
}


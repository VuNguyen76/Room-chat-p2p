import { AlertTriangle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

interface RateLimitUIProps {
  isVisible: boolean
  retryAfter: number
  onRetry?: () => void
  onDismiss?: () => void
  className?: string
}

export function RateLimitUI({
  isVisible,
  retryAfter,
  onRetry,
  onDismiss,
  className = ''
}: RateLimitUIProps) {
  const [remainingTime, setRemainingTime] = useState(retryAfter)

  useEffect(() => {
    if (!isVisible) return

    setRemainingTime(retryAfter)

    const interval = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isVisible, retryAfter])

  if (!isVisible) {
    return null
  }

  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${className}`}
    >
      <div className="bg-background rounded-lg shadow-xl p-6 max-w-sm mx-4">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
        </div>

        <h2 className="text-lg font-semibold text-center mb-2 text-foreground">
          Too Many Requests
        </h2>

        <p className="text-sm text-muted-foreground text-center mb-4">
          You've made too many requests. Please wait before trying again.
        </p>

        <div className="bg-muted border border-border rounded-lg p-4 mb-4">
          <div className="flex items-center justify-center gap-2">
            <Clock className="h-5 w-5 text-foreground" />
            <div className="text-center">
              <div className="text-sm font-medium text-foreground">
                Retry available in
              </div>
              <div className="text-2xl font-bold text-foreground">
                {remainingTime}s
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {onDismiss && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDismiss}
              className="flex-1"
            >
              Dismiss
            </Button>
          )}
          {onRetry && (
            <Button
              size="sm"
              onClick={onRetry}
              disabled={remainingTime > 0}
              className="flex-1"
            >
              {remainingTime > 0 ? `Retry in ${remainingTime}s` : 'Retry Now'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}


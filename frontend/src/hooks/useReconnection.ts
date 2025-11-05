import { useState, useCallback, useRef, useEffect } from 'react'

export interface UseReconnectionOptions {
  maxRetries?: number
  initialDelayMs?: number
  maxDelayMs?: number
  onReconnecting?: (attempt: number, nextRetryIn: number) => void
  onReconnected?: () => void
  onReconnectionFailed?: (error: Error) => void
}

export interface UseReconnectionReturn {
  isReconnecting: boolean
  reconnectionAttempt: number
  nextRetryIn: number
  startReconnection: (fn: () => Promise<void>) => Promise<void>
  cancelReconnection: () => void
}

/**
 * Hook to handle reconnection with exponential backoff
 * Useful for handling socket disconnections and grace periods
 */
export function useReconnection(
  options: UseReconnectionOptions = {}
): UseReconnectionReturn {
  const {
    maxRetries = 5,
    initialDelayMs = 1000,
    maxDelayMs = 30000,
    onReconnecting,
    onReconnected,
    onReconnectionFailed
  } = options

  const [isReconnecting, setIsReconnecting] = useState(false)
  const [reconnectionAttempt, setReconnectionAttempt] = useState(0)
  const [nextRetryIn, setNextRetryIn] = useState(0)

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const cancelReconnection = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (countdownRef.current) {
      clearInterval(countdownRef.current)
      countdownRef.current = null
    }
    setIsReconnecting(false)
    setReconnectionAttempt(0)
    setNextRetryIn(0)
  }, [])

  const startReconnection = useCallback(
    async (fn: () => Promise<void>): Promise<void> => {
      let attempt = 0

      while (attempt < maxRetries) {
        try {
          setIsReconnecting(true)
          setReconnectionAttempt(attempt + 1)

          await fn()

          // Success
          setIsReconnecting(false)
          setReconnectionAttempt(0)
          setNextRetryIn(0)
          onReconnected?.()
          return
        } catch (error) {
          attempt++

          if (attempt >= maxRetries) {
            // Max retries exceeded
            const err = error instanceof Error ? error : new Error('Reconnection failed')
            setIsReconnecting(false)
            onReconnectionFailed?.(err)
            throw err
          }

          // Calculate delay with exponential backoff
          const delay = Math.min(
            initialDelayMs * Math.pow(2, attempt - 1),
            maxDelayMs
          )

          // Add jitter
          const jitter = Math.random() * 1000
          const totalDelay = delay + jitter

          setNextRetryIn(Math.ceil(totalDelay / 1000))
          onReconnecting?.(attempt, Math.ceil(totalDelay / 1000))

          // Countdown timer
          let remaining = Math.ceil(totalDelay / 1000)
          countdownRef.current = setInterval(() => {
            remaining--
            setNextRetryIn(remaining)
          }, 1000)

          // Wait before retrying
          await new Promise(resolve => {
            timeoutRef.current = setTimeout(resolve, totalDelay)
          })

          if (countdownRef.current) {
            clearInterval(countdownRef.current)
            countdownRef.current = null
          }
        }
      }
    },
    [maxRetries, initialDelayMs, maxDelayMs, onReconnecting, onReconnected, onReconnectionFailed]
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelReconnection()
    }
  }, [cancelReconnection])

  return {
    isReconnecting,
    reconnectionAttempt,
    nextRetryIn,
    startReconnection,
    cancelReconnection
  }
}


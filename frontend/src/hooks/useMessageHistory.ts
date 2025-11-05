import { useState, useCallback, useRef, useEffect } from 'react'
import apiClient, { type MessageItem } from '@/lib/api'

export interface UseMessageHistoryOptions {
  roomId?: string
  limit?: number
  onMessagesLoaded?: (messages: MessageItem[]) => void
  onError?: (error: Error) => void
}

export interface UseMessageHistoryReturn {
  messages: MessageItem[]
  isLoading: boolean
  error: Error | null
  hasMore: boolean
  loadMore: () => Promise<void>
  loadMessages: (roomId: string) => Promise<void>
  clear: () => void
}

export function useMessageHistory(
  options: UseMessageHistoryOptions = {}
): UseMessageHistoryReturn {
  const { roomId, limit = 50, onMessagesLoaded, onError } = options

  const [messages, setMessages] = useState<MessageItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [hasMore, setHasMore] = useState(true)

  // Track oldest message for pagination
  const oldestMessageRef = useRef<string | null>(null)
  const currentRoomRef = useRef<string | null>(null)

  const loadMessages = useCallback(
    async (room: string) => {
      if (!room) return

      try {
        setIsLoading(true)
        setError(null)
        currentRoomRef.current = room
        oldestMessageRef.current = null

        const response = await apiClient.getMessages(room, limit)
        setMessages(response.messages)
        setHasMore(response.hasMore)

        if (response.messages.length > 0) {
          oldestMessageRef.current = response.messages[0].createdAt
        }

        onMessagesLoaded?.(response.messages)
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to load messages')
        setError(error)
        onError?.(error)
      } finally {
        setIsLoading(false)
      }
    },
    [limit, onMessagesLoaded, onError]
  )

  const loadMore = useCallback(async () => {
    if (!currentRoomRef.current || !oldestMessageRef.current || !hasMore) return

    try {
      setIsLoading(true)
      const response = await apiClient.getMessages(
        currentRoomRef.current,
        limit,
        oldestMessageRef.current
      )

      setMessages(prev => [...response.messages, ...prev])
      setHasMore(response.hasMore)

      if (response.messages.length > 0) {
        oldestMessageRef.current = response.messages[0].createdAt
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to load more messages')
      setError(error)
      onError?.(error)
    } finally {
      setIsLoading(false)
    }
  }, [limit, hasMore, onError])

  const clear = useCallback(() => {
    setMessages([])
    setError(null)
    setHasMore(true)
    oldestMessageRef.current = null
    currentRoomRef.current = null
  }, [])

  // Load messages when roomId changes
  useEffect(() => {
    if (roomId) {
      loadMessages(roomId)
    }
  }, [roomId, loadMessages])

  return {
    messages,
    isLoading,
    error,
    hasMore,
    loadMore,
    loadMessages,
    clear
  }
}


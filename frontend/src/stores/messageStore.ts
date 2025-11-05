import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Message } from '../types/index'

interface MessageState {
  messages: Message[]
  isLoading: boolean
  error: string | null
}

interface MessageActions {
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void
  addSystemMessage: (content: string, roomId: string) => void
  clearMessages: () => void
  setMessages: (messages: Message[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

type MessageStore = MessageState & MessageActions

export const useMessageStore = create<MessageStore>()(
  devtools(
    (set) => ({
      // State
      messages: [],
      isLoading: false,
      error: null,

      // Actions
      addMessage: (messageData) => {
        const message: Message = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          ...messageData,
          type: messageData.type || 'text',
        }

        set((state) => ({
          messages: [...state.messages, message],
          error: null,
        }))
      },

      addSystemMessage: (content, roomId) => {
        const message: Message = {
          id: `sys_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          roomId,
          userId: 'system',
          userName: 'System',
          content,
          timestamp: new Date().toISOString(),
          type: 'system',
        }

        set((state) => ({
          messages: [...state.messages, message],
        }))
      },

      clearMessages: () => {
        set({ messages: [], error: null })
      },

      setMessages: (messages) => {
        set({ messages, error: null })
      },

      setLoading: (isLoading) => {
        set({ isLoading })
      },

      setError: (error) => {
        set({ error })
      },
    }),
    {
      name: 'message-store',
    }
  )
)

// Selectors
export const useMessages = () => useMessageStore((state) => state.messages)

// Memoized selector to prevent infinite loops
const messagesByRoomCache = new Map<string, Message[]>()
let lastMessages: Message[] = []

export const useMessagesForRoom = (roomId: string) => {
  return useMessageStore((state) => {
    // Only recompute if messages actually changed
    if (state.messages !== lastMessages) {
      lastMessages = state.messages
      messagesByRoomCache.clear()
    }

    // Return cached result if available
    if (messagesByRoomCache.has(roomId)) {
      return messagesByRoomCache.get(roomId)!
    }

    // Compute and cache
    const filtered = state.messages.filter(msg => msg.roomId === roomId)
    messagesByRoomCache.set(roomId, filtered)
    return filtered
  })
}

export const useMessageLoading = () => useMessageStore((state) => state.isLoading)
export const useMessageError = () => useMessageStore((state) => state.error)

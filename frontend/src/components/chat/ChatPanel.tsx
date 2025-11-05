import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Users, Send, Loader2 } from 'lucide-react'
import { useUserStore } from '../../stores/userStore'
import { useSignaling } from '@/hooks/useSignaling'
import { useMessageHistory } from '@/hooks/useMessageHistory'
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages'

interface Message {
  id: string
  content: string
  userSnapshot: { displayName: string; avatarUrl?: string }
  createdAt: string
  sessionRef: string
  type: 'text' | 'system'
}

interface ChatPanelProps {
  roomId: string
  participantCount?: number
  className?: string
}

export function ChatPanel({
  roomId,
  participantCount = 0,
  className = ''
}: ChatPanelProps) {
  const [inputValue, setInputValue] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [realtimeMessages, setRealtimeMessages] = useState<Message[]>([])
  const currentUser = useUserStore((state) => state.user)
  const { sendMessage } = useSignaling()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Load message history
  const messageHistory = useMessageHistory({
    roomId,
    limit: 50
  })

  // Handle real-time messages with deduplication
  const handleRealtimeMessage = useCallback((messageData: Message) => {
    setRealtimeMessages(prev => {
      if (prev.some(msg => msg.id === messageData.id)) {
        return prev
      }
      return [...prev, messageData]
    })
  }, [])

  // Setup real-time message listener
  useRealtimeMessages({
    roomId,
    onMessage: handleRealtimeMessage
  })

  // Clear realtime messages when room changes
  useEffect(() => {
    setRealtimeMessages([])
  }, [roomId])

  // Combine and deduplicate messages
  const allMessages = useMemo(() => {
    const historyMessages = messageHistory.messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      userSnapshot: msg.userSnapshot,
      createdAt: msg.createdAt,
      sessionRef: 'history',
      type: (msg.type as 'text' | 'system') || 'text'
    }))

    const combined = [...historyMessages, ...realtimeMessages]
    const uniqueMessages = combined.filter((msg, index, arr) =>
      arr.findIndex(m => m.id === msg.id) === index
    )

    return uniqueMessages.sort((a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
  }, [messageHistory.messages, realtimeMessages])

  // Auto-scroll to bottom for new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [allMessages.length])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentUser || !roomId || isSending) {
      return
    }

    const messageContent = inputValue.trim()
    setInputValue('')
    setIsSending(true)

    try {
      await sendMessage(roomId, messageContent)
    } catch (error) {
      console.error('Failed to send message:', error)
      setInputValue(messageContent)
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className={`flex h-full flex-col bg-background ${className}`}>
      <div className="px-4 py-3 flex-shrink-0 border-b border-border">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-foreground">Chat</h3>
          {participantCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3 w-3" />
              <span>{participantCount}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden min-h-0">
        <ScrollArea className="h-full px-4">
          {messageHistory.hasMore && (
            <div className="flex justify-center py-2">
              {messageHistory.isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => messageHistory.loadMore()}
                  className="text-xs"
                >
                  Load earlier messages
                </Button>
              )}
            </div>
          )}

          <div className="space-y-3 py-2">
            {allMessages.length === 0 && !messageHistory.isLoading ? (
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                <div className="text-2xl mb-2">💬</div>
                <div className="text-sm font-medium">No messages yet</div>
                <div className="text-xs mt-1">Start the conversation!</div>
              </div>
            ) : (
              allMessages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={message.userSnapshot.displayName === currentUser?.displayName}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </div>

      <div className="border-t border-border p-3 flex-shrink-0 bg-background">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={currentUser ? "Type a message..." : "Join room to chat"}
            disabled={!currentUser || isSending}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || !currentUser || isSending}
            size="sm"
            className="px-3"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Message Bubble Component
function MessageBubble({
  message,
  isOwn
}: {
  message: Message
  isOwn: boolean
}) {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  if (message.type === 'system') {
    return (
      <div className="flex justify-center py-1">
        <div className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[75%] ${isOwn ? 'order-2' : 'order-1'}`}>
        <div className={`flex items-center gap-2 mb-1 px-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
          <span className="text-xs font-medium text-foreground">
            {message.userSnapshot.displayName}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatTime(message.createdAt)}
          </span>
        </div>

        <div
          className={`px-3 py-2 rounded-lg text-sm break-words ${isOwn
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
            }`}
        >
          {message.content}
        </div>
      </div>
    </div>
  )
}

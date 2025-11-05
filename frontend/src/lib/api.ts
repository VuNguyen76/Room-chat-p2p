import { API_BASE_URL } from '@/utils/constants'
import { parseApiError } from './apiErrorHandler'

export interface CreateRoomRequest {
  title?: string
  maxParticipants?: number
  createdBy: {
    displayName: string
    avatarUrl?: string
  }
}

export interface CreateRoomResponse {
  roomId: string
  title: string
  maxParticipants: number
  createdBy: {
    displayName: string
    avatarUrl?: string
  }
  createdAt: string
}

export interface GetRoomResponse {
  roomId: string
  title: string
  maxParticipants: number
  memberCount: number
  isLocked: boolean
  createdAt: string
  lastMessageAt?: string
}

export interface RoomListItem {
  roomId: string
  title: string
  memberCount: number
  isLocked: boolean
  lastMessageAt?: string
  createdAt: string
}

export interface MessageItem {
  id: string
  content: string
  type: string
  userSnapshot: {
    displayName: string
    avatarUrl?: string
  }
  createdAt: string
}

export interface EventItem {
  eventType: string
  userSnapshot: {
    displayName: string
    avatarUrl?: string
  }
  sessionRef: string
  metadata?: any
  createdAt: string
}

export interface ApiError {
  error: string
  message: string
  details?: any[]
}

class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      const data = await response.json()

      if (!response.ok) {
        throw parseApiError(response, data)
      }

      return data
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error)
      throw error
    }
  }

  // Room Management
  async createRoom(data: CreateRoomRequest): Promise<CreateRoomResponse> {
    return this.request<CreateRoomResponse>('/api/rooms', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getRoom(roomId: string): Promise<GetRoomResponse> {
    return this.request<GetRoomResponse>(`/api/rooms/${roomId}`)
  }

  async getRooms(limit = 20, sortBy = 'lastMessageAt'): Promise<RoomListItem[]> {
    return this.request<RoomListItem[]>(`/api/rooms?limit=${limit}&sortBy=${sortBy}`)
  }

  // Messages
  async getMessages(
    roomId: string,
    limit = 50,
    before?: string,
    after?: string
  ): Promise<{
    messages: MessageItem[]
    hasMore: boolean
  }> {
    let url = `/api/rooms/${roomId}/messages?limit=${limit}`
    if (before) {
      url += `&before=${before}`
    }
    if (after) {
      url += `&after=${after}`
    }
    return this.request<{ messages: MessageItem[]; hasMore: boolean }>(url)
  }

  // Events
  async getEvents(
    roomId: string,
    limit = 50,
    before?: string,
    after?: string
  ): Promise<{
    events: EventItem[]
    hasMore: boolean
  }> {
    let url = `/api/rooms/${roomId}/events?limit=${limit}`
    if (before) {
      url += `&before=${before}`
    }
    if (after) {
      url += `&after=${after}`
    }
    return this.request<{ events: EventItem[]; hasMore: boolean }>(url)
  }
}

// Create singleton instance
const apiClient = new ApiClient(API_BASE_URL || '')

export default apiClient

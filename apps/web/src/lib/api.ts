import {
  RegisterInput,
  LoginInput,
  UpdateProfileInput,
  UpdatePreferencesInput,
  CreateGroupInput,
  SendMessageInput,
  EditMessageInput,
  ToggleReactionInput,
  AITone,
} from '@nebula/shared';

const API_BASE = '/api';

let activeToken: string | null = null;

export function setApiToken(token: string | null) {
  activeToken = token;
  if (token) {
    localStorage.setItem('nebula_token', token);
  } else {
    localStorage.removeItem('nebula_token');
  }
}

export function getApiToken(): string | null {
  if (!activeToken) {
    activeToken = localStorage.getItem('nebula_token');
  }
  return activeToken;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getApiToken();
  const headers = new Headers(options.headers || {});

  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP ${response.status}: Request failed`);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (input: RegisterInput) =>
    request<{ token: string; user: any; preferences: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  login: (input: LoginInput) =>
    request<{ token: string; user: any; preferences: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  logout: () =>
    request<{ message: string }>('/auth/logout', {
      method: 'POST',
    }),

  getMe: () =>
    request<{ user: any; preferences: any }>('/auth/me'),

  // Users
  searchUsers: (query: string) =>
    request<{ users: any[] }>(`/users/search?q=${encodeURIComponent(query)}`),

  updateProfile: (input: UpdateProfileInput) =>
    request<{ user: any }>('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),

  updatePreferences: (input: UpdatePreferencesInput) =>
    request<{ preferences: any }>('/users/preferences', {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),

  blockUser: (userId: string) =>
    request<{ message: string }>(`/users/block/${userId}`, { method: 'POST' }),

  unblockUser: (userId: string) =>
    request<{ message: string }>(`/users/block/${userId}`, { method: 'DELETE' }),

  // Conversations
  listConversations: () =>
    request<{ conversations: any[] }>('/conversations'),

  getConversationDetails: (id: string) =>
    request<{
      conversation: any;
      pinnedMessages: any[];
      sharedMedia: any[];
      sharedDocs: any[];
      myMembership: any;
    }>(`/conversations/${id}`),

  createDirect: (recipientId: string) =>
    request<{ conversation: any }>('/conversations/direct', {
      method: 'POST',
      body: JSON.stringify({ recipientId }),
    }),

  createGroup: (input: CreateGroupInput) =>
    request<{ conversation: any }>('/conversations/group', {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  togglePinConversation: (id: string) =>
    request<{ isPinned: boolean }>(`/conversations/${id}/pin`, { method: 'PATCH' }),

  toggleMuteConversation: (id: string) =>
    request<{ isMuted: boolean }>(`/conversations/${id}/mute`, { method: 'PATCH' }),

  toggleArchiveConversation: (id: string) =>
    request<{ isArchived: boolean }>(`/conversations/${id}/archive`, { method: 'PATCH' }),

  addGroupMember: (conversationId: string, userId: string, role: 'ADMIN' | 'MEMBER' = 'MEMBER') =>
    request<{ member: any }>(`/conversations/${conversationId}/members`, {
      method: 'POST',
      body: JSON.stringify({ userId, role }),
    }),

  removeGroupMember: (conversationId: string, userId: string) =>
    request<{ message: string }>(`/conversations/${conversationId}/members/${userId}`, {
      method: 'DELETE',
    }),

  // Messages
  getMessages: (conversationId: string, cursor?: string, limit: number = 50) =>
    request<{ messages: any[]; nextCursor: string | null }>(
      `/messages/${conversationId}?limit=${limit}${cursor ? `&cursor=${cursor}` : ''}`
    ),

  editMessage: (messageId: string, input: EditMessageInput) =>
    request<{ message: any }>(`/messages/${messageId}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),

  deleteMessage: (messageId: string) =>
    request<{ message: any }>(`/messages/${messageId}`, {
      method: 'DELETE',
    }),

  toggleReaction: (messageId: string, input: ToggleReactionInput) =>
    request<{ action: 'added' | 'removed'; emoji: string }>(`/messages/${messageId}/reactions`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  togglePinMessage: (messageId: string) =>
    request<{ isPinned: boolean; message: any }>(`/messages/${messageId}/pin`, {
      method: 'POST',
    }),

  toggleBookmark: (messageId: string) =>
    request<{ isBookmarked: boolean }>(`/messages/${messageId}/bookmark`, {
      method: 'POST',
    }),

  getBookmarks: () =>
    request<{ bookmarks: any[] }>('/messages/bookmarks/all'),

  // Search
  globalSearch: (query: string, type: string = 'all') =>
    request<{ query: string; results: { people: any[]; conversations: any[]; messages: any[]; files: any[] } }>(
      `/search?query=${encodeURIComponent(query)}&type=${type}`
    ),

  // File Upload
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return request<{ file: { filename: string; originalName: string; mimeType: string; size: number; url: string } }>(
      '/upload',
      {
        method: 'POST',
        body: formData,
      }
    );
  },

  // Built-in NEBULA AI
  aiSummarize: (conversationId: string) =>
    request<{ summary: string; actionItems: string[]; keyTopics: string[]; participantSentiment: string }>(
      '/ai/summarize',
      {
        method: 'POST',
        body: JSON.stringify({ conversationId }),
      }
    ),

  aiRewriteTone: (text: string, tone: AITone) =>
    request<{ original: string; rewritten: string; tone: AITone }>('/ai/tone', {
      method: 'POST',
      body: JSON.stringify({ text, tone }),
    }),

  aiSmartReply: (lastMessage?: string) =>
    request<{ suggestions: Array<{ id: string; text: string; category: string }> }>('/ai/smart-reply', {
      method: 'POST',
      body: JSON.stringify({ lastMessage }),
    }),

  aiChat: (prompt: string) =>
    request<{ reply: string; timestamp: string; model: string }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    }),
};

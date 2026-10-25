// ==============================================================================
// NEBULA 2046 - CORE DATA MODELS & TYPE DEFINITIONS
// ==============================================================================

export type UserStatus = 'ONLINE' | 'AWAY' | 'DND' | 'OFFLINE';

export type UserThemePreference = 'dark' | 'light' | 'system';
export type InterfaceDensity = 'comfortable' | 'compact';
export type AnimationIntensity = 'subtle' | 'expressive' | 'reduced';

export interface UserPreferences {
  theme: UserThemePreference;
  density: InterfaceDensity;
  animationIntensity: AnimationIntensity;
  soundEnabled: boolean;
  readReceiptsEnabled: boolean;
  presencePrivacy: boolean;
}

export interface UserSummary {
  id: string;
  email: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  status: UserStatus;
  isOnline: boolean;
  lastSeenAt?: string | null;
}

export interface UserProfile extends UserSummary {
  preferences: UserPreferences;
  createdAt: string;
}

export type ConversationType = 'DIRECT' | 'GROUP';
export type MemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface ConversationMemberSummary {
  id: string;
  userId: string;
  conversationId: string;
  role: MemberRole;
  joinedAt: string;
  user: UserSummary;
  isMuted: boolean;
  isPinned: boolean;
  isArchived: boolean;
  lastReadMessageId?: string | null;
  unreadCount: number;
}

export interface ConversationSummary {
  id: string;
  type: ConversationType;
  name?: string | null;
  description?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string | null;
  lastMessage?: MessageSummary | null;
  members: ConversationMemberSummary[];
  isPinned?: boolean;
  isMuted?: boolean;
  isArchived?: boolean;
  unreadCount?: number;
}

export type MessageType = 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE' | 'AUDIO' | 'VOICE' | 'SYSTEM';

export interface AttachmentSummary {
  id: string;
  messageId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  createdAt: string;
}

export interface ReactionSummary {
  emoji: string;
  count: number;
  users: Array<{ id: string; username: string; displayName: string }>;
  hasReacted: boolean;
}

export interface ReadReceiptSummary {
  userId: string;
  readAt: string;
  user?: { displayName: string; avatarUrl?: string | null };
}

export interface MessageSummary {
  id: string;
  conversationId: string;
  senderId: string;
  sender?: UserSummary;
  content: string;
  type: MessageType;
  idempotencyKey?: string | null;
  replyToId?: string | null;
  replyTo?: {
    id: string;
    content: string;
    sender: { displayName: string; username: string };
  } | null;
  isEdited: boolean;
  editedAt?: string | null;
  isDeleted: boolean;
  deletedAt?: string | null;
  isPinned: boolean;
  pinnedAt?: string | null;
  pinnedBy?: string | null;
  isBookmarked?: boolean;
  attachments: AttachmentSummary[];
  reactions: ReactionSummary[];
  readReceipts?: ReadReceiptSummary[];
  createdAt: string;
  // Ephemeral client states
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: 'MESSAGE' | 'MENTION' | 'CALL' | 'REACTION' | 'SYSTEM';
  title: string;
  body: string;
  conversationId?: string | null;
  messageId?: string | null;
  isRead: boolean;
  createdAt: string;
}

// ------------------------------------------------------------------------------
// WebRTC Calling Signatures
// ------------------------------------------------------------------------------
export type CallType = 'AUDIO' | 'VIDEO';

export interface CallSession {
  callId: string;
  conversationId: string;
  caller: UserSummary;
  callee: UserSummary;
  type: CallType;
  status: 'CALLING' | 'RINGING' | 'ACCEPTED' | 'REJECTED' | 'ENDED' | 'MISSED';
  startedAt?: string;
}

export interface CallSignalPayload {
  callId: string;
  conversationId: string;
  targetUserId: string;
  fromUserId: string;
  signalData: any; // SDP offer/answer or ICE candidate
  callType: CallType;
}

// ------------------------------------------------------------------------------
// Built-in NEBULA AI Signatures
// ------------------------------------------------------------------------------
export type AITone = 'futuristic' | 'formal' | 'concise' | 'friendly' | 'analytical';

export interface AISummaryResponse {
  summary: string;
  actionItems: string[];
  keyTopics: string[];
  participantSentiment: string;
}

export interface AIRewriteResponse {
  original: string;
  rewritten: string;
  tone: AITone;
}

export interface AISmartReply {
  id: string;
  text: string;
  category: 'acknowledgment' | 'question' | 'affirmation' | 'futuristic';
}

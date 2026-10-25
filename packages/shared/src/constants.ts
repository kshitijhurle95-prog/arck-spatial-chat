// ==============================================================================
// NEBULA 2046 - SHARED CONSTANTS & EVENT PROTOCOLS
// ==============================================================================

export const SOCKET_EVENTS = {
  // Connection & Auth
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  AUTHENTICATE: 'authenticate',
  AUTHENTICATED: 'authenticated',
  AUTH_ERROR: 'auth_error',

  // Room Subscription
  JOIN_CONVERSATION: 'join_conversation',
  LEAVE_CONVERSATION: 'leave_conversation',

  // Messages
  SEND_MESSAGE: 'send_message',
  MESSAGE_RECEIVED: 'message_received',
  MESSAGE_ACK: 'message_ack',
  EDIT_MESSAGE: 'edit_message',
  MESSAGE_EDITED: 'message_edited',
  DELETE_MESSAGE: 'delete_message',
  MESSAGE_DELETED: 'message_deleted',
  PIN_MESSAGE: 'pin_message',
  MESSAGE_PINNED: 'message_pinned',

  // Reactions
  TOGGLE_REACTION: 'toggle_reaction',
  REACTION_UPDATED: 'reaction_updated',

  // Ephemeral Signals
  TYPING_START: 'typing_start',
  TYPING_STOP: 'typing_stop',
  USER_TYPING: 'user_typing',

  // Presence & Receipts
  PRESENCE_UPDATE: 'presence_update',
  USER_PRESENCE_CHANGED: 'user_presence_changed',
  MARK_READ: 'mark_read',
  MESSAGE_READ: 'message_read',

  // WebRTC Audio/Video Calls
  CALL_INITIATE: 'call_initiate',
  CALL_INCOMING: 'call_incoming',
  CALL_ACCEPT: 'call_accept',
  CALL_ACCEPTED: 'call_accepted',
  CALL_REJECT: 'call_reject',
  CALL_REJECTED: 'call_rejected',
  CALL_SIGNAL: 'call_signal',
  CALL_END: 'call_end',
  CALL_ENDED: 'call_ended',

  // System Notifications
  NOTIFICATION_NEW: 'notification_new',
  CONVERSATION_UPDATED: 'conversation_updated',
} as const;

export const DEFAULT_PREFERENCES = {
  theme: 'dark' as const,
  density: 'comfortable' as const,
  animationIntensity: 'expressive' as const,
  soundEnabled: true,
  readReceiptsEnabled: true,
  presencePrivacy: true,
};

export const STORAGE_LIMITS = {
  MAX_FILE_SIZE_BYTES: 50 * 1024 * 1024, // 50MB
  ALLOWED_IMAGE_MIMES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  ALLOWED_MEDIA_MIMES: ['video/mp4', 'video/webm', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/webm'],
  ALLOWED_DOC_MIMES: [
    'application/pdf',
    'application/zip',
    'application/x-zip-compressed',
    'text/plain',
    'text/markdown',
    'application/json',
  ],
};

import { z } from 'zod';

// ==============================================================================
// AUTHENTICATION SCHEMAS
// ==============================================================================
export const RegisterSchema = z.object({
  email: z.string().email('Invalid email address format'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username may only contain letters, numbers, underscores, and dashes'),
  displayName: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name cannot exceed 50 characters'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password cannot exceed 128 characters'),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  login: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof LoginSchema>;

export const UpdateProfileSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  bio: z.string().max(200).optional().nullable(),
  status: z.enum(['ONLINE', 'AWAY', 'DND', 'OFFLINE']).optional(),
  avatarUrl: z.string().url().optional().nullable().or(z.string().startsWith('/uploads/')),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export const UpdatePreferencesSchema = z.object({
  theme: z.enum(['dark', 'light', 'system']).optional(),
  density: z.enum(['comfortable', 'compact']).optional(),
  animationIntensity: z.enum(['subtle', 'expressive', 'reduced']).optional(),
  soundEnabled: z.boolean().optional(),
  readReceiptsEnabled: z.boolean().optional(),
  presencePrivacy: z.boolean().optional(),
});

export type UpdatePreferencesInput = z.infer<typeof UpdatePreferencesSchema>;

// ==============================================================================
// CONVERSATION & GROUP SCHEMAS
// ==============================================================================
export const CreateDirectConversationSchema = z.object({
  recipientId: z.string().min(1, 'Recipient ID is required'),
});

export const CreateGroupConversationSchema = z.object({
  name: z.string().min(2, 'Group name must be at least 2 characters').max(60),
  description: z.string().max(250).optional(),
  memberIds: z.array(z.string()).min(1, 'At least one initial member is required'),
  avatarUrl: z.string().optional().nullable(),
});

export type CreateGroupInput = z.infer<typeof CreateGroupConversationSchema>;

export const UpdateGroupSchema = z.object({
  name: z.string().min(2).max(60).optional(),
  description: z.string().max(250).optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
});

export const AddGroupMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
});

// ==============================================================================
// MESSAGE SCHEMAS
// ==============================================================================
export const SendMessageSchema = z.object({
  conversationId: z.string().min(1, 'Conversation ID required'),
  content: z.string().max(8000, 'Message content cannot exceed 8,000 characters'),
  type: z.enum(['TEXT', 'IMAGE', 'VIDEO', 'FILE', 'AUDIO', 'VOICE', 'SYSTEM']).default('TEXT'),
  idempotencyKey: z.string().optional(),
  replyToId: z.string().optional().nullable(),
  attachmentIds: z.array(z.string()).optional(),
});

export type SendMessageInput = z.infer<typeof SendMessageSchema>;

export const EditMessageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(8000),
});

export type EditMessageInput = z.infer<typeof EditMessageSchema>;

export const ToggleReactionSchema = z.object({
  emoji: z.string().min(1, 'Emoji required').max(16),
});

export type ToggleReactionInput = z.infer<typeof ToggleReactionSchema>;

// ==============================================================================
// SEARCH SCHEMAS
// ==============================================================================
export const SearchQuerySchema = z.object({
  query: z.string().min(1),
  conversationId: z.string().optional(),
  type: z.enum(['all', 'messages', 'people', 'groups', 'files']).default('all'),
  limit: z.coerce.number().min(1).max(50).default(20),
  cursor: z.string().optional(),
});

import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { SOCKET_EVENTS, SendMessageSchema } from '@nebula/shared';
import { verifyToken } from '../auth';
import { prisma } from '../prisma';

export function initializeSocketIO(httpServer: HttpServer): SocketIOServer {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*', // Handled through proxy or shared origin
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 30000,
    pingInterval: 15000,
  });

  // ============================================================================
  // AUTHENTICATION MIDDLEWARE
  // ============================================================================
  io.use(async (socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace('Bearer ', '') ||
        (socket.handshake.headers?.cookie && parseCookieToken(socket.handshake.headers.cookie));

      if (!token) {
        return next(new Error('Authentication failed: Missing token.'));
      }

      const payload = verifyToken(token);
      if (!payload || !payload.userId) {
        return next(new Error('Authentication failed: Invalid token.'));
      }

      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          status: true,
        },
      });

      if (!user) {
        return next(new Error('Authentication failed: User does not exist.'));
      }

      (socket as any).user = user;
      next();
    } catch (error) {
      next(new Error('Internal socket authentication error.'));
    }
  });

  // ============================================================================
  // CONNECTION HANDLER
  // ============================================================================
  io.on(SOCKET_EVENTS.CONNECT, async (socket: Socket) => {
    const user = (socket as any).user;
    const userId = user.id;

    // Join personal user room for direct signals, calls, and notifications
    socket.join(`user:${userId}`);

    // Mark user as online in database
    await prisma.user.update({
      where: { id: userId },
      data: { isOnline: true, status: 'ONLINE', lastSeenAt: new Date() },
    });

    // Notify connected contacts
    io.emit(SOCKET_EVENTS.USER_PRESENCE_CHANGED, {
      userId,
      isOnline: true,
      status: 'ONLINE',
      lastSeenAt: new Date().toISOString(),
    });

    // Automatically join all active conversation rooms for this user
    const memberships = await prisma.conversationMember.findMany({
      where: { userId },
      select: { conversationId: true },
    });

    memberships.forEach((m) => {
      socket.join(`conversation:${m.conversationId}`);
    });

    // --------------------------------------------------------------------------
    // 1. JOIN & LEAVE CONVERSATIONS
    // --------------------------------------------------------------------------
    socket.on(SOCKET_EVENTS.JOIN_CONVERSATION, ({ conversationId }: { conversationId: string }) => {
      if (conversationId) {
        socket.join(`conversation:${conversationId}`);
      }
    });

    socket.on(SOCKET_EVENTS.LEAVE_CONVERSATION, ({ conversationId }: { conversationId: string }) => {
      if (conversationId) {
        socket.leave(`conversation:${conversationId}`);
      }
    });

    // --------------------------------------------------------------------------
    // 2. SEND MESSAGE
    // --------------------------------------------------------------------------
    socket.on(
      SOCKET_EVENTS.SEND_MESSAGE,
      async (data: any, callback?: (response: { success: boolean; message?: any; error?: string }) => void) => {
        try {
          const parseResult = SendMessageSchema.safeParse(data);
          if (!parseResult.success) {
            callback?.({ success: false, error: 'Message validation failed.' });
            return;
          }

          const { conversationId, content, type, idempotencyKey, replyToId, attachmentIds } = parseResult.data;

          // Check membership
          const membership = await prisma.conversationMember.findUnique({
            where: {
              conversationId_userId: { conversationId, userId },
            },
          });

          if (!membership) {
            callback?.({ success: false, error: 'Unauthorized: not a member of this conversation.' });
            return;
          }

          // Idempotency check: if message with this idempotencyKey exists, return it safely
          if (idempotencyKey) {
            const existingMsg = await prisma.message.findFirst({
              where: { idempotencyKey, senderId: userId },
              include: {
                sender: { select: { id: true, displayName: true, username: true, avatarUrl: true } },
                attachments: true,
                replyTo: { select: { id: true, content: true, sender: { select: { displayName: true, username: true } } } },
              },
            });
            if (existingMsg) {
              callback?.({ success: true, message: existingMsg });
              return;
            }
          }

          // Persist message in transaction
          const createdMessage = await prisma.$transaction(async (tx) => {
            const msg = await tx.message.create({
              data: {
                conversationId,
                senderId: userId,
                content: content || '',
                type,
                idempotencyKey,
                replyToId,
              },
              include: {
                sender: {
                  select: { id: true, displayName: true, username: true, avatarUrl: true, status: true },
                },
                replyTo: {
                  select: {
                    id: true,
                    content: true,
                    sender: { select: { displayName: true, username: true } },
                  },
                },
                attachments: true,
              },
            });

            // Update conversation lastMessageAt
            await tx.conversation.update({
              where: { id: conversationId },
              data: { lastMessageAt: new Date() },
            });

            // Increment unread count for other members
            await tx.conversationMember.updateMany({
              where: {
                conversationId,
                userId: { not: userId },
              },
              data: {
                unreadCount: { increment: 1 },
              },
            });

            return msg;
          });

          const formattedMessage = {
            id: createdMessage.id,
            conversationId: createdMessage.conversationId,
            senderId: createdMessage.senderId,
            sender: createdMessage.sender,
            content: createdMessage.content,
            type: createdMessage.type,
            idempotencyKey: createdMessage.idempotencyKey,
            replyToId: createdMessage.replyToId,
            replyTo: createdMessage.replyTo,
            isEdited: false,
            isDeleted: false,
            isPinned: false,
            attachments: createdMessage.attachments,
            reactions: [],
            readReceipts: [],
            createdAt: createdMessage.createdAt.toISOString(),
          };

          // Acknowledge back to sender
          callback?.({ success: true, message: formattedMessage });

          // Broadcast to conversation room (so all active members receive immediately)
          io.to(`conversation:${conversationId}`).emit(SOCKET_EVENTS.MESSAGE_RECEIVED, formattedMessage);

          // Also trigger conversation preview updates for member user rooms
          const allMembers = await prisma.conversationMember.findMany({
            where: { conversationId },
            select: { userId: true },
          });

          allMembers.forEach((member) => {
            io.to(`user:${member.userId}`).emit(SOCKET_EVENTS.CONVERSATION_UPDATED, {
              conversationId,
              lastMessage: formattedMessage,
            });
          });
        } catch (error) {
          console.error('Socket send_message error:', error);
          callback?.({ success: false, error: 'Internal message dispatch error.' });
        }
      }
    );

    // --------------------------------------------------------------------------
    // 3. EDIT MESSAGE
    // --------------------------------------------------------------------------
    socket.on(SOCKET_EVENTS.EDIT_MESSAGE, async ({ messageId, content }: { messageId: string; content: string }) => {
      try {
        const msg = await prisma.message.findUnique({ where: { id: messageId } });
        if (!msg || msg.senderId !== userId || msg.isDeleted) return;

        const updated = await prisma.message.update({
          where: { id: messageId },
          data: { content, isEdited: true, editedAt: new Date() },
        });

        io.to(`conversation:${msg.conversationId}`).emit(SOCKET_EVENTS.MESSAGE_EDITED, {
          messageId: updated.id,
          conversationId: msg.conversationId,
          content: updated.content,
          isEdited: true,
          editedAt: updated.editedAt?.toISOString(),
        });
      } catch (err) {
        console.error('Socket edit_message error:', err);
      }
    });

    // --------------------------------------------------------------------------
    // 4. DELETE MESSAGE
    // --------------------------------------------------------------------------
    socket.on(SOCKET_EVENTS.DELETE_MESSAGE, async ({ messageId }: { messageId: string }) => {
      try {
        const msg = await prisma.message.findUnique({
          where: { id: messageId },
          include: { conversation: { include: { members: { where: { userId } } } } },
        });

        if (!msg) return;
        const isAuthor = msg.senderId === userId;
        const membership = msg.conversation.members[0];
        const isAdmin = membership && (membership.role === 'OWNER' || membership.role === 'ADMIN');

        if (!isAuthor && !isAdmin) return;

        await prisma.message.update({
          where: { id: messageId },
          data: { isDeleted: true, deletedAt: new Date(), content: 'This message was deleted.' },
        });

        io.to(`conversation:${msg.conversationId}`).emit(SOCKET_EVENTS.MESSAGE_DELETED, {
          messageId: msg.id,
          conversationId: msg.conversationId,
        });
      } catch (err) {
        console.error('Socket delete_message error:', err);
      }
    });

    // --------------------------------------------------------------------------
    // 5. REACTIONS
    // --------------------------------------------------------------------------
    socket.on(SOCKET_EVENTS.TOGGLE_REACTION, async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      try {
        const msg = await prisma.message.findUnique({ where: { id: messageId } });
        if (!msg) return;

        const existing = await prisma.messageReaction.findUnique({
          where: { messageId_userId_emoji: { messageId, userId, emoji } },
        });

        if (existing) {
          await prisma.messageReaction.delete({ where: { id: existing.id } });
        } else {
          await prisma.messageReaction.create({ data: { messageId, userId, emoji } });
        }

        // Fetch fresh reaction tally
        const allReactions = await prisma.messageReaction.findMany({
          where: { messageId },
          include: { user: { select: { id: true, username: true, displayName: true } } },
        });

        const reactionMap = new Map<string, { emoji: string; count: number; users: Array<any> }>();
        allReactions.forEach((r) => {
          if (!reactionMap.has(r.emoji)) {
            reactionMap.set(r.emoji, { emoji: r.emoji, count: 0, users: [] });
          }
          const item = reactionMap.get(r.emoji)!;
          item.count += 1;
          item.users.push(r.user);
        });

        io.to(`conversation:${msg.conversationId}`).emit(SOCKET_EVENTS.REACTION_UPDATED, {
          messageId,
          conversationId: msg.conversationId,
          reactions: Array.from(reactionMap.values()),
        });
      } catch (err) {
        console.error('Socket reaction error:', err);
      }
    });

    // --------------------------------------------------------------------------
    // 6. TYPING INDICATORS
    // --------------------------------------------------------------------------
    socket.on(SOCKET_EVENTS.TYPING_START, ({ conversationId }: { conversationId: string }) => {
      socket.to(`conversation:${conversationId}`).emit(SOCKET_EVENTS.USER_TYPING, {
        conversationId,
        userId,
        displayName: user.displayName,
        isTyping: true,
      });
    });

    socket.on(SOCKET_EVENTS.TYPING_STOP, ({ conversationId }: { conversationId: string }) => {
      socket.to(`conversation:${conversationId}`).emit(SOCKET_EVENTS.USER_TYPING, {
        conversationId,
        userId,
        displayName: user.displayName,
        isTyping: false,
      });
    });

    // --------------------------------------------------------------------------
    // 7. READ RECEIPTS & MARK READ
    // --------------------------------------------------------------------------
    socket.on(
      SOCKET_EVENTS.MARK_READ,
      async ({ conversationId, messageId }: { conversationId: string; messageId?: string }) => {
        try {
          // Reset unread count for member
          await prisma.conversationMember.updateMany({
            where: { conversationId, userId },
            data: { unreadCount: 0, lastReadMessageId: messageId || undefined },
          });

          if (messageId) {
            await prisma.readReceipt.upsert({
              where: { messageId_userId: { messageId, userId } },
              update: { readAt: new Date() },
              create: { messageId, userId, readAt: new Date() },
            });

            socket.to(`conversation:${conversationId}`).emit(SOCKET_EVENTS.MESSAGE_READ, {
              conversationId,
              messageId,
              userId,
              readAt: new Date().toISOString(),
            });
          }
        } catch (err) {
          console.error('Socket mark_read error:', err);
        }
      }
    );

    // --------------------------------------------------------------------------
    // 8. WEBRTC AUDIO/VIDEO CALL SIGNALING
    // --------------------------------------------------------------------------
    socket.on(
      SOCKET_EVENTS.CALL_INITIATE,
      ({
        calleeId,
        conversationId,
        callType,
      }: {
        calleeId: string;
        conversationId: string;
        callType: 'AUDIO' | 'VIDEO';
      }) => {
        const callId = `call_${Date.now()}_${userId}`;
        io.to(`user:${calleeId}`).emit(SOCKET_EVENTS.CALL_INCOMING, {
          callId,
          conversationId,
          caller: {
            id: user.id,
            displayName: user.displayName,
            username: user.username,
            avatarUrl: user.avatarUrl,
          },
          callType,
        });
      }
    );

    socket.on(SOCKET_EVENTS.CALL_ACCEPT, ({ callId, callerId }: { callId: string; callerId: string }) => {
      io.to(`user:${callerId}`).emit(SOCKET_EVENTS.CALL_ACCEPTED, {
        callId,
        calleeId: userId,
      });
    });

    socket.on(SOCKET_EVENTS.CALL_REJECT, ({ callId, callerId }: { callId: string; callerId: string }) => {
      io.to(`user:${callerId}`).emit(SOCKET_EVENTS.CALL_REJECTED, {
        callId,
        calleeId: userId,
      });
    });

    socket.on(SOCKET_EVENTS.CALL_SIGNAL, (payload: any) => {
      const { targetUserId } = payload;
      if (targetUserId) {
        io.to(`user:${targetUserId}`).emit(SOCKET_EVENTS.CALL_SIGNAL, {
          ...payload,
          fromUserId: userId,
        });
      }
    });

    socket.on(SOCKET_EVENTS.CALL_END, ({ callId, targetUserId }: { callId: string; targetUserId?: string }) => {
      if (targetUserId) {
        io.to(`user:${targetUserId}`).emit(SOCKET_EVENTS.CALL_ENDED, { callId });
      }
    });

    // --------------------------------------------------------------------------
    // 9. DISCONNECT
    // --------------------------------------------------------------------------
    socket.on(SOCKET_EVENTS.DISCONNECT, async () => {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: {
            isOnline: false,
            status: 'OFFLINE',
            lastSeenAt: new Date(),
          },
        });

        io.emit(SOCKET_EVENTS.USER_PRESENCE_CHANGED, {
          userId,
          isOnline: false,
          status: 'OFFLINE',
          lastSeenAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Socket disconnect status error:', err);
      }
    });
  });

  return io;
}

function parseCookieToken(cookieHeader: string): string | null {
  const match = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

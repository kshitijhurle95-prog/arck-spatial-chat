import { Router, Response } from 'express';
import { SendMessageSchema, EditMessageSchema, ToggleReactionSchema } from '@nebula/shared';
import { prisma } from '../prisma';
import { authenticate, AuthenticatedRequest } from '../auth';

const router = Router();

// ==============================================================================
// GET MESSAGES IN CONVERSATION (Cursor-based pagination)
// ==============================================================================
router.get('/:conversationId', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.user!.id;
    const limit = Math.min(parseInt(req.query.limit as string || '50', 10), 100);
    const cursor = req.query.cursor as string | undefined;

    // Verify membership
    const membership = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: currentUserId,
        },
      },
    });

    if (!membership) {
      res.status(403).json({ error: 'Not a member of this conversation.' });
      return;
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      take: limit,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: {
            id: true,
            email: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            status: true,
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            sender: {
              select: {
                displayName: true,
                username: true,
              },
            },
          },
        },
        attachments: true,
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
              },
            },
          },
        },
        readReceipts: {
          include: {
            user: {
              select: {
                displayName: true,
                avatarUrl: true,
              },
            },
          },
        },
        bookmarks: {
          where: { userId: currentUserId },
        },
      },
    });

    // Reset unread count for current user
    if (membership.unreadCount > 0) {
      await prisma.conversationMember.update({
        where: { id: membership.id },
        data: { unreadCount: 0 },
      });
    }

    // Format reactions grouped by emoji
    const formatted = messages.reverse().map((msg) => {
      const reactionMap = new Map<string, { emoji: string; count: number; users: Array<any>; hasReacted: boolean }>();

      msg.reactions.forEach((r) => {
        if (!reactionMap.has(r.emoji)) {
          reactionMap.set(r.emoji, {
            emoji: r.emoji,
            count: 0,
            users: [],
            hasReacted: false,
          });
        }
        const item = reactionMap.get(r.emoji)!;
        item.count += 1;
        item.users.push(r.user);
        if (r.userId === currentUserId) {
          item.hasReacted = true;
        }
      });

      return {
        id: msg.id,
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        sender: msg.sender,
        content: msg.isDeleted ? 'This message was deleted.' : msg.content,
        type: msg.type,
        idempotencyKey: msg.idempotencyKey,
        replyToId: msg.replyToId,
        replyTo: msg.replyTo,
        isEdited: msg.isEdited,
        editedAt: msg.editedAt?.toISOString() || null,
        isDeleted: msg.isDeleted,
        deletedAt: msg.deletedAt?.toISOString() || null,
        isPinned: msg.isPinned,
        pinnedAt: msg.pinnedAt?.toISOString() || null,
        pinnedBy: msg.pinnedBy,
        isBookmarked: msg.bookmarks.length > 0,
        attachments: msg.attachments,
        reactions: Array.from(reactionMap.values()),
        readReceipts: msg.readReceipts.map((rr) => ({
          userId: rr.userId,
          readAt: rr.readAt.toISOString(),
          user: rr.user,
        })),
        createdAt: msg.createdAt.toISOString(),
      };
    });

    res.json({
      messages: formatted,
      nextCursor: messages.length === limit ? messages[messages.length - 1].id : null,
    });
  } catch (error) {
    console.error('Fetch messages error:', error);
    res.status(500).json({ error: 'Failed to fetch messages.' });
  }
});

// ==============================================================================
// EDIT MESSAGE
// ==============================================================================
router.patch('/:id', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUserId = req.user!.id;

    const parseResult = EditMessageSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Invalid message content.' });
      return;
    }

    const message = await prisma.message.findUnique({
      where: { id },
    });

    if (!message) {
      res.status(404).json({ error: 'Message not found.' });
      return;
    }

    if (message.senderId !== currentUserId) {
      res.status(403).json({ error: 'Forbidden: only the author may edit this message.' });
      return;
    }

    if (message.isDeleted) {
      res.status(400).json({ error: 'Cannot edit a deleted message.' });
      return;
    }

    const updated = await prisma.message.update({
      where: { id },
      data: {
        content: parseResult.data.content,
        isEdited: true,
        editedAt: new Date(),
      },
    });

    res.json({ message: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to edit message.' });
  }
});

// ==============================================================================
// DELETE MESSAGE (Soft delete)
// ==============================================================================
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const currentUserId = req.user!.id;

    const message = await prisma.message.findUnique({
      where: { id },
      include: {
        conversation: {
          include: {
            members: {
              where: { userId: currentUserId },
            },
          },
        },
      },
    });

    if (!message) {
      res.status(404).json({ error: 'Message not found.' });
      return;
    }

    const userMembership = message.conversation.members[0];
    const isAuthor = message.senderId === currentUserId;
    const isAdmin = userMembership && (userMembership.role === 'OWNER' || userMembership.role === 'ADMIN');

    if (!isAuthor && !isAdmin) {
      res.status(403).json({ error: 'Permission denied to delete message.' });
      return;
    }

    const updated = await prisma.message.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        content: 'This message was deleted.',
      },
    });

    res.json({ message: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete message.' });
  }
});

// ==============================================================================
// TOGGLE REACTION
// ==============================================================================
router.post('/:id/reactions', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id: messageId } = req.params;
    const currentUserId = req.user!.id;

    const parseResult = ToggleReactionSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Emoji is required.' });
      return;
    }

    const { emoji } = parseResult.data;

    // Check existing
    const existing = await prisma.messageReaction.findUnique({
      where: {
        messageId_userId_emoji: {
          messageId,
          userId: currentUserId,
          emoji,
        },
      },
    });

    if (existing) {
      await prisma.messageReaction.delete({
        where: { id: existing.id },
      });
      res.json({ action: 'removed', emoji });
    } else {
      await prisma.messageReaction.create({
        data: {
          messageId,
          userId: currentUserId,
          emoji,
        },
      });
      res.json({ action: 'added', emoji });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle reaction.' });
  }
});

// ==============================================================================
// PIN / UNPIN MESSAGE
// ==============================================================================
router.post('/:id/pin', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id: messageId } = req.params;
    const currentUserId = req.user!.id;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      res.status(404).json({ error: 'Message not found.' });
      return;
    }

    const isPinned = !message.isPinned;
    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        isPinned,
        pinnedAt: isPinned ? new Date() : null,
        pinnedBy: isPinned ? currentUserId : null,
      },
    });

    res.json({ isPinned: updated.isPinned, message: updated });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle pin state.' });
  }
});

// ==============================================================================
// BOOKMARK / SAVED MESSAGE
// ==============================================================================
router.post('/:id/bookmark', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id: messageId } = req.params;
    const currentUserId = req.user!.id;

    const existing = await prisma.messageBookmark.findUnique({
      where: {
        messageId_userId: {
          messageId,
          userId: currentUserId,
        },
      },
    });

    if (existing) {
      await prisma.messageBookmark.delete({
        where: { id: existing.id },
      });
      res.json({ isBookmarked: false });
    } else {
      await prisma.messageBookmark.create({
        data: {
          messageId,
          userId: currentUserId,
        },
      });
      res.json({ isBookmarked: true });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle bookmark.' });
  }
});

// ==============================================================================
// GET SAVED / BOOKMARKED MESSAGES
// ==============================================================================
router.get('/bookmarks/all', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user!.id;

    const bookmarks = await prisma.messageBookmark.findMany({
      where: { userId: currentUserId },
      orderBy: { createdAt: 'desc' },
      include: {
        message: {
          include: {
            sender: {
              select: { id: true, displayName: true, username: true, avatarUrl: true },
            },
            conversation: {
              select: { id: true, name: true, type: true },
            },
            attachments: true,
          },
        },
      },
    });

    res.json({
      bookmarks: bookmarks.map((b) => ({
        id: b.id,
        createdAt: b.createdAt.toISOString(),
        message: b.message,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve saved messages.' });
  }
});

export default router;

import { Router, Response } from 'express';
import { CreateDirectConversationSchema, CreateGroupConversationSchema, UpdateGroupSchema, AddGroupMemberSchema } from '@nebula/shared';
import { prisma } from '../prisma';
import { authenticate, AuthenticatedRequest } from '../auth';

const router = Router();

// ==============================================================================
// LIST CONVERSATIONS FOR CURRENT USER
// ==============================================================================
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.user!.id;

    // Fetch conversation memberships for current user
    const memberships = await prisma.conversationMember.findMany({
      where: { userId: currentUserId },
      include: {
        conversation: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    username: true,
                    displayName: true,
                    avatarUrl: true,
                    bio: true,
                    status: true,
                    isOnline: true,
                    lastSeenAt: true,
                  },
                },
              },
            },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                sender: {
                  select: {
                    id: true,
                    displayName: true,
                    username: true,
                  },
                },
                attachments: true,
              },
            },
          },
        },
      },
      orderBy: {
        conversation: {
          lastMessageAt: 'desc',
        },
      },
    });

    const conversations = memberships.map((m) => {
      const conv = m.conversation;
      const lastMsg = conv.messages[0] || null;

      return {
        id: conv.id,
        type: conv.type,
        name: conv.name,
        description: conv.description,
        avatarUrl: conv.avatarUrl,
        createdAt: conv.createdAt.toISOString(),
        updatedAt: conv.updatedAt.toISOString(),
        lastMessageAt: conv.lastMessageAt?.toISOString() || null,
        isPinned: m.isPinned,
        isMuted: m.isMuted,
        isArchived: m.isArchived,
        unreadCount: m.unreadCount,
        myRole: m.role,
        members: conv.members.map((member) => ({
          id: member.id,
          userId: member.userId,
          conversationId: member.conversationId,
          role: member.role,
          joinedAt: member.joinedAt.toISOString(),
          isMuted: member.isMuted,
          isPinned: member.isPinned,
          isArchived: member.isArchived,
          unreadCount: member.unreadCount,
          user: {
            ...member.user,
            lastSeenAt: member.user.lastSeenAt?.toISOString() || null,
          },
        })),
        lastMessage: lastMsg
          ? {
              id: lastMsg.id,
              conversationId: lastMsg.conversationId,
              senderId: lastMsg.senderId,
              sender: lastMsg.sender,
              content: lastMsg.content,
              type: lastMsg.type,
              createdAt: lastMsg.createdAt.toISOString(),
              isEdited: lastMsg.isEdited,
              isDeleted: lastMsg.isDeleted,
              attachments: lastMsg.attachments,
            }
          : null,
      };
    });

    res.json({ conversations });
  } catch (error) {
    console.error('List conversations error:', error);
    res.status(500).json({ error: 'Failed to retrieve conversation list.' });
  }
});

// ==============================================================================
// GET OR CREATE DIRECT CONVERSATION
// ==============================================================================
router.post('/direct', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parseResult = CreateDirectConversationSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Recipient ID is required.' });
      return;
    }

    const currentUserId = req.user!.id;
    const { recipientId } = parseResult.data;

    if (recipientId === currentUserId) {
      res.status(400).json({ error: 'Cannot create a direct conversation with yourself.' });
      return;
    }

    // Verify recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
    });
    if (!recipient) {
      res.status(404).json({ error: 'Recipient user not found.' });
      return;
    }

    // Check if direct conversation already exists between these 2 users
    const existing = await prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',
        AND: [
          { members: { some: { userId: currentUserId } } },
          { members: { some: { userId: recipientId } } },
        ],
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                status: true,
                isOnline: true,
                lastSeenAt: true,
              },
            },
          },
        },
      },
    });

    if (existing) {
      res.json({ conversation: existing });
      return;
    }

    // Create new direct conversation
    const newConv = await prisma.conversation.create({
      data: {
        type: 'DIRECT',
        lastMessageAt: new Date(),
        members: {
          create: [
            { userId: currentUserId, role: 'MEMBER' },
            { userId: recipientId, role: 'MEMBER' },
          ],
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                status: true,
                isOnline: true,
                lastSeenAt: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json({ conversation: newConv });
  } catch (error) {
    console.error('Create direct conversation error:', error);
    res.status(500).json({ error: 'Failed to initialize direct conversation.' });
  }
});

// ==============================================================================
// CREATE GROUP CONVERSATION
// ==============================================================================
router.post('/group', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parseResult = CreateGroupConversationSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const currentUserId = req.user!.id;
    const { name, description, memberIds, avatarUrl } = parseResult.data;

    // Filter out current user ID from invited list and deduplicate
    const uniqueMemberIds = Array.from(new Set(memberIds.filter((id) => id !== currentUserId)));

    const newGroup = await prisma.conversation.create({
      data: {
        type: 'GROUP',
        name,
        description,
        avatarUrl,
        lastMessageAt: new Date(),
        members: {
          create: [
            { userId: currentUserId, role: 'OWNER' },
            ...uniqueMemberIds.map((userId) => ({
              userId,
              role: 'MEMBER',
            })),
          ],
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                status: true,
                isOnline: true,
                lastSeenAt: true,
              },
            },
          },
        },
      },
    });

    // Create system message announcing group creation
    await prisma.message.create({
      data: {
        conversationId: newGroup.id,
        senderId: currentUserId,
        content: `established the communication frequency "${name}".`,
        type: 'SYSTEM',
      },
    });

    res.status(201).json({ conversation: newGroup });
  } catch (error) {
    console.error('Create group error:', error);
    res.status(500).json({ error: 'Failed to create group.' });
  }
});

// ==============================================================================
// GET CONVERSATION DETAILS (Members, Media, Documents, Pins)
// ==============================================================================
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const conversationId = req.params.id;
    const currentUserId = req.user!.id;

    // Verify membership
    const memberRecord = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: currentUserId,
        },
      },
    });

    if (!memberRecord) {
      res.status(403).json({ error: 'Access denied: not a member of this conversation.' });
      return;
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                bio: true,
                status: true,
                isOnline: true,
                lastSeenAt: true,
              },
            },
          },
        },
      },
    });

    if (!conversation) {
      res.status(404).json({ error: 'Conversation not found.' });
      return;
    }

    // Pinned messages
    const pinnedMessages = await prisma.message.findMany({
      where: {
        conversationId,
        isPinned: true,
        isDeleted: false,
      },
      include: {
        sender: {
          select: { id: true, displayName: true, username: true, avatarUrl: true },
        },
        attachments: true,
      },
      orderBy: { pinnedAt: 'desc' },
    });

    // Shared media (images/videos)
    const mediaAttachments = await prisma.attachment.findMany({
      where: {
        message: {
          conversationId,
          isDeleted: false,
        },
        mimeType: {
          startsWith: 'image/',
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    // Shared files / documents
    const docAttachments = await prisma.attachment.findMany({
      where: {
        message: {
          conversationId,
          isDeleted: false,
        },
        NOT: {
          mimeType: {
            startsWith: 'image/',
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({
      conversation,
      pinnedMessages,
      sharedMedia: mediaAttachments,
      sharedDocs: docAttachments,
      myMembership: memberRecord,
    });
  } catch (error) {
    console.error('Get conversation details error:', error);
    res.status(500).json({ error: 'Failed to retrieve conversation details.' });
  }
});

// ==============================================================================
// PIN / UNPIN CONVERSATION
// ==============================================================================
router.patch('/:id/pin', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const conversationId = req.params.id;
    const currentUserId = req.user!.id;

    const member = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId: currentUserId },
      },
    });

    if (!member) {
      res.status(404).json({ error: 'Membership not found.' });
      return;
    }

    const updated = await prisma.conversationMember.update({
      where: { id: member.id },
      data: { isPinned: !member.isPinned },
    });

    res.json({ isPinned: updated.isPinned });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle conversation pin.' });
  }
});

// ==============================================================================
// MUTE / UNMUTE CONVERSATION
// ==============================================================================
router.patch('/:id/mute', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const conversationId = req.params.id;
    const currentUserId = req.user!.id;

    const member = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId: currentUserId },
      },
    });

    if (!member) {
      res.status(404).json({ error: 'Membership not found.' });
      return;
    }

    const updated = await prisma.conversationMember.update({
      where: { id: member.id },
      data: { isMuted: !member.isMuted },
    });

    res.json({ isMuted: updated.isMuted });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle conversation mute.' });
  }
});

// ==============================================================================
// ARCHIVE / UNARCHIVE CONVERSATION
// ==============================================================================
router.patch('/:id/archive', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const conversationId = req.params.id;
    const currentUserId = req.user!.id;

    const member = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId: currentUserId },
      },
    });

    if (!member) {
      res.status(404).json({ error: 'Membership not found.' });
      return;
    }

    const updated = await prisma.conversationMember.update({
      where: { id: member.id },
      data: { isArchived: !member.isArchived },
    });

    res.json({ isArchived: updated.isArchived });
  } catch (error) {
    res.status(500).json({ error: 'Failed to toggle conversation archive.' });
  }
});

// ==============================================================================
// ADD MEMBER TO GROUP
// ==============================================================================
router.post('/:id/members', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const conversationId = req.params.id;
    const currentUserId = req.user!.id;
    const parseResult = AddGroupMemberSchema.safeParse(req.body);

    if (!parseResult.success) {
      res.status(400).json({ error: 'User ID is required.' });
      return;
    }

    const { userId, role } = parseResult.data;

    // Check caller is admin/owner
    const callerMember = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId: currentUserId } },
    });

    if (!callerMember || (callerMember.role !== 'OWNER' && callerMember.role !== 'ADMIN')) {
      res.status(403).json({ error: 'Only group administrators can add new members.' });
      return;
    }

    // Add member
    const newMember = await prisma.conversationMember.upsert({
      where: { conversationId_userId: { conversationId, userId } },
      update: { role },
      create: { conversationId, userId, role },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            displayName: true,
            avatarUrl: true,
            status: true,
            isOnline: true,
            lastSeenAt: true,
          },
        },
      },
    });

    // Create system message
    await prisma.message.create({
      data: {
        conversationId,
        senderId: currentUserId,
        content: `added ${newMember.user.displayName} to the channel.`,
        type: 'SYSTEM',
      },
    });

    res.status(201).json({ member: newMember });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add member to group.' });
  }
});

// ==============================================================================
// REMOVE MEMBER / LEAVE GROUP
// ==============================================================================
router.delete('/:id/members/:userId', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const conversationId = req.params.id;
    const targetUserId = req.params.userId;
    const currentUserId = req.user!.id;

    // If leaving own membership
    if (targetUserId === currentUserId) {
      await prisma.conversationMember.deleteMany({
        where: { conversationId, userId: currentUserId },
      });

      await prisma.message.create({
        data: {
          conversationId,
          senderId: currentUserId,
          content: 'left the frequency.',
          type: 'SYSTEM',
        },
      });

      res.json({ message: 'Successfully departed from group.' });
      return;
    }

    // Otherwise caller must be owner or admin
    const caller = await prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId, userId: currentUserId } },
    });

    if (!caller || (caller.role !== 'OWNER' && caller.role !== 'ADMIN')) {
      res.status(403).json({ error: 'Permission denied: administrator privileges required.' });
      return;
    }

    await prisma.conversationMember.deleteMany({
      where: { conversationId, userId: targetUserId },
    });

    res.json({ message: 'Member removed from group.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove member from group.' });
  }
});

export default router;

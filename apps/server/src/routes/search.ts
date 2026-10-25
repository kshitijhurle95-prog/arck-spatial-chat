import { Router, Response } from 'express';
import { SearchQuerySchema } from '@nebula/shared';
import { prisma } from '../prisma';
import { authenticate, AuthenticatedRequest } from '../auth';

const router = Router();

// ==============================================================================
// GLOBAL SEARCH
// ==============================================================================
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parseResult = SearchQuerySchema.safeParse(req.query);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Search query parameter is required.' });
      return;
    }

    const { query, conversationId, type } = parseResult.data;
    const currentUserId = req.user!.id;
    const term = query.trim().toLowerCase();

    // 1. Search People
    let peopleResults: any[] = [];
    if (type === 'all' || type === 'people') {
      peopleResults = await prisma.user.findMany({
        where: {
          id: { not: currentUserId },
          OR: [
            { username: { contains: term } },
            { displayName: { contains: term } },
            { email: { contains: term } },
          ],
        },
        take: 10,
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          bio: true,
          status: true,
          isOnline: true,
        },
      });
    }

    // 2. Search Conversations (where user is a member)
    let convResults: any[] = [];
    if (type === 'all' || type === 'groups') {
      convResults = await prisma.conversation.findMany({
        where: {
          members: { some: { userId: currentUserId } },
          name: { contains: term },
        },
        take: 10,
        select: {
          id: true,
          name: true,
          type: true,
          description: true,
          avatarUrl: true,
          lastMessageAt: true,
        },
      });
    }

    // 3. Search Messages (only in conversations where user is a member)
    let messageResults: any[] = [];
    if (type === 'all' || type === 'messages') {
      messageResults = await prisma.message.findMany({
        where: {
          content: { contains: term },
          isDeleted: false,
          conversationId: conversationId || undefined,
          conversation: {
            members: { some: { userId: currentUserId } },
          },
        },
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: { id: true, displayName: true, username: true, avatarUrl: true },
          },
          conversation: {
            select: { id: true, name: true, type: true },
          },
          attachments: true,
        },
      });
    }

    // 4. Search Files / Attachments
    let fileResults: any[] = [];
    if (type === 'all' || type === 'files') {
      fileResults = await prisma.attachment.findMany({
        where: {
          originalName: { contains: term },
          message: {
            conversation: {
              members: { some: { userId: currentUserId } },
            },
          },
        },
        take: 15,
        orderBy: { createdAt: 'desc' },
        include: {
          message: {
            select: {
              id: true,
              conversationId: true,
              createdAt: true,
            },
          },
        },
      });
    }

    res.json({
      query: term,
      results: {
        people: peopleResults,
        conversations: convResults,
        messages: messageResults,
        files: fileResults,
      },
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search operation failed.' });
  }
});

export default router;

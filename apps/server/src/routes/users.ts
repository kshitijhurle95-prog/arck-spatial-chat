import { Router, Response } from 'express';
import { UpdateProfileSchema, UpdatePreferencesSchema } from '@nebula/shared';
import { prisma } from '../prisma';
import { authenticate, AuthenticatedRequest } from '../auth';

const router = Router();

// ==============================================================================
// SEARCH USERS
// ==============================================================================
router.get('/search', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const query = (req.query.q as string || '').trim().toLowerCase();
    const currentUserId = req.user!.id;

    if (!query) {
      // Return recent contacts or suggestions
      const users = await prisma.user.findMany({
        where: { id: { not: currentUserId } },
        take: 10,
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
      });
      res.json({ users });
      return;
    }

    const users = await prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        OR: [
          { username: { contains: query } },
          { displayName: { contains: query } },
          { email: { contains: query } },
        ],
      },
      take: 20,
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
    });

    res.json({ users });
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ error: 'Failed to search users.' });
  }
});

// ==============================================================================
// UPDATE PROFILE
// ==============================================================================
router.patch('/profile', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parseResult = UpdateProfileSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: parseResult.data,
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
    });

    res.json({ user: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// ==============================================================================
// UPDATE PREFERENCES
// ==============================================================================
router.patch('/preferences', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parseResult = UpdatePreferencesSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const updatedPreferences = await prisma.userPreference.upsert({
      where: { userId: req.user!.id },
      update: parseResult.data,
      create: {
        userId: req.user!.id,
        ...parseResult.data,
      },
    });

    res.json({ preferences: updatedPreferences });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update user preferences.' });
  }
});

// ==============================================================================
// BLOCK USER
// ==============================================================================
router.post('/block/:id', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user!.id;

    if (targetUserId === currentUserId) {
      res.status(400).json({ error: 'Cannot block yourself.' });
      return;
    }

    await prisma.blockedUser.upsert({
      where: {
        blockerId_blockedId: {
          blockerId: currentUserId,
          blockedId: targetUserId,
        },
      },
      update: {},
      create: {
        blockerId: currentUserId,
        blockedId: targetUserId,
      },
    });

    res.json({ message: 'User blocked successfully.' });
  } catch (error) {
    console.error('Block user error:', error);
    res.status(500).json({ error: 'Failed to block user.' });
  }
});

// ==============================================================================
// UNBLOCK USER
// ==============================================================================
router.delete('/block/:id', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user!.id;

    await prisma.blockedUser.deleteMany({
      where: {
        blockerId: currentUserId,
        blockedId: targetUserId,
      },
    });

    res.json({ message: 'User unblocked successfully.' });
  } catch (error) {
    console.error('Unblock user error:', error);
    res.status(500).json({ error: 'Failed to unblock user.' });
  }
});

export default router;

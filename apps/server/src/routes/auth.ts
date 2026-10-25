import { Router, Response } from 'express';
import { RegisterSchema, LoginSchema, DEFAULT_PREFERENCES } from '@nebula/shared';
import { prisma } from '../prisma';
import { hashPassword, comparePassword, generateToken, authenticate, AuthenticatedRequest } from '../auth';

const router = Router();

// ==============================================================================
// REGISTRATION
// ==============================================================================
router.post('/register', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parseResult = RegisterSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { email, username, displayName, password } = parseResult.data;

    // Check existing email
    const existingEmail = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existingEmail) {
      res.status(409).json({ error: 'An account with this email address already exists.' });
      return;
    }

    // Check existing username
    const existingUsername = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });
    if (existingUsername) {
      res.status(409).json({ error: 'This username is already taken. Please choose another.' });
      return;
    }

    const passwordHash = await hashPassword(password);

    // Create user and default preferences in a transaction
    const newUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          username: username.toLowerCase(),
          displayName,
          passwordHash,
          status: 'ONLINE',
          isOnline: true,
          lastSeenAt: new Date(),
        },
      });

      await tx.userPreference.create({
        data: {
          userId: user.id,
          theme: DEFAULT_PREFERENCES.theme,
          density: DEFAULT_PREFERENCES.density,
          animationIntensity: DEFAULT_PREFERENCES.animationIntensity,
          soundEnabled: DEFAULT_PREFERENCES.soundEnabled,
          readReceiptsEnabled: DEFAULT_PREFERENCES.readReceiptsEnabled,
          presencePrivacy: DEFAULT_PREFERENCES.presencePrivacy,
        },
      });

      return user;
    });

    const token = generateToken(newUser.id);

    // Set secure HttpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        displayName: newUser.displayName,
        avatarUrl: newUser.avatarUrl,
        bio: newUser.bio,
        status: newUser.status,
        isOnline: newUser.isOnline,
        lastSeenAt: newUser.lastSeenAt?.toISOString() || null,
      },
      preferences: DEFAULT_PREFERENCES,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during account registration.' });
  }
});

// ==============================================================================
// LOGIN
// ==============================================================================
router.post('/login', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const parseResult = LoginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Validation failed',
        details: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { login, password } = parseResult.data;
    const loginLower = login.toLowerCase();

    // Find by email or username
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ email: loginLower }, { username: loginLower }],
      },
      include: {
        preferences: true,
      },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid username/email or password.' });
      return;
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid username/email or password.' });
      return;
    }

    // Update presence
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isOnline: true,
        status: 'ONLINE',
        lastSeenAt: new Date(),
      },
    });

    const token = generateToken(user.id);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        status: 'ONLINE',
        isOnline: true,
        lastSeenAt: new Date().toISOString(),
      },
      preferences: user.preferences || DEFAULT_PREFERENCES,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login authentication.' });
  }
});

// ==============================================================================
// LOGOUT
// ==============================================================================
router.post('/logout', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (req.user) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: {
          isOnline: false,
          status: 'OFFLINE',
          lastSeenAt: new Date(),
        },
      });
    }

    res.clearCookie('token');
    res.json({ message: 'Successfully logged out.' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Server error during logout.' });
  }
});

// ==============================================================================
// GET CURRENT USER (/me)
// ==============================================================================
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        preferences: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found.' });
      return;
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        status: user.status,
        isOnline: user.isOnline,
        lastSeenAt: user.lastSeenAt?.toISOString() || null,
        createdAt: user.createdAt.toISOString(),
      },
      preferences: user.preferences || DEFAULT_PREFERENCES,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to retrieve current user profile.' });
  }
});

export default router;

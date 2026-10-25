import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../index';
import { prisma } from '../prisma';
import { generateToken } from '../auth';

describe('NEBULA 2046 // Messaging, Permissions & Persistence', () => {
  let alexUser: any;
  let elenaUser: any;
  let alexToken: string;
  let elenaToken: string;
  let directConversation: any;

  beforeAll(async () => {
    alexUser = await prisma.user.findUnique({ where: { username: 'alex_vance' } });
    elenaUser = await prisma.user.findUnique({ where: { username: 'elena_rostova' } });

    expect(alexUser).toBeDefined();
    expect(elenaUser).toBeDefined();

    alexToken = generateToken(alexUser.id);
    elenaToken = generateToken(elenaUser.id);

    directConversation = await prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',
        members: { some: { userId: alexUser.id } },
      },
    });

    expect(directConversation).toBeDefined();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('lists conversations for authenticated user', async () => {
    const res = await request(app)
      .get('/api/conversations')
      .set('Authorization', `Bearer ${alexToken}`);

    expect(res.status).toBe(200);
    expect(res.body.conversations).toBeInstanceOf(Array);
    expect(res.body.conversations.length).toBeGreaterThan(0);
  });

  it('retrieves paginated message history for a conversation', async () => {
    const res = await request(app)
      .get(`/api/messages/${directConversation.id}`)
      .set('Authorization', `Bearer ${alexToken}`);

    expect(res.status).toBe(200);
    expect(res.body.messages).toBeInstanceOf(Array);
    expect(res.body.messages.length).toBeGreaterThan(0);

    const firstMsg = res.body.messages[0];
    expect(firstMsg.content).toBeDefined();
    expect(firstMsg.sender).toBeDefined();
  });

  it('enforces access control: non-members cannot read private conversation history', async () => {
    // Create an isolated conversation between Elena and a third party or dummy
    const privateConv = await prisma.conversation.create({
      data: {
        type: 'DIRECT',
        members: {
          create: [{ userId: elenaUser.id, role: 'MEMBER' }],
        },
      },
    });

    // Alex attempts to read Elena's private conversation without membership
    const res = await request(app)
      .get(`/api/messages/${privateConv.id}`)
      .set('Authorization', `Bearer ${alexToken}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Not a member');

    // Clean up
    await prisma.conversation.delete({ where: { id: privateConv.id } });
  });

  it('allows message bookmarking (saved messages)', async () => {
    const messages = await prisma.message.findMany({
      where: { conversationId: directConversation.id },
      take: 1,
    });
    const targetMsg = messages[0];

    // Clean any prior bookmark for idempotent test
    await prisma.messageBookmark.deleteMany({
      where: { messageId: targetMsg.id, userId: alexUser.id },
    });

    const bookmarkRes = await request(app)
      .post(`/api/messages/${targetMsg.id}/bookmark`)
      .set('Authorization', `Bearer ${alexToken}`);

    expect(bookmarkRes.status).toBe(200);
    expect(bookmarkRes.body.isBookmarked).toBe(true);

    const listRes = await request(app)
      .get('/api/messages/bookmarks/all')
      .set('Authorization', `Bearer ${alexToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.bookmarks.length).toBeGreaterThan(0);
  });

  it('allows message reaction toggling', async () => {
    const messages = await prisma.message.findMany({
      where: { conversationId: directConversation.id },
      take: 1,
    });
    const targetMsg = messages[0];

    // Clean any prior reaction for idempotent test
    await prisma.messageReaction.deleteMany({
      where: { messageId: targetMsg.id, userId: alexUser.id, emoji: '🛸' },
    });

    const reactRes = await request(app)
      .post(`/api/messages/${targetMsg.id}/reactions`)
      .set('Authorization', `Bearer ${alexToken}`)
      .send({ emoji: '🛸' });

    expect(reactRes.status).toBe(200);
    expect(reactRes.body.action).toBe('added');
  });

  it('executes global search across messages, contacts, and channels', async () => {
    const res = await request(app)
      .get('/api/search?query=telemetry')
      .set('Authorization', `Bearer ${alexToken}`);

    expect(res.status).toBe(200);
    expect(res.body.results).toBeDefined();
    expect(res.body.results.messages).toBeInstanceOf(Array);
    expect(res.body.results.messages.length).toBeGreaterThan(0);
  });
});

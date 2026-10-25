import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { io as Client, Socket } from 'socket.io-client';
import { server } from '../index';
import { prisma } from '../prisma';
import { generateToken } from '../auth';
import { SOCKET_EVENTS } from '@nebula/shared';

describe('NEBULA 2046 // Real-Time Socket.IO Multi-Client Engine', () => {
  let serverPort: number;
  let socketAlex: Socket;
  let socketElena: Socket;
  let alexUser: any;
  let elenaUser: any;
  let directConv: any;

  beforeAll(async () => {
    // Start existing server on available random port
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        serverPort = (server.address() as any).port;
        resolve();
      });
    });

    alexUser = await prisma.user.findUnique({ where: { username: 'alex_vance' } });
    elenaUser = await prisma.user.findUnique({ where: { username: 'elena_rostova' } });

    directConv = await prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',
        members: { some: { userId: alexUser.id } },
      },
    });

    const alexToken = generateToken(alexUser.id);
    const elenaToken = generateToken(elenaUser.id);

    // Connect Client 1: Alex Vance
    socketAlex = Client(`http://localhost:${serverPort}`, {
      auth: { token: alexToken },
      transports: ['websocket'],
    });

    // Connect Client 2: Elena Rostova
    socketElena = Client(`http://localhost:${serverPort}`, {
      auth: { token: elenaToken },
      transports: ['websocket'],
    });

    await Promise.all([
      new Promise<void>((resolve) => socketAlex.on('connect', resolve)),
      new Promise<void>((resolve) => socketElena.on('connect', resolve)),
    ]);

    // Explicitly join conversation room
    socketAlex.emit(SOCKET_EVENTS.JOIN_CONVERSATION, { conversationId: directConv.id });
    socketElena.emit(SOCKET_EVENTS.JOIN_CONVERSATION, { conversationId: directConv.id });

    // Allow rooms to synchronize
    await new Promise((r) => setTimeout(r, 100));
  });

  afterAll(async () => {
    if (socketAlex) socketAlex.disconnect();
    if (socketElena) socketElena.disconnect();
    if (server.listening) {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
    await prisma.$disconnect();
  });

  it('both independent authenticated clients connect successfully', () => {
    expect(socketAlex.connected).toBe(true);
    expect(socketElena.connected).toBe(true);
  });

  it('delivers real-time message from Alex to Elena with server acknowledgment callback', async () => {
    const testContent = `[Quantum Transmission ID: ${Date.now()}] Real-time mesh operational.`;

    // Setup listener on Elena's socket
    const receivedPromise = new Promise<any>((resolve) => {
      socketElena.on(SOCKET_EVENTS.MESSAGE_RECEIVED, (data) => {
        if (data.content === testContent) {
          resolve(data);
        }
      });
    });

    // Send message from Alex's socket
    const ackPromise = new Promise<any>((resolve) => {
      socketAlex.emit(
        SOCKET_EVENTS.SEND_MESSAGE,
        {
          conversationId: directConv.id,
          content: testContent,
          type: 'TEXT',
          idempotencyKey: `idemp_${Date.now()}`,
        },
        (ack: any) => resolve(ack)
      );
    });

    const [ackResponse, receivedMessage] = await Promise.all([ackPromise, receivedPromise]);

    expect(ackResponse.success).toBe(true);
    expect(ackResponse.message.content).toBe(testContent);

    expect(receivedMessage).toBeDefined();
    expect(receivedMessage.senderId).toBe(alexUser.id);
    expect(receivedMessage.content).toBe(testContent);
  });

  it('broadcasts typing indicator from Alex to Elena', async () => {
    const typingPromise = new Promise<any>((resolve) => {
      socketElena.on(SOCKET_EVENTS.USER_TYPING, (data) => {
        if (data.conversationId === directConv.id && data.userId === alexUser.id) {
          resolve(data);
        }
      });
    });

    socketAlex.emit(SOCKET_EVENTS.TYPING_START, {
      conversationId: directConv.id,
    });

    const typingData = await typingPromise;
    expect(typingData.isTyping).toBe(true);
    expect(typingData.displayName).toBe('Alex Vance');
  });

  it('broadcasts real-time emoji reactions between clients', async () => {
    const messages = await prisma.message.findMany({
      where: { conversationId: directConv.id },
      take: 1,
    });
    const targetMsg = messages[0];

    const reactionPromise = new Promise<any>((resolve) => {
      socketElena.on(SOCKET_EVENTS.REACTION_UPDATED, (data) => {
        if (data.messageId === targetMsg.id) {
          resolve(data);
        }
      });
    });

    socketAlex.emit(SOCKET_EVENTS.TOGGLE_REACTION, {
      messageId: targetMsg.id,
      emoji: '🌌',
    });

    const reactionData = await reactionPromise;
    expect(reactionData.messageId).toBe(targetMsg.id);
    expect(reactionData.reactions).toBeInstanceOf(Array);
  });
});

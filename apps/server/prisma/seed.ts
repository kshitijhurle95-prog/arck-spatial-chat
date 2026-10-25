import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌌 Seeding ARCK Database with Mockup Data...');

  // Clear existing data for clean idempotent seed
  await prisma.outboxEvent.deleteMany();
  await prisma.messageBookmark.deleteMany();
  await prisma.readReceipt.deleteMany();
  await prisma.messageReaction.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationMember.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.session.deleteMany();
  await prisma.userPreference.deleteMany();
  await prisma.blockedUser.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('Nebula2046!', 10);

  // 1. Core User: Alex Vance (The active user)
  const alex = await prisma.user.create({
    data: {
      email: 'alex.vance@nebula.io',
      username: 'alex_vance',
      displayName: 'Alex Vance',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      bio: 'Spatial Computing Lead & Architectural Designer. ARCK.',
      status: 'ONLINE',
      isOnline: true,
      lastSeenAt: new Date(),
      preferences: {
        create: {
          theme: 'light',
          density: 'comfortable',
          animationIntensity: 'expressive',
          soundEnabled: true,
          readReceiptsEnabled: true,
          presencePrivacy: true,
        },
      },
    },
  });

  // 2. Elena Rostova
  const elena = await prisma.user.create({
    data: {
      email: 'elena.rostova@nebula.io',
      username: 'elena_rostova',
      displayName: 'Elena Rostova',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
      bio: 'Head of Spatial Architecture & Real Estate Development.',
      status: 'ONLINE',
      isOnline: true,
      lastSeenAt: new Date(),
      preferences: {
        create: {
          theme: 'light',
          density: 'comfortable',
          animationIntensity: 'expressive',
          soundEnabled: true,
          readReceiptsEnabled: true,
          presencePrivacy: true,
        },
      },
    },
  });

  // 3. Sarah Jenkins
  const sarah = await prisma.user.create({
    data: {
      email: 'sarah.jenkins@nebula.io',
      username: 'sarah_jenkins',
      displayName: 'Sarah Jenkins',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      bio: 'Lead Design Strategist.',
      status: 'ONLINE',
      isOnline: true,
      lastSeenAt: new Date(),
    },
  });

  // 4. Marcus Chen
  const marcus = await prisma.user.create({
    data: {
      email: 'marcus.chen@nebula.io',
      username: 'marcus_chen',
      displayName: 'Marcus Chen',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      bio: 'Audio Systems Engineer.',
      status: 'AWAY',
      isOnline: true,
      lastSeenAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    },
  });

  // 5. Sophia Miller
  const sophia = await prisma.user.create({
    data: {
      email: 'sophia.miller@nebula.io',
      username: 'sophia_miller',
      displayName: 'Sophia Miller',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      bio: 'Product Operations Director.',
      status: 'OFFLINE',
      isOnline: false,
      lastSeenAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    },
  });

  // 6. David Kim
  const david = await prisma.user.create({
    data: {
      email: 'david.kim@nebula.io',
      username: 'david_kim',
      displayName: 'David Kim',
      passwordHash,
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      bio: 'Executive Partner.',
      status: 'OFFLINE',
      isOnline: false,
      lastSeenAt: new Date(Date.now() - 1000 * 60 * 60 * 48),
    },
  });

  console.log('✅ Created users: Alex, Elena, Sarah, Marcus, Sophia, David');

  const now = new Date();
  const createPastDate = (minutesAgo: number) => new Date(now.getTime() - minutesAgo * 60 * 1000);

  // CONVERSATION 1: Direct with Elena Rostova (Matching Mockup exactly)
  const elenaConv = await prisma.conversation.create({
    data: {
      type: 'DIRECT',
      lastMessageAt: createPastDate(2),
      members: {
        create: [
          { userId: alex.id, role: 'MEMBER', isPinned: true },
          { userId: elena.id, role: 'MEMBER' },
        ],
      },
    },
  });

  // Message 1 (Elena): "Hey! Have you seen the new place we discussed?" (10:20 AM)
  await prisma.message.create({
    data: {
      conversationId: elenaConv.id,
      senderId: elena.id,
      content: 'Hey! Have you seen the new place we discussed?',
      type: 'TEXT',
      createdAt: createPastDate(15),
    },
  });

  // Message 2 (Alex): "Yes! I went there yesterday." (10:21 AM)
  await prisma.message.create({
    data: {
      conversationId: elenaConv.id,
      senderId: alex.id,
      content: 'Yes! I went there yesterday.',
      type: 'TEXT',
      createdAt: createPastDate(14),
    },
  });

  // Message 3 (Alex, Lake Villa Architecture image attachment) (10:21 AM)
  const msgVillaImg = await prisma.message.create({
    data: {
      conversationId: elenaConv.id,
      senderId: alex.id,
      content: 'Here is the lake villa we looked at:',
      type: 'IMAGE',
      createdAt: createPastDate(13),
      attachments: {
        create: {
          filename: 'villa-architecture.jpg',
          originalName: 'Lake Villa Architecture.jpg',
          mimeType: 'image/jpeg',
          size: 2450000,
          url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1000&auto=format&fit=crop&q=80',
          storageKey: 'uploads/villa-architecture.jpg',
        },
      },
    },
  });

  // Message 4 (Elena): "Wow! That looks amazing 😍" (10:22 AM)
  const msgWow = await prisma.message.create({
    data: {
      conversationId: elenaConv.id,
      senderId: elena.id,
      content: 'Wow! That looks amazing 😍',
      type: 'TEXT',
      createdAt: createPastDate(12),
    },
  });

  await prisma.messageReaction.create({
    data: {
      messageId: msgWow.id,
      userId: alex.id,
      emoji: '😍',
    },
  });

  // Message 5 (Elena): "Can you send more photos?" (10:22 AM)
  await prisma.message.create({
    data: {
      conversationId: elenaConv.id,
      senderId: elena.id,
      content: 'Can you send more photos?',
      type: 'TEXT',
      createdAt: createPastDate(11),
    },
  });

  // Message 6 (Alex): "Sure! Here are a few more." (10:23 AM)
  await prisma.message.create({
    data: {
      conversationId: elenaConv.id,
      senderId: alex.id,
      content: 'Sure! Here are a few more.',
      type: 'TEXT',
      createdAt: createPastDate(9),
    },
  });

  // Message 7 (Alex, Grid of photos) (10:23 AM)
  await prisma.message.create({
    data: {
      conversationId: elenaConv.id,
      senderId: alex.id,
      content: 'Interior and panoramic perspective:',
      type: 'IMAGE',
      createdAt: createPastDate(8),
      attachments: {
        create: {
          filename: 'villa-interior.jpg',
          originalName: 'Villa Interior.jpg',
          mimeType: 'image/jpeg',
          size: 3120000,
          url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1000&auto=format&fit=crop&q=80',
          storageKey: 'uploads/villa-interior.jpg',
        },
      },
    },
  });

  // Message 8 (Alex, Villa_Brochure.pdf document) (10:23 AM)
  await prisma.message.create({
    data: {
      conversationId: elenaConv.id,
      senderId: alex.id,
      content: 'Document attached:',
      type: 'FILE',
      createdAt: createPastDate(6),
      attachments: {
        create: {
          filename: 'Villa_Brochure.pdf',
          originalName: 'Villa_Brochure.pdf',
          mimeType: 'application/pdf',
          size: 4404019, // 4.2 MB
          url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          storageKey: 'uploads/Villa_Brochure.pdf',
        },
      },
    },
  });

  // Message 9 (Elena): "This is perfect! Let's plan the visit this weekend." (10:24 AM)
  await prisma.message.create({
    data: {
      conversationId: elenaConv.id,
      senderId: elena.id,
      content: "This is perfect! Let's plan the visit this weekend.",
      type: 'TEXT',
      createdAt: createPastDate(4),
    },
  });

  // Message 10 (Alex): "Great! I'll check my schedule and confirm." (10:24 AM)
  await prisma.message.create({
    data: {
      conversationId: elenaConv.id,
      senderId: alex.id,
      content: "Great! I'll check my schedule and confirm.",
      type: 'TEXT',
      createdAt: createPastDate(2),
    },
  });

  // CONVERSATION 2: Group "Design Team"
  const designGroup = await prisma.conversation.create({
    data: {
      type: 'GROUP',
      name: 'Design Team',
      description: 'Product & Spatial UI/UX Design Team',
      avatarUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
      lastMessageAt: createPastDate(40),
      members: {
        create: [
          { userId: alex.id, role: 'ADMIN', unreadCount: 3 },
          { userId: sarah.id, role: 'OWNER' },
          { userId: elena.id, role: 'MEMBER' },
        ],
      },
    },
  });

  await prisma.message.create({
    data: {
      conversationId: designGroup.id,
      senderId: sarah.id,
      content: 'The new prototype is ready for review. Take a look at the spatial interactions.',
      type: 'TEXT',
      createdAt: createPastDate(40),
    },
  });

  // CONVERSATION 3: Direct Marcus Chen
  const marcusConv = await prisma.conversation.create({
    data: {
      type: 'DIRECT',
      lastMessageAt: createPastDate(120),
      members: {
        create: [
          { userId: alex.id, role: 'MEMBER' },
          { userId: marcus.id, role: 'MEMBER' },
        ],
      },
    },
  });

  await prisma.message.create({
    data: {
      conversationId: marcusConv.id,
      senderId: marcus.id,
      content: 'Voice message (0:45)',
      type: 'VOICE',
      createdAt: createPastDate(120),
    },
  });

  // CONVERSATION 4: Group "Product Launch 2026"
  const launchGroup = await prisma.conversation.create({
    data: {
      type: 'GROUP',
      name: 'Product Launch 2026',
      description: 'ARCK Keynote and Global Mesh Rollout',
      avatarUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=150&auto=format&fit=crop&q=80',
      lastMessageAt: createPastDate(1440 * 2), // 2 days ago
      members: {
        create: [
          { userId: alex.id, role: 'ADMIN', unreadCount: 5 },
          { userId: sophia.id, role: 'OWNER' },
          { userId: marcus.id, role: 'MEMBER' },
        ],
      },
    },
  });

  await prisma.message.create({
    data: {
      conversationId: launchGroup.id,
      senderId: alex.id,
      content: 'We need to finalize the roadmap milestones before Thursday.',
      type: 'TEXT',
      createdAt: createPastDate(1440 * 2),
    },
  });

  // CONVERSATION 5: Direct Sophia Miller
  const sophiaConv = await prisma.conversation.create({
    data: {
      type: 'DIRECT',
      lastMessageAt: createPastDate(1440 * 4), // 4 days ago
      members: {
        create: [
          { userId: alex.id, role: 'MEMBER' },
          { userId: sophia.id, role: 'MEMBER' },
        ],
      },
    },
  });

  await prisma.message.create({
    data: {
      conversationId: sophiaConv.id,
      senderId: sophia.id,
      content: 'Thanks for the feedback! I will update the documents.',
      type: 'TEXT',
      createdAt: createPastDate(1440 * 4),
    },
  });

  // CONVERSATION 6: Direct David Kim
  const davidConv = await prisma.conversation.create({
    data: {
      type: 'DIRECT',
      lastMessageAt: createPastDate(1440 * 6), // 6 days ago
      members: {
        create: [
          { userId: alex.id, role: 'MEMBER' },
          { userId: david.id, role: 'MEMBER' },
        ],
      },
    },
  });

  await prisma.message.create({
    data: {
      conversationId: davidConv.id,
      senderId: david.id,
      content: "Let's catch up tomorrow at 10 AM",
      type: 'TEXT',
      createdAt: createPastDate(1440 * 6),
    },
  });

  console.log('🎉 Mockup database seeding complete! 6 conversations created matching the reference UI.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

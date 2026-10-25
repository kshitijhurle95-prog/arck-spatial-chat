"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌌 Seeding NEBULA 2046 Database...');
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
    const passwordHash = await bcryptjs_1.default.hash('Nebula2046!', 10);
    // 1. Create Users
    const alex = await prisma.user.create({
        data: {
            email: 'alex.vance@nebula.io',
            username: 'alex_vance',
            displayName: 'Alex Vance',
            passwordHash,
            avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            bio: 'Quantum entanglement communications engineer. Deep space telemetry node operator.',
            status: 'ONLINE',
            isOnline: true,
            lastSeenAt: new Date(),
            preferences: {
                create: {
                    theme: 'dark',
                    density: 'comfortable',
                    animationIntensity: 'expressive',
                    soundEnabled: true,
                    readReceiptsEnabled: true,
                    presencePrivacy: true,
                },
            },
        },
    });
    const elena = await prisma.user.create({
        data: {
            email: 'elena.rostova@nebula.io',
            username: 'elena_rostova',
            displayName: 'Elena Rostova',
            passwordHash,
            avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
            bio: 'Commander, Orbital Station 7. Overseeing lunar relay synchronizations.',
            status: 'ONLINE',
            isOnline: true,
            lastSeenAt: new Date(),
            preferences: {
                create: {
                    theme: 'dark',
                    density: 'comfortable',
                    animationIntensity: 'expressive',
                    soundEnabled: true,
                    readReceiptsEnabled: true,
                    presencePrivacy: true,
                },
            },
        },
    });
    const kai = await prisma.user.create({
        data: {
            email: 'kai.chen@nebula.io',
            username: 'kai_chen',
            displayName: 'Kai Chen',
            passwordHash,
            avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
            bio: 'Neural interface architect. Tuning 3D spatial field dynamics.',
            status: 'AWAY',
            isOnline: true,
            lastSeenAt: new Date(Date.now() - 1000 * 60 * 15),
            preferences: {
                create: {
                    theme: 'dark',
                    density: 'comfortable',
                    animationIntensity: 'expressive',
                    soundEnabled: true,
                    readReceiptsEnabled: true,
                    presencePrivacy: true,
                },
            },
        },
    });
    console.log('✅ Created 3 core users: alex_vance, elena_rostova, kai_chen');
    // 2. Direct Conversation between Alex and Elena
    const directConv = await prisma.conversation.create({
        data: {
            type: 'DIRECT',
            lastMessageAt: new Date(),
            members: {
                create: [
                    { userId: alex.id, role: 'MEMBER', isPinned: true },
                    { userId: elena.id, role: 'MEMBER' },
                ],
            },
        },
    });
    const msg1 = await prisma.message.create({
        data: {
            conversationId: directConv.id,
            senderId: elena.id,
            content: 'Alex, orbital node 04 has established lock with the lunar relay array. Telemetry jitter is below 0.4ms.',
            type: 'TEXT',
            createdAt: new Date(Date.now() - 1000 * 60 * 20),
        },
    });
    const msg2 = await prisma.message.create({
        data: {
            conversationId: directConv.id,
            senderId: alex.id,
            content: 'Confirmed, Commander. I have synchronized the quantum key distribution channel. Encryption handshake completed.',
            type: 'TEXT',
            replyToId: msg1.id,
            createdAt: new Date(Date.now() - 1000 * 60 * 18),
        },
    });
    const msg3 = await prisma.message.create({
        data: {
            conversationId: directConv.id,
            senderId: elena.id,
            content: 'Excellent. Please monitor the thermal dissipation on array theta during peak solar flare exposure.',
            type: 'TEXT',
            isPinned: true,
            pinnedAt: new Date(),
            pinnedBy: elena.id,
            createdAt: new Date(Date.now() - 1000 * 60 * 12),
        },
    });
    const msg4 = await prisma.message.create({
        data: {
            conversationId: directConv.id,
            senderId: alex.id,
            content: 'Will do. I will run automated telemetry probes and report any delta over 1.2%.',
            type: 'TEXT',
            createdAt: new Date(Date.now() - 1000 * 60 * 5),
        },
    });
    // Add reactions
    await prisma.messageReaction.create({
        data: {
            messageId: msg3.id,
            userId: alex.id,
            emoji: '🛰️',
        },
    });
    await prisma.messageReaction.create({
        data: {
            messageId: msg4.id,
            userId: elena.id,
            emoji: '⚡',
        },
    });
    // 3. Group Conversation: Project Helios // Orbit Station 7
    const groupConv = await prisma.conversation.create({
        data: {
            type: 'GROUP',
            name: 'Project Helios // Orbit Station 7',
            description: 'Primary engineering channel for Orbital Station 7 quantum comms and spatial computing systems.',
            avatarUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=150&auto=format&fit=crop&q=80',
            lastMessageAt: new Date(),
            members: {
                create: [
                    { userId: elena.id, role: 'OWNER' },
                    { userId: alex.id, role: 'ADMIN', isPinned: true },
                    { userId: kai.id, role: 'MEMBER' },
                ],
            },
        },
    });
    await prisma.message.create({
        data: {
            conversationId: groupConv.id,
            senderId: elena.id,
            content: 'established the secure frequency channel "Project Helios // Orbit Station 7".',
            type: 'SYSTEM',
            createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
        },
    });
    const groupMsg1 = await prisma.message.create({
        data: {
            conversationId: groupConv.id,
            senderId: elena.id,
            content: 'Team, welcome to the Helios orbital sync frequency. All spatial audio, video signaling, and message streams are now active over the NEBULA quantum mesh.',
            type: 'TEXT',
            isPinned: true,
            pinnedAt: new Date(),
            pinnedBy: elena.id,
            createdAt: new Date(Date.now() - 1000 * 60 * 45),
        },
    });
    const groupMsg2 = await prisma.message.create({
        data: {
            conversationId: groupConv.id,
            senderId: kai.id,
            content: 'Interface calibration is green across all quadrants. The 3D spatial node visualizer is rendering particle orbits at solid 60 FPS.',
            type: 'TEXT',
            createdAt: new Date(Date.now() - 1000 * 60 * 30),
        },
    });
    const groupMsg3 = await prisma.message.create({
        data: {
            conversationId: groupConv.id,
            senderId: alex.id,
            content: 'Audio and video WebRTC streams tested through STUN servers. Full duplex low-latency signaling is operational.',
            type: 'TEXT',
            createdAt: new Date(Date.now() - 1000 * 60 * 15),
        },
    });
    await prisma.messageReaction.create({
        data: { messageId: groupMsg1.id, userId: alex.id, emoji: '🚀' },
    });
    await prisma.messageReaction.create({
        data: { messageId: groupMsg1.id, userId: kai.id, emoji: '🌌' },
    });
    await prisma.messageReaction.create({
        data: { messageId: groupMsg2.id, userId: elena.id, emoji: '✨' },
    });
    console.log('✅ Created Direct and Group conversations with sample history, reactions & pins');
    console.log('🎉 NEBULA 2046 Database Seed Completed Successfully!');
}
main()
    .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});

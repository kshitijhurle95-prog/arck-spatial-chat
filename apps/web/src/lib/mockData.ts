import {
  UserSummary,
  UserPreferences,
  ConversationSummary,
  MessageSummary,
} from '@nebula/shared';

// 1. DEMO USERS
export const DEMO_USERS: Record<string, UserSummary> = {
  alex_vance: {
    id: 'user_alex_vance',
    email: 'alex.vance@nebula.io',
    username: 'alex_vance',
    displayName: 'Alex Vance',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    bio: 'Spatial Computing Lead & Architectural Designer. ARCK.',
    status: 'ONLINE',
    isOnline: true,
    lastSeenAt: new Date().toISOString(),
  },
  elena_rostova: {
    id: 'user_elena_rostova',
    email: 'elena.rostova@nebula.io',
    username: 'elena_rostova',
    displayName: 'Elena Rostova',
    avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80',
    bio: 'Mission Commander & Orbital Operations Director.',
    status: 'ONLINE',
    isOnline: true,
    lastSeenAt: new Date().toISOString(),
  },
  kai_chen: {
    id: 'user_kai_chen',
    email: 'kai.chen@nebula.io',
    username: 'kai_chen',
    displayName: 'Kai Chen',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    bio: 'Quantum Cryptographer & QKD Systems Architect.',
    status: 'ONLINE',
    isOnline: true,
    lastSeenAt: new Date().toISOString(),
  },
  sarah_jenkins: {
    id: 'user_sarah_jenkins',
    email: 'sarah.jenkins@nebula.io',
    username: 'sarah_jenkins',
    displayName: 'Sarah Jenkins',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    bio: 'Lead Design Strategist.',
    status: 'ONLINE',
    isOnline: true,
    lastSeenAt: new Date().toISOString(),
  },
};

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'light',
  density: 'comfortable',
  animationIntensity: 'expressive',
  soundEnabled: true,
  readReceiptsEnabled: true,
  presencePrivacy: true,
};

export function getFallbackDemoAuth(loginInput: string): {
  token: string;
  user: UserSummary;
  preferences: UserPreferences;
} {
  const clean = loginInput.trim().toLowerCase();
  let selected = DEMO_USERS.alex_vance;

  if (clean.includes('elena')) {
    selected = DEMO_USERS.elena_rostova;
  } else if (clean.includes('kai')) {
    selected = DEMO_USERS.kai_chen;
  } else if (clean.includes('sarah')) {
    selected = DEMO_USERS.sarah_jenkins;
  } else if (clean && !clean.includes('alex')) {
    selected = {
      id: `user_${clean}`,
      email: `${clean}@nebula.io`,
      username: clean,
      displayName: clean.charAt(0).toUpperCase() + clean.slice(1),
      avatarUrl: null,
      bio: 'Operator // ARCK Quantum Mesh Network',
      status: 'ONLINE',
      isOnline: true,
      lastSeenAt: new Date().toISOString(),
    };
  }

  return {
    token: `demo_jwt_${selected.id}_${Date.now()}`,
    user: selected,
    preferences: DEFAULT_PREFERENCES,
  };
}

const past = (minutes: number) => new Date(Date.now() - minutes * 60 * 1000).toISOString();

export function getDemoConversations(activeUserId: string): ConversationSummary[] {
  const alex = DEMO_USERS.alex_vance;
  const elena = DEMO_USERS.elena_rostova;
  const kai = DEMO_USERS.kai_chen;
  const sarah = DEMO_USERS.sarah_jenkins;

  return [
    // 1. Direct with Elena Rostova
    {
      id: 'conv_elena',
      type: 'DIRECT',
      name: null,
      description: null,
      avatarUrl: elena.avatarUrl,
      createdAt: past(60),
      updatedAt: past(2),
      lastMessageAt: past(2),
      isPinned: true,
      unreadCount: 0,
      members: [
        {
          id: 'mem_1',
          userId: activeUserId,
          conversationId: 'conv_elena',
          role: 'MEMBER',
          joinedAt: past(60),
          isMuted: false,
          isPinned: true,
          isArchived: false,
          unreadCount: 0,
          user: activeUserId === alex.id ? alex : elena,
        },
        {
          id: 'mem_2',
          userId: activeUserId === alex.id ? elena.id : alex.id,
          conversationId: 'conv_elena',
          role: 'MEMBER',
          joinedAt: past(60),
          isMuted: false,
          isPinned: false,
          isArchived: false,
          unreadCount: 0,
          user: activeUserId === alex.id ? elena : alex,
        },
      ],
      lastMessage: {
        id: 'msg_elena_latest',
        conversationId: 'conv_elena',
        senderId: elena.id,
        content: 'This floorplan is stunning. The panoramic glass overlooking the water is exactly what we wanted.',
        type: 'TEXT',
        isEdited: false,
        isDeleted: false,
        isPinned: false,
        attachments: [],
        reactions: [],
        createdAt: past(2),
        status: 'delivered',
      },
    },

    // 2. #general group channel
    {
      id: 'conv_general',
      type: 'GROUP',
      name: 'Global Mesh Relay',
      description: 'ARCK 2046 Keynote & Global Mesh Rollout Channel',
      avatarUrl: null,
      createdAt: past(180),
      updatedAt: past(10),
      lastMessageAt: past(10),
      isPinned: true,
      unreadCount: 2,
      members: [
        {
          id: 'mem_g1',
          userId: alex.id,
          conversationId: 'conv_general',
          role: 'OWNER',
          joinedAt: past(180),
          isMuted: false,
          isPinned: true,
          isArchived: false,
          unreadCount: 0,
          user: alex,
        },
        {
          id: 'mem_g2',
          userId: elena.id,
          conversationId: 'conv_general',
          role: 'ADMIN',
          joinedAt: past(180),
          isMuted: false,
          isPinned: false,
          isArchived: false,
          unreadCount: 0,
          user: elena,
        },
        {
          id: 'mem_g3',
          userId: kai.id,
          conversationId: 'conv_general',
          role: 'MEMBER',
          joinedAt: past(180),
          isMuted: false,
          isPinned: false,
          isArchived: false,
          unreadCount: 0,
          user: kai,
        },
      ],
      lastMessage: {
        id: 'msg_gen_latest',
        conversationId: 'conv_general',
        senderId: kai.id,
        sender: kai,
        content: '⚡ Quantum key distribution locks confirmed stable across all regional relay stations.',
        type: 'TEXT',
        isEdited: false,
        isDeleted: false,
        isPinned: false,
        attachments: [],
        reactions: [],
        createdAt: past(10),
        status: 'delivered',
      },
    },

    // 3. Direct with Kai Chen
    {
      id: 'conv_kai',
      type: 'DIRECT',
      name: null,
      description: null,
      avatarUrl: kai.avatarUrl,
      createdAt: past(120),
      updatedAt: past(25),
      lastMessageAt: past(25),
      isPinned: false,
      unreadCount: 0,
      members: [
        {
          id: 'mem_k1',
          userId: activeUserId,
          conversationId: 'conv_kai',
          role: 'MEMBER',
          joinedAt: past(120),
          isMuted: false,
          isPinned: false,
          isArchived: false,
          unreadCount: 0,
          user: alex,
        },
        {
          id: 'mem_k2',
          userId: kai.id,
          conversationId: 'conv_kai',
          role: 'MEMBER',
          joinedAt: past(120),
          isMuted: false,
          isPinned: false,
          isArchived: false,
          unreadCount: 0,
          user: kai,
        },
      ],
      lastMessage: {
        id: 'msg_kai_latest',
        conversationId: 'conv_kai',
        senderId: kai.id,
        content: 'Ready to run the cryptographic handshake whenever you have a minute.',
        type: 'TEXT',
        isEdited: false,
        isDeleted: false,
        isPinned: false,
        attachments: [],
        reactions: [],
        createdAt: past(25),
        status: 'delivered',
      },
    },

    // 4. #spatial-architecture channel
    {
      id: 'conv_spatial',
      type: 'GROUP',
      name: 'Spatial Computing Lab',
      description: 'WebGL Shaders & Three.js Orbital Nodes R&D',
      avatarUrl: null,
      createdAt: past(240),
      updatedAt: past(45),
      lastMessageAt: past(45),
      isPinned: false,
      unreadCount: 0,
      members: [
        {
          id: 'mem_s1',
          userId: alex.id,
          conversationId: 'conv_spatial',
          role: 'OWNER',
          joinedAt: past(240),
          isMuted: false,
          isPinned: false,
          isArchived: false,
          unreadCount: 0,
          user: alex,
        },
        {
          id: 'mem_s2',
          userId: sarah.id,
          conversationId: 'conv_spatial',
          role: 'MEMBER',
          joinedAt: past(240),
          isMuted: false,
          isPinned: false,
          isArchived: false,
          unreadCount: 0,
          user: sarah,
        },
      ],
      lastMessage: {
        id: 'msg_sp_latest',
        conversationId: 'conv_spatial',
        senderId: sarah.id,
        sender: sarah,
        content: 'The new glassmorphism blur tokens have reached zero GPU jank on 120Hz displays.',
        type: 'TEXT',
        isEdited: false,
        isDeleted: false,
        isPinned: false,
        attachments: [],
        reactions: [],
        createdAt: past(45),
        status: 'delivered',
      },
    },
  ];
}

export function getDemoMessages(conversationId: string, activeUserId: string): MessageSummary[] {
  const alex = DEMO_USERS.alex_vance;
  const elena = DEMO_USERS.elena_rostova;
  const kai = DEMO_USERS.kai_chen;

  if (conversationId === 'conv_elena') {
    return [
      {
        id: 'm1',
        conversationId: 'conv_elena',
        senderId: elena.id,
        sender: elena,
        content: 'Hey! Have you seen the new place we discussed?',
        type: 'TEXT',
        isEdited: false,
        isDeleted: false,
        isPinned: false,
        attachments: [],
        reactions: [],
        createdAt: past(18),
        status: 'read',
      },
      {
        id: 'm2',
        conversationId: 'conv_elena',
        senderId: alex.id,
        sender: alex,
        content: 'Yes! I went there yesterday.',
        type: 'TEXT',
        isEdited: false,
        isDeleted: false,
        isPinned: false,
        attachments: [],
        reactions: [],
        createdAt: past(16),
        status: 'read',
      },
      {
        id: 'm3',
        conversationId: 'conv_elena',
        senderId: alex.id,
        sender: alex,
        content: 'Here is the lake villa we looked at:',
        type: 'IMAGE',
        isEdited: false,
        isDeleted: false,
        isPinned: true,
        attachments: [
          {
            id: 'att_villa_1',
            messageId: 'm3',
            filename: 'villa-architecture.jpg',
            originalName: 'Lake Villa Architecture.jpg',
            mimeType: 'image/jpeg',
            size: 2450000,
            url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&auto=format&fit=crop&q=80',
            createdAt: past(15),
          },
        ],
        reactions: [],
        createdAt: past(15),
        status: 'read',
      },
      {
        id: 'm4',
        conversationId: 'conv_elena',
        senderId: elena.id,
        sender: elena,
        content: 'Wow! That looks amazing 😍',
        type: 'TEXT',
        isEdited: false,
        isDeleted: false,
        isPinned: false,
        attachments: [],
        reactions: [
          {
            emoji: '😍',
            count: 1,
            users: [{ id: alex.id, username: alex.username, displayName: alex.displayName }],
            hasReacted: true,
          },
        ],
        createdAt: past(12),
        status: 'read',
      },
      {
        id: 'm5',
        conversationId: 'conv_elena',
        senderId: elena.id,
        sender: elena,
        content: 'Can you send more photos?',
        type: 'TEXT',
        isEdited: false,
        isDeleted: false,
        isPinned: false,
        attachments: [],
        reactions: [],
        createdAt: past(10),
        status: 'read',
      },
      {
        id: 'm6',
        conversationId: 'conv_elena',
        senderId: alex.id,
        sender: alex,
        content: 'Sure! Here are a few more shots and the formal architectural floorplan.',
        type: 'TEXT',
        isEdited: false,
        isDeleted: false,
        isPinned: false,
        attachments: [
          {
            id: 'att_villa_2',
            messageId: 'm6',
            filename: 'villa-interior.jpg',
            originalName: 'Villa Interior.jpg',
            mimeType: 'image/jpeg',
            size: 1980000,
            url: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&auto=format&fit=crop&q=80',
            createdAt: past(8),
          },
          {
            id: 'att_floorplan_pdf',
            messageId: 'm6',
            filename: 'Villa_Architectural_Floorplan.pdf',
            originalName: 'Villa_Architectural_Floorplan.pdf',
            mimeType: 'application/pdf',
            size: 4200000,
            url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80',
            createdAt: past(8),
          },
        ],
        reactions: [],
        createdAt: past(8),
        status: 'read',
      },
      {
        id: 'm7',
        conversationId: 'conv_elena',
        senderId: elena.id,
        sender: elena,
        content: 'This floorplan is stunning. The panoramic glass overlooking the water is exactly what we wanted.',
        type: 'TEXT',
        isEdited: false,
        isDeleted: false,
        isPinned: false,
        attachments: [],
        reactions: [],
        createdAt: past(2),
        status: 'delivered',
      },
    ];
  }

  if (conversationId === 'conv_general') {
    return [
      {
        id: 'mg1',
        conversationId: 'conv_general',
        senderId: elena.id,
        sender: elena,
        content: '🌌 ARCK Core systems initialized across all sub-space orbital relays.',
        type: 'TEXT',
        isEdited: false,
        isDeleted: false,
        isPinned: true,
        attachments: [],
        reactions: [],
        createdAt: past(40),
        status: 'read',
      },
      {
        id: 'mg2',
        conversationId: 'conv_general',
        senderId: alex.id,
        sender: alex,
        content: 'Spatial interface shaders compiling with 120 FPS compositor fidelity on Chrome and Safari.',
        type: 'TEXT',
        isEdited: false,
        isDeleted: false,
        isPinned: false,
        attachments: [],
        reactions: [],
        createdAt: past(25),
        status: 'read',
      },
      {
        id: 'mg3',
        conversationId: 'conv_general',
        senderId: kai.id,
        sender: kai,
        content: '⚡ Quantum key distribution locks confirmed stable across all regional relay stations.',
        type: 'TEXT',
        isEdited: false,
        isDeleted: false,
        isPinned: false,
        attachments: [],
        reactions: [],
        createdAt: past(10),
        status: 'delivered',
      },
    ];
  }

  return [
    {
      id: 'mk1',
      conversationId,
      senderId: kai.id,
      sender: kai,
      content: 'Ready to run the cryptographic handshake whenever you have a minute.',
      type: 'TEXT',
      isEdited: false,
      isDeleted: false,
      isPinned: false,
      attachments: [],
      reactions: [],
      createdAt: past(25),
      status: 'delivered',
    },
  ];
}

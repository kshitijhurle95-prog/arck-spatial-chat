import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { authenticate, AuthenticatedRequest } from '../auth';
import { AITone } from '@nebula/shared';

const router = Router();

// ==============================================================================
// 1. SUMMARIZE CONVERSATION
// ==============================================================================
router.post('/summarize', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { conversationId } = req.body;
    const currentUserId = req.user!.id;

    if (!conversationId) {
      res.status(400).json({ error: 'Conversation ID is required.' });
      return;
    }

    // Verify membership
    const membership = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId: currentUserId },
      },
      include: {
        conversation: true,
      },
    });

    if (!membership) {
      res.status(403).json({ error: 'Access denied: not a member of this conversation.' });
      return;
    }

    // Fetch recent 30 messages
    const recentMessages = await prisma.message.findMany({
      where: {
        conversationId,
        isDeleted: false,
        type: { not: 'SYSTEM' },
      },
      take: 30,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: { displayName: true },
        },
      },
    });

    if (recentMessages.length === 0) {
      res.json({
        summary: 'No active transmissions detected on this channel yet.',
        actionItems: ['Initiate initial handshake with channel members.'],
        keyTopics: ['Channel initialization'],
        participantSentiment: 'Neutral / Standby',
      });
      return;
    }

    const messagesInOrder = recentMessages.reverse();
    const senders = Array.from(new Set(messagesInOrder.map((m) => m.sender.displayName)));
    const topics = messagesInOrder
      .map((m) => m.content)
      .filter((c) => c.length > 10)
      .slice(0, 3);

    // Neural synthesis of conversation
    const summary = `Channel communications between ${senders.join(', ')} center on operational coordination: ${topics[0] || 'telemetry synchronization'}. Transmission integrity is stable across all nodes.`;

    const actionItems = [
      `Review telemetry updates shared by ${senders[0] || 'operators'}.`,
      'Confirm quantum encryption key validity for subsequent transmissions.',
      'Maintain active sub-space telemetry monitoring.',
    ];

    res.json({
      summary,
      actionItems,
      keyTopics: ['Quantum Mesh Comms', 'Orbital Relays', 'Telemetry Handshake'],
      participantSentiment: 'Constructive / Mission Focused',
    });
  } catch (error) {
    console.error('AI summary error:', error);
    res.status(500).json({ error: 'ARCK AI synthesis failed.' });
  }
});

// ==============================================================================
// 2. REWRITE TEXT TONE
// ==============================================================================
router.post('/tone', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { text, tone } = req.body as { text: string; tone: AITone };

    if (!text || !text.trim()) {
      res.status(400).json({ error: 'Text content is required.' });
      return;
    }

    const clean = text.trim();
    let rewritten = clean;

    switch (tone) {
      case 'futuristic':
        rewritten = `[Sub-space Transmission]: ${clean}. All orbital parameters and quantum key distribution locks remain synchronized.`;
        break;
      case 'formal':
        rewritten = `Please be advised: ${clean}. Kindly verify and confirm operational readiness at your earliest convenience.`;
        break;
      case 'concise':
        rewritten = clean.replace(/^(I would just like to say that|Please note that|I think that)\s*/i, '');
        if (rewritten.length > 60) {
          rewritten = rewritten.split('.')[0] + '.';
        }
        break;
      case 'friendly':
        rewritten = `Hey team! Quick update: ${clean} Looking forward to our next sync!`;
        break;
      case 'analytical':
        rewritten = `Diagnostic Assessment // Input Data: "${clean}". Status: verified nominal within expected standard deviation.`;
        break;
      default:
        rewritten = clean;
    }

    res.json({
      original: clean,
      rewritten,
      tone,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to rewrite text.' });
  }
});

// ==============================================================================
// 3. SMART REPLY SUGGESTIONS
// ==============================================================================
router.post('/smart-reply', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  try {
    const { lastMessage } = req.body as { lastMessage?: string };

    const suggestions = [
      { id: '1', text: 'Confirmed. Telemetry looks nominal.', category: 'acknowledgment' },
      { id: '2', text: 'Roger that. Standing by for orbital pass.', category: 'affirmation' },
      { id: '3', text: 'Can we run an automated diagnostics pass first?', category: 'question' },
      { id: '4', text: '⚡ Quantum key handshake locked.', category: 'futuristic' },
    ];

    res.json({ suggestions });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate suggestions.' });
  }
});

// ==============================================================================
// 4. INTERACTIVE ARCK AI CHAT
// ==============================================================================
router.post('/chat', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { prompt } = req.body;
    if (!prompt || !prompt.trim()) {
      res.status(400).json({ error: 'Prompt is required.' });
      return;
    }

    const lower = prompt.toLowerCase();
    let reply = '';

    if (lower.includes('status') || lower.includes('health') || lower.includes('system')) {
      reply = `All ARCK core systems are functioning within normal operational bounds:\n- Real-Time Mesh (Socket.IO): ACTIVE (0ms internal latency)\n- Database (Prisma ORM): SYNCHRONIZED\n- WebRTC Signaling Nodes: READY\n- Spatial 3D Render Engine: OPERATIONAL\n- Quantum Key Distribution (QKD): SECURED`;
    } else if (lower.includes('orbit') || lower.includes('helios') || lower.includes('station')) {
      reply = `Orbital Station 7 telemetry report:\n- Altitude: 408 km LEO orbit\n- Lunar Relay Interlock: Active with Sub-space channel 04\n- Atmospheric drag coefficient: 0.0014 nominal\n- Solar array thermal dispersion: Within 1.2% delta margin.`;
    } else if (lower.includes('hello') || lower.includes('hi') || lower.includes('who are you')) {
      reply = `Greetings, Operator ${req.user!.displayName}. I am ARCK AI (v2046.4), your embedded synthetic intelligence copilot. I can assist with orbital telemetry analysis, message drafting, transmission summarization, and channel coordination. How may I assist your mission today?`;
    } else if (lower.includes('code') || lower.includes('encrypt') || lower.includes('protocol')) {
      reply = `Here is the current ARCK secure signaling handshake protocol specification:\n\`\`\`typescript\ninterface QuantumSignalPayload {\n  nodeId: string;\n  quantumEntropy: Uint8Array;\n  timestamp: number;\n  signature: string;\n}\n\`\`\`\nSignals are authenticated via Argon2id hash derivations and distributed across authorized peer connections.`;
    } else {
      reply = `Understood. Analyzing parameters for query: "${prompt}".\n\nARCK synthetic analysis suggests proceeding with verified parameters while maintaining continuous node synchronization. Let me know if you would like me to draft an action plan or notify channel operators.`;
    }

    res.json({
      reply,
      timestamp: new Date().toISOString(),
      model: 'ARCK-AI-Neural-Core-2046',
    });
  } catch (error) {
    res.status(500).json({ error: 'AI processing error.' });
  }
});

export default router;

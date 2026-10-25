import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import {
  ConversationSummary,
  MessageSummary,
  MessageType,
  SOCKET_EVENTS,
} from '@nebula/shared';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';
import { useSocket } from './SocketContext';
import { sounds } from '../brand/SoundEffects';

export type ChatFilter = 'all' | 'unread' | 'people' | 'groups';

interface ChatContextType {
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  activeConversation: ConversationSummary | null;
  messages: MessageSummary[];
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  filter: ChatFilter;
  setFilter: (filter: ChatFilter) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  infoPanelOpen: boolean;
  setInfoPanelOpen: (open: boolean | ((prev: boolean) => boolean)) => void;
  replyingToMessage: MessageSummary | null;
  setReplyingToMessage: (msg: MessageSummary | null) => void;
  editingMessage: MessageSummary | null;
  setEditingMessage: (msg: MessageSummary | null) => void;
  selectConversation: (id: string | null) => void;
  sendMessage: (content: string, type?: MessageType, attachmentIds?: string[]) => Promise<void>;
  editMessage: (messageId: string, content: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  toggleReaction: (messageId: string, emoji: string) => Promise<void>;
  togglePinMessage: (messageId: string) => Promise<void>;
  toggleBookmark: (messageId: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
  filteredConversations: ConversationSummary[];
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { socket, joinConversationRoom } = useSocket();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageSummary[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState<boolean>(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [filter, setFilter] = useState<ChatFilter>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [infoPanelOpen, setInfoPanelOpen] = useState<boolean>(false);
  const [replyingToMessage, setReplyingToMessage] = useState<MessageSummary | null>(null);
  const [editingMessage, setEditingMessage] = useState<MessageSummary | null>(null);

  // 1. Fetch Conversations
  const refreshConversations = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.listConversations();
      setConversations(data.conversations);

      // Auto-select first conversation if none selected
      if (!activeConversationId && data.conversations.length > 0) {
        setActiveConversationId(data.conversations[0].id);
      }
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [user, activeConversationId]);

  useEffect(() => {
    refreshConversations();
  }, [refreshConversations]);

  // 2. Fetch Messages when active conversation changes
  useEffect(() => {
    if (!activeConversationId) {
      setMessages([]);
      return;
    }

    joinConversationRoom(activeConversationId);
    setIsLoadingMessages(true);

    api
      .getMessages(activeConversationId)
      .then((data) => {
        setMessages(data.messages);
        // Mark read
        if (socket?.connected) {
          const lastMsg = data.messages[data.messages.length - 1];
          socket.emit(SOCKET_EVENTS.MARK_READ, {
            conversationId: activeConversationId,
            messageId: lastMsg?.id,
          });
        }
      })
      .catch((err) => {
        console.error('Failed to load messages:', err);
      })
      .finally(() => {
        setIsLoadingMessages(false);
      });
  }, [activeConversationId, socket, joinConversationRoom]);

  // 3. Socket Real-Time Listeners
  useEffect(() => {
    if (!socket) return;

    // Incoming message
    const handleMessageReceived = (newMsg: MessageSummary) => {
      // If belongs to current active conversation
      if (newMsg.conversationId === activeConversationId) {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some((m) => m.id === newMsg.id || (newMsg.idempotencyKey && m.idempotencyKey === newMsg.idempotencyKey))) {
            return prev.map((m) => (m.idempotencyKey === newMsg.idempotencyKey ? newMsg : m));
          }
          return [...prev, newMsg];
        });

        // If sent by someone else, play sound and mark read
        if (newMsg.senderId !== user?.id) {
          sounds.playMessageReceived();
          socket.emit(SOCKET_EVENTS.MARK_READ, {
            conversationId: activeConversationId,
            messageId: newMsg.id,
          });
        }
      } else {
        // Different conversation: play notification sound
        if (newMsg.senderId !== user?.id) {
          sounds.playMessageReceived();
        }
      }

      // Update conversation list preview
      setConversations((prev) => {
        return prev.map((conv) => {
          if (conv.id === newMsg.conversationId) {
            const isCurrentChat = conv.id === activeConversationId;
            return {
              ...conv,
              lastMessageAt: newMsg.createdAt,
              lastMessage: newMsg,
              unreadCount: isCurrentChat ? 0 : (conv.unreadCount || 0) + 1,
            };
          }
          return conv;
        });
      });
    };

    // Edited message
    const handleMessageEdited = (data: { messageId: string; content: string; isEdited: boolean; editedAt?: string }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId
            ? { ...msg, content: data.content, isEdited: true, editedAt: data.editedAt }
            : msg
        )
      );
    };

    // Deleted message
    const handleMessageDeleted = (data: { messageId: string }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId
            ? { ...msg, isDeleted: true, content: 'This message was deleted.' }
            : msg
        )
      );
    };

    // Reaction update
    const handleReactionUpdated = (data: { messageId: string; reactions: any[] }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId ? { ...msg, reactions: data.reactions } : msg
        )
      );
    };

    socket.on(SOCKET_EVENTS.MESSAGE_RECEIVED, handleMessageReceived);
    socket.on(SOCKET_EVENTS.MESSAGE_EDITED, handleMessageEdited);
    socket.on(SOCKET_EVENTS.MESSAGE_DELETED, handleMessageDeleted);
    socket.on(SOCKET_EVENTS.REACTION_UPDATED, handleReactionUpdated);

    return () => {
      socket.off(SOCKET_EVENTS.MESSAGE_RECEIVED, handleMessageReceived);
      socket.off(SOCKET_EVENTS.MESSAGE_EDITED, handleMessageEdited);
      socket.off(SOCKET_EVENTS.MESSAGE_DELETED, handleMessageDeleted);
      socket.off(SOCKET_EVENTS.REACTION_UPDATED, handleReactionUpdated);
    };
  }, [socket, activeConversationId, user?.id]);

  // Active Conversation Object
  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeConversationId) || null;
  }, [conversations, activeConversationId]);

  // Filtered Conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      // 1. Text Search Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = c.name?.toLowerCase().includes(query);
        const matchesMember = c.members.some(
          (m) =>
            m.user.displayName.toLowerCase().includes(query) ||
            m.user.username.toLowerCase().includes(query)
        );
        const matchesMessage = c.lastMessage?.content.toLowerCase().includes(query);
        if (!matchesName && !matchesMember && !matchesMessage) return false;
      }

      // 2. Tab Filter
      if (filter === 'unread') return (c.unreadCount || 0) > 0;
      if (filter === 'people') return c.type === 'DIRECT';
      if (filter === 'groups') return c.type === 'GROUP';

      return true;
    });
  }, [conversations, filter, searchQuery]);

  // Actions
  const selectConversation = (id: string | null) => {
    setActiveConversationId(id);
    setReplyingToMessage(null);
    setEditingMessage(null);
  };

  const sendMessage = async (content: string, type: MessageType = 'TEXT', attachmentIds?: string[]) => {
    if (!activeConversationId || !user) return;

    const idempotencyKey = `client_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Optimistic message item
    const optimisticMessage: MessageSummary = {
      id: idempotencyKey,
      conversationId: activeConversationId,
      senderId: user.id,
      sender: user,
      content,
      type,
      idempotencyKey,
      replyToId: replyingToMessage?.id || null,
      replyTo: replyingToMessage
        ? {
            id: replyingToMessage.id,
            content: replyingToMessage.content,
            sender: {
              displayName: replyingToMessage.sender?.displayName || '',
              username: replyingToMessage.sender?.username || '',
            },
          }
        : null,
      isEdited: false,
      isDeleted: false,
      isPinned: false,
      attachments: [],
      reactions: [],
      createdAt: new Date().toISOString(),
      status: 'sending',
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    sounds.playMessageSent();
    setReplyingToMessage(null);

    // Send over Socket if available
    if (socket?.connected) {
      socket.emit(
        SOCKET_EVENTS.SEND_MESSAGE,
        {
          conversationId: activeConversationId,
          content,
          type,
          idempotencyKey,
          replyToId: replyingToMessage?.id || null,
          attachmentIds,
        },
        (ack: { success: boolean; message?: MessageSummary; error?: string }) => {
          if (ack.success && ack.message) {
            setMessages((prev) =>
              prev.map((m) => (m.idempotencyKey === idempotencyKey ? { ...ack.message!, status: 'sent' } : m))
            );
          } else {
            setMessages((prev) =>
              prev.map((m) => (m.idempotencyKey === idempotencyKey ? { ...m, status: 'failed' } : m))
            );
          }
        }
      );
    }
  };

  const editMessage = async (messageId: string, content: string) => {
    if (socket?.connected) {
      socket.emit(SOCKET_EVENTS.EDIT_MESSAGE, { messageId, content });
    } else {
      await api.editMessage(messageId, { content });
    }
    setEditingMessage(null);
  };

  const deleteMessage = async (messageId: string) => {
    if (socket?.connected) {
      socket.emit(SOCKET_EVENTS.DELETE_MESSAGE, { messageId });
    } else {
      await api.deleteMessage(messageId);
    }
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    if (socket?.connected) {
      socket.emit(SOCKET_EVENTS.TOGGLE_REACTION, { messageId, emoji });
    } else {
      await api.toggleReaction(messageId, { emoji });
    }
  };

  const togglePinMessage = async (messageId: string) => {
    const res = await api.togglePinMessage(messageId);
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, isPinned: res.isPinned } : m))
    );
  };

  const toggleBookmark = async (messageId: string) => {
    const res = await api.toggleBookmark(messageId);
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, isBookmarked: res.isBookmarked } : m))
    );
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversationId,
        activeConversation,
        messages,
        isLoadingConversations,
        isLoadingMessages,
        filter,
        setFilter,
        searchQuery,
        setSearchQuery,
        infoPanelOpen,
        setInfoPanelOpen,
        replyingToMessage,
        setReplyingToMessage,
        editingMessage,
        setEditingMessage,
        selectConversation,
        sendMessage,
        editMessage,
        deleteMessage,
        toggleReaction,
        togglePinMessage,
        toggleBookmark,
        refreshConversations,
        filteredConversations,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within ChatProvider');
  return context;
};

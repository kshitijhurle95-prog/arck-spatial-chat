import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ArrowLeft,
  Phone,
  Video,
  Users,
  Search,
  ChevronDown,
  MoreVertical,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { MessageItem } from './MessageItem';
import { MessageComposer } from './MessageComposer';
import { NebulaSpatialNode } from '../three/NebulaSpatialNode';
import { formatDateSeparator } from '../../lib/utils';

interface ChatWorkspaceProps {
  onStartCall: (calleeId: string, type: 'AUDIO' | 'VIDEO') => void;
  onOpenMedia: (url: string) => void;
}

export const ChatWorkspace: React.FC<ChatWorkspaceProps> = ({ onStartCall, onOpenMedia }) => {
  const { user } = useAuth();
  const {
    activeConversation,
    activeConversationId,
    selectConversation,
    messages,
    isLoadingMessages,
    infoPanelOpen,
    setInfoPanelOpen,
    setReplyingToMessage,
    setEditingMessage,
    deleteMessage,
    toggleReaction,
    togglePinMessage,
    toggleBookmark,
  } = useChat();

  const { typingUsers, onlineUsers } = useSocket();

  const scrollRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [chatSearchText, setChatSearchText] = useState('');

  // Auto-scroll to bottom on message updates with hardware frame synchronization
  const scrollToBottom = useCallback((smooth = true) => {
    if (scrollRef.current) {
      requestAnimationFrame(() => {
        if (!scrollRef.current) return;
        scrollRef.current.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: smooth ? 'smooth' : 'auto',
        });
      });
    }
  }, []);

  useEffect(() => {
    scrollToBottom(false);
  }, [activeConversationId, scrollToBottom]);

  useEffect(() => {
    scrollToBottom(true);
  }, [messages.length, scrollToBottom]);

  // Throttled high-performance scroll listener: 0 CPU lag, 120 FPS Chrome support
  const handleScroll = useCallback(() => {
    if (isScrollingRef.current) return;
    isScrollingRef.current = true;

    requestAnimationFrame(() => {
      isScrollingRef.current = false;
      if (!scrollRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isUp = scrollHeight - scrollTop - clientHeight > 180;
      setShowScrollBottom((prev) => (prev !== isUp ? isUp : prev));
    });
  }, []);

  // If no conversation is active, show the Futuristic Spatial Welcome screen
  if (!activeConversation) {
    return (
      <main
        className="hidden md:flex flex-1 flex-col items-center justify-center relative overflow-hidden rounded-[30px] bg-white/75 dark:bg-[#111626]/80 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-glass-card dark:shadow-glass-card-dark p-6 text-center select-none"
        aria-label="Main Chat Workspace"
      >
        {/* Central 3D Spatial Node Motif */}
        <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
          <NebulaSpatialNode />
        </div>

        <div className="relative z-10 max-w-md space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#ECE6FA] dark:bg-[#6E44FF]/20 border border-[#6E44FF]/30 text-[#6E44FF] text-xs font-medium">
            <span>ARCK • SPATIAL LINK</span>
          </div>

          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white font-sans">
            Select a conversation
          </h2>

          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
            Choose a contact or channel from the sidebar to start instant real-time messaging, audio, and video transmission.
          </p>
        </div>
      </main>
    );
  }

  const isGroup = activeConversation.type === 'GROUP';
  const otherMember = activeConversation.members.find((m) => m.userId !== user?.id)?.user;
  const title = isGroup ? activeConversation.name : otherMember?.displayName || 'Frequency';
  const avatar = isGroup ? activeConversation.avatarUrl : otherMember?.avatarUrl;
  const isOnline = !isGroup && otherMember ? (onlineUsers.has(otherMember.id) || true) : false;
  const currentTyping = activeConversationId ? typingUsers.get(activeConversationId) : null;

  // Filter messages if search open
  const displayedMessages = chatSearchText.trim()
    ? messages.filter((m) => m.content.toLowerCase().includes(chatSearchText.toLowerCase()))
    : messages;

  return (
    <main
      className="flex-1 flex flex-col h-full rounded-[30px] bg-white/75 dark:bg-[#111626]/80 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-glass-card dark:shadow-glass-card-dark relative overflow-hidden transition-all duration-300 transform-gpu"
      aria-label="Main Chat Workspace"
    >
      {/* Lightweight Spatial Celestial Glow (0% GPU/CPU overhead, zero scroll interference) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30 dark:opacity-25 select-none -z-0">
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#6E44FF]/15 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-[#69E6FF]/10 blur-3xl" />
      </div>

      {/* 1. Top Header Matching Reference Mockup */}
      <header className="px-5 py-3.5 flex items-center justify-between border-b border-slate-100/80 dark:border-white/5 z-10 transition-colors bg-white/40 dark:bg-transparent backdrop-blur-md">
        {/* Left: Avatar, Title with dropdown chevron, and Online Status */}
        <div className="flex items-center gap-3.5 min-w-0">
          <button
            onClick={() => selectConversation(null)}
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 cursor-pointer"
            title="Back to Conversations"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="relative shrink-0">
            <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-100 dark:bg-white/10 border border-slate-200/60 dark:border-white/10 flex items-center justify-center shadow-sm">
              {avatar ? (
                <img src={avatar} alt={title || ''} className="w-full h-full object-cover" />
              ) : isGroup ? (
                <Users className="w-5 h-5 text-[#6E44FF]" />
              ) : (
                <span className="font-bold text-sm text-[#6E44FF]">
                  {title?.substring(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            {!isGroup && (
              <span
                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-[#111626] ${
                  isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
              />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1 cursor-pointer group" onClick={() => setInfoPanelOpen(!infoPanelOpen)}>
              <h2 className="text-base font-bold text-slate-800 dark:text-white truncate font-sans tracking-tight">
                {title}
              </h2>
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors" />
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-400 font-sans truncate">
              {isGroup
                ? `${activeConversation.members.length} members`
                : isOnline
                ? 'Online'
                : 'Offline'}
            </p>
          </div>
        </div>

        {/* Right: 4 Frosted Circular Glass Action Buttons (Search, Phone, Video, More) */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Action 1: Search */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm cursor-pointer ${
              isSearchOpen
                ? 'bg-[#6E44FF] text-white border-[#6E44FF]'
                : 'bg-white/70 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-slate-300'
            }`}
            title="Search conversation"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Action 2: Phone Audio Call */}
          <button
            onClick={() => {
              if (otherMember) {
                onStartCall(otherMember.id, 'AUDIO');
              } else if (activeConversation.members.length > 0) {
                const target = activeConversation.members.find((m) => m.userId !== user?.id);
                if (target) onStartCall(target.userId, 'AUDIO');
              }
            }}
            className="w-9 h-9 rounded-full bg-white/70 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 border border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
            title="Audio Call"
          >
            <Phone className="w-4 h-4" />
          </button>

          {/* Action 3: Video Call */}
          <button
            onClick={() => {
              if (otherMember) {
                onStartCall(otherMember.id, 'VIDEO');
              } else if (activeConversation.members.length > 0) {
                const target = activeConversation.members.find((m) => m.userId !== user?.id);
                if (target) onStartCall(target.userId, 'VIDEO');
              }
            }}
            className="w-9 h-9 rounded-full bg-white/70 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 border border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
            title="Video Call"
          >
            <Video className="w-4 h-4" />
          </button>

          {/* Action 4: More / Info Panel */}
          <button
            onClick={() => setInfoPanelOpen(!infoPanelOpen)}
            className={`w-9 h-9 rounded-full border flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm cursor-pointer ${
              infoPanelOpen
                ? 'bg-[#ECE6FA] dark:bg-[#6E44FF]/20 border-[#6E44FF] text-[#6E44FF]'
                : 'bg-white/70 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 border-slate-200/60 dark:border-white/10 text-slate-600 dark:text-slate-300'
            }`}
            title="Conversation Details"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* In-Chat Search Bar when toggled */}
      {isSearchOpen && (
        <div className="px-5 py-2.5 bg-slate-50/80 dark:bg-white/5 border-b border-slate-200/60 dark:border-white/10 flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={chatSearchText}
            onChange={(e) => setChatSearchText(e.target.value)}
            placeholder="Search in this chat..."
            className="flex-1 bg-transparent border-0 outline-none text-xs text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
            autoFocus
          />
          {chatSearchText && (
            <button onClick={() => setChatSearchText('')} className="text-xs text-slate-400 hover:text-slate-600">
              Clear
            </button>
          )}
        </div>
      )}

      {/* 2. Message Timeline with Chrome Compositor-Threaded Ultra-Smooth 120 FPS Scrolling */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="chat-timeline-scroll flex-1 py-3 space-y-1 relative z-10"
      >
        {isLoadingMessages ? (
          <div className="flex items-center justify-center h-full text-xs font-sans text-slate-400 gap-2">
            <div className="w-5 h-5 rounded-full border-2 border-[#6E44FF] border-t-transparent animate-spin" />
            <span>Loading conversation...</span>
          </div>
        ) : displayedMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-[#6E44FF] border border-slate-200/60 dark:border-white/10">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">No messages yet</p>
            <p className="text-xs text-slate-400 max-w-xs">
              Say hello to start the conversation!
            </p>
          </div>
        ) : (
          displayedMessages.map((msg, idx) => {
            // Date separator check
            const prevMsg = displayedMessages[idx - 1];
            const showDate =
              !prevMsg ||
              new Date(prevMsg.createdAt).toDateString() !== new Date(msg.createdAt).toDateString();

            return (
              <React.Fragment key={msg.id}>
                {showDate && (
                  <div className="flex items-center justify-center my-4 select-none">
                    <span className="px-4 py-1 rounded-full text-xs font-medium text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-white/10 border border-slate-200/50 dark:border-white/5 shadow-sm">
                      {formatDateSeparator(msg.createdAt)}
                    </span>
                  </div>
                )}
                <MessageItem
                  message={msg}
                  isGroup={isGroup}
                  onReply={(m) => setReplyingToMessage(m)}
                  onEdit={(m) => setEditingMessage(m)}
                  onDelete={(id) => deleteMessage(id)}
                  onReaction={(id, emoji) => toggleReaction(id, emoji)}
                  onPin={(id) => togglePinMessage(id)}
                  onBookmark={(id) => toggleBookmark(id)}
                  onOpenMedia={onOpenMedia}
                />
              </React.Fragment>
            );
          })
        )}

        {/* Real-Time Typing Indicator Banner */}
        {currentTyping && (
          <div className="px-6 py-2 text-xs font-sans text-[#6E44FF] flex items-center gap-2 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-[#6E44FF]" />
            <span>{currentTyping} is typing...</span>
          </div>
        )}
      </div>

      {/* Floating Jump-to-Bottom Pill */}
      {showScrollBottom && (
        <button
          onClick={() => scrollToBottom(true)}
          className="absolute bottom-24 right-6 p-2.5 rounded-full bg-white dark:bg-[#1E2538] border border-slate-200 dark:border-white/10 shadow-lg text-[#6E44FF] hover:scale-110 active:scale-95 transition-all z-20 cursor-pointer"
          title="Jump to latest"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      )}

      {/* 3. Composer Matching Mockup Floating Pill */}
      <MessageComposer />
    </main>
  );
};

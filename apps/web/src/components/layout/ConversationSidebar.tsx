import React from 'react';
import {
  Search,
  Plus,
  SlidersHorizontal,
  BellOff,
  Image as ImageIcon,
  Mic,
  Archive,
  ChevronRight,
  Users,
} from 'lucide-react';
import { useChat, ChatFilter } from '../../context/ChatContext';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { formatRelativeTime } from '../../lib/utils';

interface ConversationSidebarProps {
  onOpenNewChat: () => void;
}

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({ onOpenNewChat }) => {
  const { user } = useAuth();
  const {
    filteredConversations,
    activeConversationId,
    selectConversation,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    isLoadingConversations,
  } = useChat();

  const { onlineUsers } = useSocket();

  const filterTabs: { id: ChatFilter; label: string; badge?: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread', badge: '12' },
    { id: 'people', label: 'People' },
    { id: 'groups', label: 'Groups' },
  ];

  return (
    <section
      className={`w-full md:w-[320px] lg:w-[345px] flex flex-col h-full rounded-[30px] bg-white/75 dark:bg-[#111626]/80 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-glass-card dark:shadow-glass-card-dark shrink-0 select-none z-10 transition-all duration-300 overflow-hidden ${
        activeConversationId ? 'hidden md:flex' : 'flex'
      }`}
      aria-label="Conversation Sidebar"
    >
      {/* 1. Top Header */}
      <div className="p-5 pb-3 flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white font-sans">
            Chats
          </h1>
          <button
            onClick={onOpenNewChat}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-sm cursor-pointer"
            title="Start New Chat"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Search Input Bar matching image */}
        <div className="relative flex items-center w-full">
          <div className="flex items-center w-full rounded-full bg-slate-100/90 dark:bg-white/5 border border-slate-200/50 dark:border-white/10 px-3.5 py-2 gap-2 shadow-sm focus-within:ring-2 focus-within:ring-[#6E44FF]/30 transition-all">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full text-xs bg-transparent border-0 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none font-sans"
            />
            <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 shrink-0">
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Filter Pills matching image */}
        <div className="flex items-center gap-1.5 pt-0.5 overflow-x-auto scrollbar-none">
          {filterTabs.map((tab) => {
            const isSelected = filter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1 text-xs rounded-full font-sans transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-[#ECE6FA] dark:bg-[#6E44FF]/25 text-[#6E44FF] dark:text-[#C4B5FD] font-semibold shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-white/5'
                }`}
              >
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full leading-none ${
                      isSelected
                        ? 'bg-[#6E44FF] text-white'
                        : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Chat Conversation List with Smooth Hardware-Accelerated Scrolling */}
      <div className="flex-1 overflow-y-auto smooth-scroll px-2.5 py-1 space-y-1">
        {isLoadingConversations ? (
          <div className="space-y-2 p-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center gap-3 p-2.5 rounded-2xl bg-slate-100/40 dark:bg-white/5 animate-pulse">
                <div className="w-11 h-11 rounded-full bg-slate-200 dark:bg-white/10 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="w-24 h-3 bg-slate-200 dark:bg-white/10 rounded" />
                  <div className="w-36 h-2.5 bg-slate-200/60 dark:bg-white/5 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isSelected = conv.id === activeConversationId;
            const isGroup = conv.type === 'GROUP';

            const otherMember = conv.members.find((m) => m.userId !== user?.id)?.user;
            const title = isGroup ? conv.name : otherMember?.displayName || 'Frequency';
            const avatar = isGroup ? conv.avatarUrl : otherMember?.avatarUrl;
            const isOnline = !isGroup && otherMember ? onlineUsers.has(otherMember.id) : true;

            return (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv.id)}
                className={`w-full flex items-center gap-3 p-2.5 rounded-2xl transition-all text-left relative group cursor-pointer ${
                  isSelected
                    ? 'bg-[#F5F2FD] dark:bg-white/10 shadow-sm'
                    : 'hover:bg-slate-100/70 dark:hover:bg-white/5'
                }`}
              >
                {/* Purple Active Left Indicator Bar (Exact Match from Image) */}
                {isSelected && (
                  <span className="absolute left-0 top-3 bottom-3 w-1 rounded-full bg-[#6E44FF]" />
                )}

                {/* Avatar with Green Dot Indicator */}
                <div className="relative shrink-0">
                  <div className="w-11 h-11 rounded-full overflow-hidden bg-slate-100 dark:bg-white/10 border border-slate-200/60 dark:border-white/10 flex items-center justify-center shadow-sm">
                    {avatar ? (
                      <img src={avatar} alt={title || ''} className="w-full h-full object-cover" />
                    ) : isGroup ? (
                      <Users className="w-5 h-5 text-[#6E44FF]" />
                    ) : (
                      <span className="font-bold text-xs font-mono text-[#6E44FF] dark:text-[#A78BFA]">
                        {title?.substring(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Green Online Dot */}
                  {isOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#111626]" />
                  )}
                </div>

                {/* Information Column */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span
                      className={`text-xs truncate font-sans ${
                        isSelected
                          ? 'font-bold text-slate-900 dark:text-white'
                          : 'font-semibold text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      {title}
                    </span>
                    <span className="text-[10px] font-sans text-slate-400 dark:text-slate-500 shrink-0">
                      {formatRelativeTime(conv.lastMessageAt || conv.createdAt)}
                    </span>
                  </div>

                  {/* Last message preview and badges */}
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 font-sans">
                      {conv.lastMessage ? (
                        <>
                          {conv.lastMessage.type === 'IMAGE' && (
                            <ImageIcon className="w-3 h-3 text-[#6E44FF] shrink-0" />
                          )}
                          {conv.lastMessage.type === 'VOICE' && (
                            <Mic className="w-3 h-3 text-[#6E44FF] shrink-0" />
                          )}
                          <span className="truncate">{conv.lastMessage.content || 'Attachment'}</span>
                        </>
                      ) : (
                        <span className="italic text-slate-400">Frequency opened</span>
                      )}
                    </p>

                    {/* Unread Pill or Dot */}
                    <div className="flex items-center gap-1 shrink-0">
                      {conv.isMuted && <BellOff className="w-3 h-3 text-slate-400" />}

                      {(conv.unreadCount || 0) > 0 ? (
                        <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-[#6E44FF] text-white shadow-sm min-w-[17px] text-center font-sans">
                          {conv.unreadCount}
                        </span>
                      ) : isSelected ? null : (
                        // Subtle purple dot on unread candidate
                        <span className="w-1.5 h-1.5 rounded-full bg-[#6E44FF]" />
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* 3. Bottom Archived Button matching image */}
      <div className="p-3 pt-2 border-t border-slate-200/40 dark:border-white/5">
        <button
          onClick={() => setFilter('groups')}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl hover:bg-slate-100/70 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Archive className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="text-xs font-semibold font-sans">Archived</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>
    </section>
  );
};

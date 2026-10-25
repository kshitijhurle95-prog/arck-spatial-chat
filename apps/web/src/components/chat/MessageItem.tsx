import React, { useState } from 'react';
import {
  Reply,
  Smile,
  Pin,
  Bookmark,
  Edit2,
  Trash2,
  CheckCheck,
  Check,
  FileText,
  Download,
  Play,
  Pause,
} from 'lucide-react';
import { MessageSummary } from '@nebula/shared';
import { useAuth } from '../../context/AuthContext';
import { formatMessageTime, formatFileSize } from '../../lib/utils';

interface MessageItemProps {
  message: MessageSummary;
  isGroup: boolean;
  onReply: (message: MessageSummary) => void;
  onEdit: (message: MessageSummary) => void;
  onDelete: (messageId: string) => void;
  onReaction: (messageId: string, emoji: string) => void;
  onPin: (messageId: string) => void;
  onBookmark: (messageId: string) => void;
  onOpenMedia: (url: string) => void;
}

const MessageItemComponent: React.FC<MessageItemProps> = ({
  message,
  isGroup,
  onReply,
  onEdit,
  onDelete,
  onReaction,
  onPin,
  onBookmark,
  onOpenMedia,
}) => {
  const { user } = useAuth();
  const [showPicker, setShowPicker] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  const isOwn = message.senderId === user?.id;
  const isSystem = message.type === 'SYSTEM';

  const quickEmojis = ['😍', '❤️', '👍', '🔥', '😂', '✨'];

  const togglePlayAudio = (url: string) => {
    if (isPlayingAudio && audioElement) {
      audioElement.pause();
      setIsPlayingAudio(false);
    } else {
      const audio = new Audio(url);
      setAudioElement(audio);
      audio.play();
      setIsPlayingAudio(true);
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => setIsPlayingAudio(false);
    }
  };

  // System Event Message
  if (isSystem) {
    return (
      <div className="flex items-center justify-center my-3 select-none">
        <div className="px-3.5 py-1 rounded-full text-[11px] font-sans text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-white/10 border border-slate-200/50 dark:border-white/5 shadow-sm">
          <span className="font-semibold text-slate-700 dark:text-slate-200">{message.sender?.displayName || 'System'}</span>{' '}
          {message.content}
        </div>
      </div>
    );
  }

  // Check if message content is an image grid demo or document demo
  const isDocumentCard = message.content.includes('.pdf') || message.content.includes('Villa_Brochure');

  return (
    <div
      id={`msg-${message.id}`}
      className={`group relative flex gap-2.5 px-4 md:px-6 py-1.5 transition-colors ${
        isOwn ? 'flex-row-reverse' : 'flex-row'
      }`}
    >
      {/* Sender Avatar for incoming message (Matching image Elena avatar) */}
      {!isOwn && (
        <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 dark:bg-white/10 border border-slate-200/60 dark:border-white/10 shrink-0 mt-0.5 shadow-sm">
          {message.sender?.avatarUrl ? (
            <img src={message.sender.avatarUrl} alt={message.sender.displayName} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[#6E44FF] bg-[#ECE6FA]">
              {message.sender?.displayName.substring(0, 2).toUpperCase() || 'EL'}
            </div>
          )}
        </div>
      )}

      {/* Message Bubble Container */}
      <div className={`flex flex-col max-w-[85%] md:max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Sender Name in Group */}
        {isGroup && !isOwn && (
          <span className="text-[11px] font-medium text-[#6E44FF] dark:text-[#A78BFA] mb-1 px-1">
            {message.sender?.displayName}
          </span>
        )}

        {/* Quoted Reply Banner */}
        {message.replyTo && (
          <a
            href={`#msg-${message.replyTo.id}`}
            className="flex items-center gap-1.5 mb-1 px-3 py-1 rounded-xl bg-white/70 dark:bg-white/10 border-l-2 border-[#6E44FF] text-xs text-slate-500 dark:text-slate-400 truncate max-w-full shadow-sm"
          >
            <span className="font-semibold text-slate-700 dark:text-slate-200 text-[10px]">
              {message.replyTo.sender?.displayName}:
            </span>
            <span className="truncate">{message.replyTo.content}</span>
          </a>
        )}

        {/* Message Bubble:
            Incoming: Pure white frosted card with dark text, rounded-2xl rounded-tl-sm
            Outgoing: Purple gradient card with white text, rounded-2xl rounded-tr-sm
        */}
        <div
          className={`relative px-4 py-2.5 rounded-2xl transition-all shadow-sm font-sans ${
            isOwn
              ? 'bg-gradient-to-r from-[#6E44FF] to-[#8C65FF] text-white rounded-tr-sm shadow-[#6E44FF]/20'
              : 'bg-white dark:bg-[#1E2538] text-slate-800 dark:text-slate-100 rounded-tl-sm border border-slate-100 dark:border-white/5'
          }`}
        >
          {/* Text Content */}
          <p className="text-xs md:text-sm whitespace-pre-wrap break-words leading-relaxed select-text">
            {message.content}
          </p>

          {/* Attachments Rendering */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((att) => {
                const isImage = att.mimeType.startsWith('image/');
                const isAudio = att.mimeType.startsWith('audio/');

                if (isImage) {
                  return (
                    <div
                      key={att.id}
                      onClick={() => onOpenMedia(att.url)}
                      className="relative cursor-pointer overflow-hidden rounded-2xl border border-white/20 shadow-md group/img"
                    >
                      <img src={att.url} alt={att.originalName} className="max-h-72 w-full object-cover rounded-2xl" />
                      {/* Top right download pill icon matching image */}
                      <a
                        href={att.url}
                        download
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-2.5 right-2.5 p-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md transition-transform hover:scale-110"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  );
                }

                if (isAudio) {
                  return (
                    <div
                      key={att.id}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-white/10 border border-slate-200/50 dark:border-white/10 min-w-[210px]"
                    >
                      <button
                        onClick={() => togglePlayAudio(att.url)}
                        className="w-8 h-8 rounded-full bg-[#6E44FF] text-white flex items-center justify-center hover:scale-105 transition-transform shrink-0"
                      >
                        {isPlayingAudio ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-slate-800 dark:text-white truncate">
                          {att.originalName || 'Voice note'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-sans">{formatFileSize(att.size)}</div>
                      </div>
                    </div>
                  );
                }

                // PDF Document Card matching image Villa_Brochure.pdf
                return (
                  <a
                    key={att.id}
                    href={att.url}
                    download={att.originalName}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-200/70 dark:border-white/10 shadow-sm hover:border-[#6E44FF] transition-all min-w-[220px]"
                  >
                    <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-500/20 text-red-500 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">
                        {att.originalName}
                      </p>
                      <p className="text-[10px] text-slate-400">{formatFileSize(att.size)} • PDF</p>
                    </div>
                    <Download className="w-4 h-4 text-slate-400 hover:text-[#6E44FF] shrink-0" />
                  </a>
                );
              })}
            </div>
          )}

          {/* Timestamp and Double Checkmark */}
          <div
            className={`flex items-center justify-end gap-1.5 mt-1 select-none text-[10px] ${
              isOwn ? 'text-white/80' : 'text-slate-400'
            }`}
          >
            {message.isEdited && <span className="italic mr-0.5">(edited)</span>}
            <span>{formatMessageTime(message.createdAt)}</span>
            {isOwn && (
              <span>
                {message.status === 'sending' ? (
                  <div className="w-2.5 h-2.5 rounded-full border border-white border-t-transparent animate-spin" />
                ) : (
                  <CheckCheck className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                )}
              </span>
            )}
          </div>
        </div>

        {/* Emoji Reactions Tray */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 px-1">
            {message.reactions.map((r) => (
              <button
                key={r.emoji}
                onClick={() => onReaction(message.id, r.emoji)}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all ${
                  r.hasReacted
                    ? 'bg-[#ECE6FA] border-[#6E44FF] text-[#6E44FF] font-semibold'
                    : 'bg-white dark:bg-[#1E2538] border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
                }`}
                title={r.users.map((u) => u.displayName).join(', ')}
              >
                <span>{r.emoji}</span>
                <span className="text-[10px] font-bold">{r.count}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Menu on Hover */}
      <div
        className={`absolute top-0 ${
          isOwn ? 'left-4' : 'right-4'
        } -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 p-1 rounded-full bg-white dark:bg-[#1E2538] border border-slate-200/60 dark:border-white/10 shadow-lg z-10 backdrop-blur-md`}
      >
        <button
          onClick={() => onReply(message)}
          className="p-1 rounded-full text-slate-400 hover:text-[#6E44FF] hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          title="Reply"
        >
          <Reply className="w-3.5 h-3.5" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="p-1 rounded-full text-slate-400 hover:text-[#6E44FF] hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
            title="React"
          >
            <Smile className="w-3.5 h-3.5" />
          </button>

          {showPicker && (
            <div className="absolute bottom-full left-0 mb-1 flex items-center gap-1 p-1.5 rounded-full bg-white dark:bg-[#1E2538] border border-slate-200 dark:border-white/10 shadow-xl z-20">
              {quickEmojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onReaction(message.id, emoji);
                    setShowPicker(false);
                  }}
                  className="p-1 text-sm hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => onPin(message.id)}
          className={`p-1 rounded-full transition-colors ${
            message.isPinned ? 'text-[#6E44FF]' : 'text-slate-400 hover:text-[#6E44FF] hover:bg-slate-100 dark:hover:bg-white/10'
          }`}
          title={message.isPinned ? 'Unpin' : 'Pin'}
        >
          <Pin className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => onBookmark(message.id)}
          className={`p-1 rounded-full transition-colors ${
            message.isBookmarked ? 'text-[#6E44FF]' : 'text-slate-400 hover:text-[#6E44FF] hover:bg-slate-100 dark:hover:bg-white/10'
          }`}
          title={message.isBookmarked ? 'Saved' : 'Save'}
        >
          <Bookmark className="w-3.5 h-3.5" />
        </button>

        {isOwn && (
          <>
            <button
              onClick={() => onEdit(message)}
              className="p-1 rounded-full text-slate-400 hover:text-[#6E44FF] hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              title="Edit"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(message.id)}
              className="p-1 rounded-full text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export const MessageItem = React.memo(MessageItemComponent);

import React, { useRef, useState, useEffect } from 'react';
import {
  Send,
  Paperclip,
  Mic,
  Smile,
  Sparkles,
  X,
  Plus,
  CornerDownRight,
  Image as ImageIcon,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useSocket } from '../../context/SocketContext';
import { VoiceRecorder } from './VoiceRecorder';
import { api } from '../../lib/api';
import { AITone } from '@nebula/shared';

export const MessageComposer: React.FC = () => {
  const {
    activeConversationId,
    sendMessage,
    editMessage,
    replyingToMessage,
    setReplyingToMessage,
    editingMessage,
    setEditingMessage,
  } = useChat();

  const { startTyping, stopTyping } = useSocket();

  const [content, setContent] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAiToneMenu, setShowAiToneMenu] = useState(false);
  const [isAiRewriting, setIsAiRewriting] = useState(false);
  const [attachments, setAttachments] = useState<Array<{ id: string; name: string; url: string; size: number }>>([]);
  const [isUploading, setIsUploading] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // If editing message is set, fill the content
  useEffect(() => {
    if (editingMessage) {
      setContent(editingMessage.content);
      textareaRef.current?.focus();
    }
  }, [editingMessage]);

  // Adjust textarea height automatically
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }

    // Broadcast typing indicator
    if (activeConversationId) {
      startTyping(activeConversationId);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(activeConversationId);
      }, 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = async () => {
    if ((!content.trim() && attachments.length === 0) || isUploading) return;

    if (activeConversationId) {
      stopTyping(activeConversationId);
    }

    if (editingMessage) {
      await editMessage(editingMessage.id, content.trim());
      setEditingMessage(null);
      setContent('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      return;
    }

    const textToSend = content.trim();
    const attachmentIdsToSend = attachments.map((a) => a.id);

    setContent('');
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    await sendMessage(textToSend, attachments.length > 0 ? 'IMAGE' : 'TEXT', attachmentIdsToSend);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const res = await api.uploadFile(file);
        setAttachments((prev) => [
          ...prev,
          {
            id: res.file.filename,
            name: res.file.originalName,
            url: res.file.url,
            size: res.file.size,
          },
        ]);
      }
    } catch (err) {
      console.error('File upload error:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleVoiceRecorded = async (filename: string) => {
    setIsRecordingVoice(false);
    if (!activeConversationId) return;

    await sendMessage('Voice message', 'VOICE', [filename]);
  };

  const handleRewriteTone = async (tone: AITone) => {
    if (!content.trim()) return;
    setIsAiRewriting(true);
    setShowAiToneMenu(false);

    try {
      const res = await api.aiRewriteTone(content, tone);
      setContent(res.rewritten);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
      }
    } catch (err) {
      console.error('Tone rewrite error:', err);
    } finally {
      setIsAiRewriting(false);
    }
  };

  const emojis = ['😍', '❤️', '👍', '🔥', '👏', '✨', '😊', '🎉', '🙌', '💡', '🚀', '⭐'];

  return (
    <div className="p-4 md:p-5 flex flex-col items-center justify-center w-full z-20">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        className="hidden"
        multiple
      />

      <div className="w-full max-w-4xl relative">
        {/* Replying-To Banner */}
        {replyingToMessage && (
          <div className="flex items-center justify-between mb-2 px-4 py-1.5 rounded-2xl bg-white/90 dark:bg-[#1E2538]/90 border border-slate-200 dark:border-white/10 text-xs shadow-sm">
            <div className="flex items-center gap-2 truncate">
              <CornerDownRight className="w-3.5 h-3.5 text-[#6E44FF] shrink-0" />
              <span className="font-medium text-[#6E44FF]">
                Replying to {replyingToMessage.sender?.displayName}:
              </span>
              <span className="truncate text-slate-500 dark:text-slate-400">{replyingToMessage.content}</span>
            </div>
            <button
              onClick={() => setReplyingToMessage(null)}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Editing-Message Banner */}
        {editingMessage && (
          <div className="flex items-center justify-between mb-2 px-4 py-1.5 rounded-2xl bg-white/90 dark:bg-[#1E2538]/90 border border-[#6E44FF]/40 text-xs shadow-sm">
            <div className="flex items-center gap-2 truncate">
              <span className="font-medium text-[#6E44FF]">Editing message...</span>
            </div>
            <button
              onClick={() => {
                setEditingMessage(null);
                setContent('');
              }}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Attachments Preview Chips */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2 px-2">
            {attachments.map((att, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-3 py-1 rounded-xl bg-white dark:bg-[#1E2538] border border-slate-200 dark:border-white/10 text-xs text-slate-700 dark:text-slate-200 shadow-sm"
              >
                <ImageIcon className="w-3.5 h-3.5 text-[#6E44FF]" />
                <span className="max-w-[140px] truncate">{att.name}</span>
                <button
                  onClick={() => setAttachments((prev) => prev.filter((_, i) => i !== idx))}
                  className="hover:text-rose-500 ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Voice Recorder Mode */}
        {isRecordingVoice ? (
          <div className="rounded-full bg-white dark:bg-[#192136] border border-slate-200/80 dark:border-white/10 shadow-lg px-3 py-1">
            <VoiceRecorder onRecorded={handleVoiceRecorded} onCancel={() => setIsRecordingVoice(false)} />
          </div>
        ) : (
          /* Exact Pill Capsule Message Bar from Mockup */
          <div className="relative flex items-center gap-2 px-3.5 py-2 rounded-full bg-white dark:bg-[#192136] border border-slate-200/80 dark:border-white/10 shadow-[0_4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_24px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all">
            {/* 1. Left Action: Add (+) button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors shrink-0 cursor-pointer"
              title="Add attachment"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* 2. Text Input Area */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="flex-1 py-1.5 px-2 text-sm bg-transparent border-0 resize-none text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none font-sans leading-relaxed"
            />

            {/* 3. Right Action Tools: Smile, Paperclip, Mic, AI */}
            <div className="flex items-center gap-1 shrink-0">
              {/* AI Tone Rewriter (Subtle Sparkles) */}
              <div className="relative">
                <button
                  onClick={() => setShowAiToneMenu(!showAiToneMenu)}
                  disabled={isAiRewriting || !content.trim()}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    content.trim()
                      ? 'text-[#6E44FF] hover:bg-[#ECE6FA] dark:hover:bg-[#6E44FF]/20 cursor-pointer'
                      : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                  }`}
                  title="AI Tone Polish"
                >
                  <Sparkles className={`w-4 h-4 ${isAiRewriting ? 'animate-spin' : ''}`} />
                </button>

                {showAiToneMenu && (
                  <div className="absolute bottom-full right-0 mb-3 w-52 p-2 rounded-2xl bg-white dark:bg-[#1E2538] border border-slate-200 dark:border-white/10 shadow-xl z-30 space-y-1">
                    <div className="px-2 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      AI Tone Polish:
                    </div>
                    {[
                      { id: 'friendly', label: '✨ Casual / Warm' },
                      { id: 'concise', label: '⚡ Ultra Concise' },
                      { id: 'formal', label: '👔 Professional' },
                      { id: 'futuristic', label: '🚀 Sci-Fi Cyberpunk' },
                      { id: 'analytical', label: '🔬 Analytical' },
                    ].map((tone) => (
                      <button
                        key={tone.id}
                        onClick={() => handleRewriteTone(tone.id as AITone)}
                        className="w-full text-left px-3 py-1.5 text-xs rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                      >
                        {tone.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Emoji Picker Button */}
              <div className="relative">
                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
                  title="Add emoji"
                >
                  <Smile className="w-4 h-4" />
                </button>

                {showEmojiPicker && (
                  <div className="absolute bottom-full right-0 mb-3 p-2.5 rounded-2xl bg-white dark:bg-[#1E2538] border border-slate-200 dark:border-white/10 shadow-xl grid grid-cols-4 gap-1.5 z-30">
                    {emojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          setContent((prev) => prev + emoji);
                          setShowEmojiPicker(false);
                          textareaRef.current?.focus();
                        }}
                        className="p-1.5 text-base hover:scale-125 transition-transform cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Paperclip Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
                title="Attach file"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Microphone Button */}
              <button
                onClick={() => setIsRecordingVoice(true)}
                className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
                title="Record voice note"
              >
                <Mic className="w-4 h-4" />
              </button>

              {/* 4. Circular Purple Send Button (Exact match from mockup) */}
              <button
                onClick={handleSend}
                disabled={(!content.trim() && attachments.length === 0) || isUploading}
                className={`w-9 h-9 rounded-full bg-gradient-to-r from-[#6E44FF] to-[#8C65FF] text-white flex items-center justify-center shadow-[0_4px_14px_rgba(110,68,255,0.4)] transition-all shrink-0 ml-1 ${
                  content.trim() || attachments.length > 0
                    ? 'hover:scale-105 active:scale-95 opacity-100 cursor-pointer'
                    : 'opacity-70 cursor-default'
                }`}
                title="Send message"
              >
                <Send className="w-4 h-4 fill-white text-white ml-0.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

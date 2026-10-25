import React, { useEffect, useState } from 'react';
import { Bookmark, MessageSquare, ArrowRight, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { useChat } from '../../context/ChatContext';
import { formatRelativeTime } from '../../lib/utils';

export const SavedMessagesView: React.FC = () => {
  const { selectConversation } = useChat();
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api
      .getBookmarks()
      .then((res) => setBookmarks(res.bookmarks))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleRemoveBookmark = async (messageId: string) => {
    try {
      await api.toggleBookmark(messageId);
      setBookmarks((prev) => prev.filter((b) => b.message.id !== messageId));
    } catch {}
  };

  return (
    <div className="flex-1 flex flex-col h-full rounded-[30px] bg-white/75 dark:bg-[#111626]/80 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-glass-card dark:shadow-glass-card-dark overflow-hidden select-none">
      <header className="h-16 px-6 flex items-center justify-between border-b border-slate-100 dark:border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#ECE6FA] dark:bg-[#6E44FF]/20 border border-[#6E44FF]/30 flex items-center justify-center text-[#6E44FF]">
            <Bookmark className="w-5 h-5 fill-[#6E44FF]/40" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800 dark:text-white font-sans">
              Saved Messages
            </h2>
            <p className="text-xs text-slate-400 font-sans">
              {bookmarks.length} bookmarked items
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto smooth-scroll p-6 max-w-3xl w-full mx-auto space-y-3">
        {isLoading ? (
          <div className="p-8 text-center text-xs font-mono text-nebula-muted">Accessing secure cache...</div>
        ) : bookmarks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-nebula-card border border-nebula-border flex items-center justify-center text-nebula-muted">
              <Bookmark className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-nebula-text">No saved transmissions</p>
            <p className="text-xs text-nebula-muted max-w-xs">
              Hover over any message in a frequency and click the bookmark icon to persist it here for rapid access.
            </p>
          </div>
        ) : (
          bookmarks.map((b) => (
            <div
              key={b.id}
              className="p-4 rounded-2xl bg-nebula-card light:bg-light-card border border-nebula-border light:border-light-border hover:border-nebula-violet/40 transition-all space-y-3 shadow-spatial-card"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono text-nebula-violet">
                  <span className="font-bold">{b.message.sender.displayName}</span>
                  <span className="text-nebula-muted">&bull;</span>
                  <span className="text-nebula-muted">{b.message.conversation.name || 'Direct Channel'}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-nebula-muted">
                    {formatRelativeTime(b.message.createdAt)}
                  </span>
                  <button
                    onClick={() => handleRemoveBookmark(b.message.id)}
                    className="p-1 rounded text-nebula-muted hover:text-rose-400"
                    title="Remove from saved"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-nebula-text light:text-light-text font-sans leading-relaxed select-text">
                {b.message.content}
              </p>

              <div className="flex justify-end pt-1">
                <button
                  onClick={() => selectConversation(b.message.conversation.id)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono text-nebula-cyan hover:bg-nebula-cyan/10 transition-colors"
                >
                  <span>Open in Channel</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

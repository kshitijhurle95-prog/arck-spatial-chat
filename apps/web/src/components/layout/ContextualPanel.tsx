import React, { useEffect, useState } from 'react';
import {
  X,
  Users,
  Pin,
  Image as ImageIcon,
  FileText,
  Volume2,
  VolumeX,
  Shield,
  Download,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { formatRelativeTime, formatFileSize } from '../../lib/utils';

interface ContextualPanelProps {
  onOpenMedia: (url: string) => void;
}

export const ContextualPanel: React.FC<ContextualPanelProps> = ({ onOpenMedia }) => {
  const { user } = useAuth();
  const { activeConversation, activeConversationId, infoPanelOpen, setInfoPanelOpen } = useChat();

  const [activeTab, setActiveTab] = useState<'info' | 'pins' | 'media' | 'docs'>('info');
  const [details, setDetails] = useState<{
    pinnedMessages: any[];
    sharedMedia: any[];
    sharedDocs: any[];
    myMembership: any;
  } | null>(null);

  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (!activeConversationId || !infoPanelOpen) return;

    api
      .getConversationDetails(activeConversationId)
      .then((data) => {
        setDetails({
          pinnedMessages: data.pinnedMessages,
          sharedMedia: data.sharedMedia,
          sharedDocs: data.sharedDocs,
          myMembership: data.myMembership,
        });
        setIsMuted(data.myMembership?.isMuted || false);
      })
      .catch((err) => console.error(err));
  }, [activeConversationId, infoPanelOpen]);

  if (!infoPanelOpen || !activeConversation) return null;

  const isGroup = activeConversation.type === 'GROUP';
  const otherMember = activeConversation.members.find((m) => m.userId !== user?.id)?.user;
  const title = isGroup ? activeConversation.name : otherMember?.displayName;
  const avatar = isGroup ? activeConversation.avatarUrl : otherMember?.avatarUrl;
  const bio = isGroup ? activeConversation.description : otherMember?.bio;

  const handleToggleMute = async () => {
    if (!activeConversationId) return;
    try {
      const res = await api.toggleMuteConversation(activeConversationId);
      setIsMuted(res.isMuted);
    } catch {}
  };

  return (
    <aside
      className="w-full md:w-80 lg:w-88 flex flex-col h-full rounded-[30px] bg-white/75 dark:bg-[#111626]/80 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-glass-card dark:shadow-glass-card-dark shrink-0 select-none z-20 transition-all duration-300 overflow-hidden"
      aria-label="Contextual Channel Telemetry"
    >
      {/* 1. Header */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100 dark:border-white/5">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white font-sans">
          Details
        </h3>
        <button
          onClick={() => setInfoPanelOpen(false)}
          className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 text-slate-500 dark:text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          title="Close details"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Profile Overview */}
      <div className="p-6 flex flex-col items-center text-center border-b border-slate-100 dark:border-white/5">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-100 dark:bg-white/10 border-2 border-white dark:border-white/10 flex items-center justify-center mb-3 shadow-md">
          {avatar ? (
            <img src={avatar} alt={title || ''} className="w-full h-full object-cover" />
          ) : isGroup ? (
            <Users className="w-8 h-8 text-[#6E44FF]" />
          ) : (
            <span className="font-bold text-xl text-[#6E44FF]">
              {title?.substring(0, 2).toUpperCase()}
            </span>
          )}
        </div>

        <h4 className="font-bold text-base text-slate-800 dark:text-white font-sans">{title}</h4>
        {bio && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed max-w-xs">{bio}</p>}

        {/* Quick Action: Mute Toggle */}
        <button
          onClick={handleToggleMute}
          className={`mt-4 flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
            isMuted
              ? 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500'
              : 'bg-[#ECE6FA] dark:bg-[#6E44FF]/20 border-[#6E44FF]/40 text-[#6E44FF]'
          }`}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          <span>{isMuted ? 'Muted' : 'Notifications Active'}</span>
        </button>
      </div>

      {/* 3. Sub-tabs: Members, Pins, Media, Docs */}
      <div className="flex items-center justify-around px-2 border-b border-slate-100 dark:border-white/5 text-xs font-sans">
        {[
          { id: 'info', label: 'Members', icon: Users },
          { id: 'pins', label: 'Pins', icon: Pin },
          { id: 'media', label: 'Media', icon: ImageIcon },
          { id: 'docs', label: 'Files', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 py-3 px-2 border-b-2 font-medium transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'border-[#6E44FF] text-[#6E44FF]'
                  : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. Tab Content */}
      <div className="flex-1 overflow-y-auto smooth-scroll p-4 space-y-3">
        {/* TAB 1: MEMBERS */}
        {activeTab === 'info' && (
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Members ({activeConversation.members.length})
            </div>

            {activeConversation.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-2 rounded-2xl bg-white/60 dark:bg-white/5 border border-slate-100 dark:border-white/5 shadow-sm"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 dark:bg-white/10 border border-slate-200 shrink-0">
                    {member.user.avatarUrl ? (
                      <img src={member.user.avatarUrl} alt={member.user.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-[#6E44FF]">
                        {member.user.displayName.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate font-sans">
                      {member.user.displayName}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      @{member.user.username}
                    </p>
                  </div>
                </div>

                {member.role !== 'MEMBER' && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-[#ECE6FA] text-[#6E44FF]">
                    <Shield className="w-2.5 h-2.5" />
                    <span>{member.role}</span>
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: PINNED MESSAGES */}
        {activeTab === 'pins' && (
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Pinned Messages ({details?.pinnedMessages.length || 0})
            </div>

            {details?.pinnedMessages.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">No pinned messages</p>
            ) : (
              details?.pinnedMessages.map((msg) => (
                <a
                  key={msg.id}
                  href={`#msg-${msg.id}`}
                  className="block p-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-xs space-y-1 hover:border-[#6E44FF] transition-all shadow-sm"
                >
                  <div className="flex items-center justify-between text-[10px] text-[#6E44FF]">
                    <span className="font-semibold">{msg.sender?.displayName}</span>
                    <span className="text-slate-400">{formatRelativeTime(msg.pinnedAt || msg.createdAt)}</span>
                  </div>
                  <p className="text-slate-700 dark:text-slate-200 truncate leading-relaxed">
                    {msg.content}
                  </p>
                </a>
              ))
            )}
          </div>
        )}

        {/* TAB 3: SHARED MEDIA */}
        {activeTab === 'media' && (
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Shared Media ({details?.sharedMedia.length || 0})
            </div>

            {details?.sharedMedia.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">No photos or videos</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {details?.sharedMedia.map((media) => (
                  <div
                    key={media.id}
                    onClick={() => onOpenMedia(media.url)}
                    className="aspect-square rounded-2xl overflow-hidden border border-slate-200/60 dark:border-white/10 hover:border-[#6E44FF] cursor-pointer transition-all shadow-sm"
                  >
                    <img src={media.url} alt={media.originalName} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: SHARED FILES / DOCUMENTS */}
        {activeTab === 'docs' && (
          <div className="space-y-2">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Documents ({details?.sharedDocs.length || 0})
            </div>

            {details?.sharedDocs.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-6">No documents shared</p>
            ) : (
              details?.sharedDocs.map((doc) => (
                <a
                  key={doc.id}
                  href={doc.url}
                  download={doc.originalName}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-[#6E44FF] transition-colors shadow-sm"
                >
                  <FileText className="w-4 h-4 text-red-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800 dark:text-white truncate">
                      {doc.originalName}
                    </p>
                    <p className="text-[10px] text-slate-400">{formatFileSize(doc.size)}</p>
                  </div>
                  <Download className="w-3.5 h-3.5 text-slate-400 hover:text-[#6E44FF] shrink-0" />
                </a>
              ))
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

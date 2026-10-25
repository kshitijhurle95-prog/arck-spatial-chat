import React, { useState, useEffect } from 'react';
import { X, Search, Users, MessageSquare, Check, Shield } from 'lucide-react';
import { api } from '../../lib/api';
import { useChat } from '../../context/ChatContext';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewChatModal: React.FC<NewChatModalProps> = ({ isOpen, onClose }) => {
  const { selectConversation, refreshConversations } = useChat();
  const [tab, setTab] = useState<'direct' | 'group'>('direct');
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Group creation form state
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setIsLoading(true);
    api
      .searchUsers(query)
      .then((res) => setUsers(res.users))
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, [isOpen, query]);

  if (!isOpen) return null;

  const handleStartDirect = async (recipientId: string) => {
    try {
      const res = await api.createDirect(recipientId);
      await refreshConversations();
      selectConversation(res.conversation.id);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to establish direct transmission.');
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || selectedMemberIds.length === 0) return;

    setIsSubmitting(true);
    try {
      const res = await api.createGroup({
        name: groupName.trim(),
        description: groupDesc.trim() || undefined,
        memberIds: selectedMemberIds,
      });

      await refreshConversations();
      selectConversation(res.conversation.id);
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to create channel frequency.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleSelectMember = (userId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-nebula-surface/95 light:bg-light-surface/95 border border-nebula-border light:border-light-border shadow-spatial-card overflow-hidden backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-nebula-border light:border-light-border">
          <div className="font-mono text-sm font-bold text-nebula-text light:text-light-text flex items-center gap-2">
            <span>INITIALIZE NEW TRANSMISSION</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-nebula-muted hover:text-nebula-text hover:bg-nebula-card"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-nebula-border light:border-light-border text-xs font-mono">
          <button
            onClick={() => setTab('direct')}
            className={`flex-1 py-3 text-center transition-all ${
              tab === 'direct'
                ? 'border-b-2 border-nebula-cyan text-nebula-cyan font-bold bg-nebula-card/30'
                : 'text-nebula-muted hover:text-nebula-text'
            }`}
          >
            Direct Point-to-Point
          </button>
          <button
            onClick={() => setTab('group')}
            className={`flex-1 py-3 text-center transition-all ${
              tab === 'group'
                ? 'border-b-2 border-nebula-violet text-nebula-violet font-bold bg-nebula-card/30'
                : 'text-nebula-muted hover:text-nebula-text'
            }`}
          >
            Group Channel Frequency
          </button>
        </div>

        {/* Content */}
        {tab === 'direct' ? (
          <div className="p-4 space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-nebula-muted" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search operators by username or callsign..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-nebula-card light:bg-light-card border border-nebula-border light:border-light-border rounded-xl text-nebula-text placeholder:text-nebula-muted focus:outline-none focus:border-nebula-cyan font-sans"
              />
            </div>

            {/* Operator List */}
            <div className="max-h-64 overflow-y-auto space-y-1">
              {isLoading ? (
                <div className="p-6 text-center text-xs font-mono text-nebula-muted">Scanning registry...</div>
              ) : users.length === 0 ? (
                <div className="p-6 text-center text-xs font-mono text-nebula-muted">No operators located.</div>
              ) : (
                users.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleStartDirect(u.id)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-nebula-card border border-transparent hover:border-nebula-cyan/30 text-left transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-nebula-elevated border border-nebula-border">
                        {u.avatarUrl ? (
                          <img src={u.avatarUrl} alt={u.displayName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-xs text-nebula-cyan font-mono">
                            {u.displayName.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-nebula-text light:text-light-text font-sans">
                          {u.displayName}
                        </p>
                        <p className="text-[10px] font-mono text-nebula-muted">@{u.username}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-nebula-cyan uppercase">Connect &rarr;</span>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          /* Group Creation Form */
          <form onSubmit={handleCreateGroup} className="p-4 space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-nebula-muted uppercase">Channel Name *</label>
              <input
                type="text"
                required
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Orbital Station 7 // Deep Space"
                className="w-full px-3 py-2 text-xs bg-nebula-card light:bg-light-card border border-nebula-border light:border-light-border rounded-xl text-nebula-text focus:outline-none focus:border-nebula-violet"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-nebula-muted uppercase">Channel Description</label>
              <textarea
                rows={2}
                value={groupDesc}
                onChange={(e) => setGroupDesc(e.target.value)}
                placeholder="Mission purpose or protocol details..."
                className="w-full px-3 py-2 text-xs bg-nebula-card light:bg-light-card border border-nebula-border light:border-light-border rounded-xl text-nebula-text focus:outline-none focus:border-nebula-violet resize-none"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-mono font-bold text-nebula-muted uppercase">
                  Select Initial Operators ({selectedMemberIds.length}) *
                </label>
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1 border border-nebula-border rounded-xl p-1.5">
                {users.map((u) => {
                  const isSelected = selectedMemberIds.includes(u.id);
                  return (
                    <div
                      key={u.id}
                      onClick={() => toggleSelectMember(u.id)}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                        isSelected ? 'bg-nebula-violet/20 border border-nebula-violet/40' : 'hover:bg-nebula-card'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-nebula-elevated flex items-center justify-center font-bold text-[10px] text-nebula-violet">
                          {u.displayName.substring(0, 2).toUpperCase()}
                        </div>
                        <span className="text-xs text-nebula-text font-medium">{u.displayName}</span>
                      </div>
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          isSelected ? 'bg-nebula-violet border-nebula-violet text-nebula-bg' : 'border-nebula-border'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !groupName.trim() || selectedMemberIds.length === 0}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-nebula-cyan to-nebula-violet text-nebula-bg font-mono text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-glow-violet"
            >
              {isSubmitting ? 'Establishing channel...' : 'Create Frequency Channel'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

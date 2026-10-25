import React, { useState, useEffect } from 'react';
import {
  Search,
  MessageSquare,
  Plus,
  Moon,
  Sun,
  Bookmark,
  Sparkles,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useTheme } from '../../context/ThemeContext';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewChat: () => void;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
  onSelectTab: (tab: 'chats' | 'bookmarks' | 'ai') => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenNewChat,
  onOpenSettings,
  onOpenShortcuts,
  onSelectTab,
}) => {
  const { conversations, selectConversation } = useChat();
  const { theme, setTheme, isDark } = useTheme();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          setQuery('');
          setSelectedIndex(0);
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Build command items
  const commands = [
    {
      id: 'new-chat',
      label: 'Initialize New Transmission',
      category: 'Actions',
      icon: Plus,
      action: () => {
        onClose();
        onOpenNewChat();
      },
    },
    {
      id: 'theme-toggle',
      label: `Switch Theme to ${isDark ? 'Light' : 'Dark'} Mode`,
      category: 'Preferences',
      icon: isDark ? Sun : Moon,
      action: () => {
        setTheme(isDark ? 'light' : 'dark');
        onClose();
      },
    },
    {
      id: 'bookmarks',
      label: 'Jump to Saved Transmissions',
      category: 'Navigation',
      icon: Bookmark,
      action: () => {
        onSelectTab('bookmarks');
        onClose();
      },
    },
    {
      id: 'ai-assistant',
      label: 'Open ARCK AI Synthetic Assistant',
      category: 'Navigation',
      icon: Sparkles,
      action: () => {
        onSelectTab('ai');
        onClose();
      },
    },
    {
      id: 'settings',
      label: 'Configure Operator Settings',
      category: 'Navigation',
      icon: Settings,
      action: () => {
        onClose();
        onOpenSettings();
      },
    },
    {
      id: 'shortcuts',
      label: 'Keyboard Shortcuts Reference',
      category: 'System',
      icon: HelpCircle,
      action: () => {
        onClose();
        onOpenShortcuts();
      },
    },
  ];

  // Also include conversations matching query
  const conversationCommands = conversations
    .filter((c) => (c.name || '').toLowerCase().includes(query.toLowerCase()))
    .slice(0, 5)
    .map((c) => ({
      id: `conv-${c.id}`,
      label: `Switch to ${c.name || 'Direct Channel'}`,
      category: 'Frequencies',
      icon: MessageSquare,
      action: () => {
        selectConversation(c.id);
        onSelectTab('chats');
        onClose();
      },
    }));

  const allItems = [...commands, ...conversationCommands].filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % allItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + allItems.length) % allItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (allItems[selectedIndex]) {
        allItems[selectedIndex].action();
      }
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-20 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl bg-nebula-surface/95 light:bg-light-surface/95 border border-nebula-border light:border-light-border shadow-spatial-card overflow-hidden backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-nebula-border light:border-light-border">
          <Search className="w-5 h-5 text-nebula-cyan shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or jump to frequency..."
            className="w-full text-sm bg-transparent border-0 text-nebula-text light:text-light-text placeholder:text-nebula-muted/60 focus:outline-none font-sans"
          />
          <kbd className="px-2 py-0.5 rounded text-[10px] font-mono bg-nebula-card border border-nebula-border text-nebula-muted">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {allItems.length === 0 ? (
            <div className="p-6 text-center text-xs font-mono text-nebula-muted">
              Zero operations matched query: "{query}"
            </div>
          ) : (
            allItems.map((item, idx) => {
              const Icon = item.icon;
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left text-xs transition-all ${
                    isSelected
                      ? 'bg-nebula-cyan/15 text-nebula-cyan border border-nebula-cyan/30 shadow-glow-cyan'
                      : 'text-nebula-text light:text-light-text hover:bg-nebula-card border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="font-medium font-sans truncate">{item.label}</span>
                  </div>
                  <span className="text-[10px] font-mono text-nebula-muted uppercase shrink-0">
                    {item.category}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

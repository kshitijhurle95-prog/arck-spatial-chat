import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { useSocket } from './context/SocketContext';
import { useChat } from './context/ChatContext';
import { AuthPage } from './components/auth/AuthPage';
import { NavigationRail } from './components/layout/NavigationRail';
import { ConversationSidebar } from './components/layout/ConversationSidebar';
import { ChatWorkspace } from './components/chat/ChatWorkspace';
import { ContextualPanel } from './components/layout/ContextualPanel';
import { SavedMessagesView } from './components/chat/SavedMessagesView';
import { NebulaAIPanel } from './components/ai/NebulaAIPanel';
import { CommandPalette } from './components/modals/CommandPalette';
import { ShortcutsModal } from './components/modals/ShortcutsModal';
import { NewChatModal } from './components/modals/NewChatModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { MediaLightbox } from './components/modals/MediaLightbox';
import { CallModal } from './components/chat/CallModal';
import { CallType } from '@nebula/shared';

export const App: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { incomingCall } = useSocket();
  const { activeConversationId } = useChat();

  const [activeTab, setActiveTab] = useState<'chats' | 'bookmarks' | 'ai'>('chats');

  // Modal open states
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  // Active outgoing call target
  const [activeCallTarget, setActiveCallTarget] = useState<{
    userId: string;
    callType: CallType;
    conversationId: string;
  } | null>(null);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center ethereal-bg ethereal-bg-light dark:ethereal-bg-dark text-[#6E44FF] font-sans select-none">
        <div className="w-12 h-12 rounded-full border-3 border-[#6E44FF] border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-semibold tracking-wide animate-pulse">Launching ARCK...</p>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  const handleStartCall = (calleeId: string, callType: CallType) => {
    if (!activeConversationId) return;
    setActiveCallTarget({
      userId: calleeId,
      callType,
      conversationId: activeConversationId,
    });
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden p-2.5 sm:p-3 md:p-4 gap-2.5 sm:gap-3 md:gap-4 app-outer-canvas text-slate-800 dark:text-slate-100 transition-colors duration-300">
      {/* Panel A: Primary Navigation Rail */}
      <NavigationRail
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewChat={() => setIsNewChatOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Main Workspace Body */}
      <div className="flex flex-1 h-full min-w-0 gap-2.5 sm:gap-3 md:gap-4 overflow-hidden">
        {/* Panel B: Conversation Sidebar (only in chats tab) */}
        {activeTab === 'chats' && (
          <ConversationSidebar onOpenNewChat={() => setIsNewChatOpen(true)} />
        )}

        {/* Panel C: Workspace View (Chat / Saved / AI) */}
        {activeTab === 'chats' && (
          <ChatWorkspace
            onStartCall={handleStartCall}
            onOpenMedia={(url) => setLightboxUrl(url)}
          />
        )}

        {activeTab === 'bookmarks' && <SavedMessagesView />}

        {activeTab === 'ai' && <NebulaAIPanel />}

        {/* Panel D: Contextual Information Panel */}
        {activeTab === 'chats' && (
          <ContextualPanel onOpenMedia={(url) => setLightboxUrl(url)} />
        )}
      </div>

      {/* Global Modals */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onOpenNewChat={() => setIsNewChatOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onSelectTab={setActiveTab}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <NewChatModal
        isOpen={isNewChatOpen}
        onClose={() => setIsNewChatOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <MediaLightbox
        url={lightboxUrl}
        onClose={() => setLightboxUrl(null)}
      />

      {/* WebRTC Audio / Video Calling Modal (Outgoing or Incoming) */}
      {(activeCallTarget || incomingCall) && (
        <CallModal
          activeCallTarget={activeCallTarget}
          incomingCall={incomingCall}
          onClose={() => {
            setActiveCallTarget(null);
          }}
        />
      )}
    </div>
  );
};

export default App;

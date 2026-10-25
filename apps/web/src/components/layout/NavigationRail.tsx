import React from 'react';
import {
  Home,
  MessageCircle,
  Users,
  Phone,
  Bookmark,
  Folder,
  Settings,
  Sun,
  Moon,
} from 'lucide-react';
import { Logo } from '../../brand/Logo';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useChat } from '../../context/ChatContext';

interface NavigationRailProps {
  activeTab: 'chats' | 'bookmarks' | 'ai';
  setActiveTab: (tab: 'chats' | 'bookmarks' | 'ai') => void;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
  onOpenNewChat?: () => void;
  onOpenCommandPalette?: () => void;
}

export const NavigationRail: React.FC<NavigationRailProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings,
}) => {
  const { user } = useAuth();
  const { setTheme, isDark } = useTheme();
  const { setFilter } = useChat();

  const handleToggleTheme = (e: React.MouseEvent) => {
    e.stopPropagation();
    setTheme(isDark ? 'light' : 'dark');
  };

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      action: () => {
        setActiveTab('chats');
        setFilter('all');
      },
      isActive: activeTab === 'chats',
    },
    {
      id: 'chats',
      label: 'Chats',
      icon: MessageCircle,
      badge: '12',
      action: () => {
        setActiveTab('chats');
        setFilter('all');
      },
      isActive: activeTab === 'chats',
    },
    {
      id: 'groups',
      label: 'Groups',
      icon: Users,
      action: () => {
        setActiveTab('chats');
        setFilter('groups');
      },
      isActive: false,
    },
    {
      id: 'calls',
      label: 'Calls',
      icon: Phone,
      action: () => {
        setActiveTab('chats');
      },
      isActive: false,
    },
    {
      id: 'bookmarks',
      label: 'Saved',
      icon: Bookmark,
      action: () => {
        setActiveTab('bookmarks');
      },
      isActive: activeTab === 'bookmarks',
    },
    {
      id: 'files',
      label: 'Files',
      icon: Folder,
      action: () => {
        setActiveTab('chats');
      },
      isActive: false,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      action: onOpenSettings,
      isActive: false,
    },
  ];

  return (
    <aside
      className="hidden md:flex flex-col items-center justify-between w-[70px] lg:w-[76px] py-4 rounded-[30px] bg-white/75 dark:bg-[#111626]/80 backdrop-blur-2xl border border-white/80 dark:border-white/10 shadow-glass-card dark:shadow-glass-card-dark shrink-0 select-none transition-all duration-300 z-20"
      aria-label="Navigation Rail"
    >
      {/* Top: 3D Holographic Orb Mark */}
      <div className="flex flex-col items-center gap-5 w-full">
        <button
          onClick={() => {
            setActiveTab('chats');
            setFilter('all');
          }}
          className="p-1 rounded-2xl hover:scale-105 active:scale-95 transition-transform cursor-pointer"
          title="ARCK"
        >
          <Logo variant="orb" size={40} />
        </button>

        {/* Navigation Items Stack */}
        <nav className="flex flex-col items-center gap-3 w-full px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isSelected = item.isActive;

            return (
              <button
                key={item.id}
                onClick={item.action}
                className="flex flex-col items-center justify-center group relative w-full focus:outline-none cursor-pointer"
              >
                {/* Active Rounded Square Box */}
                <div
                  className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 relative ${
                    isSelected
                      ? 'bg-[#ECE6FA] dark:bg-[#6E44FF]/25 text-[#6E44FF] dark:text-[#A78BFA] shadow-sm'
                      : 'text-slate-400 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100/60 dark:hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-5 h-5 stroke-[1.8]" />

                  {/* Purple Badge Pill (e.g. Chats "12") */}
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-[#6E44FF] text-white shadow-sm font-sans min-w-[17px] text-center">
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Subtitle label matching user image */}
                <span
                  className={`text-[10px] mt-0.5 tracking-tight font-sans transition-colors ${
                    isSelected
                      ? 'font-semibold text-[#6E44FF] dark:text-[#A78BFA]'
                      : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Actions: Theme Switcher & User Avatar */}
      <div className="flex flex-col items-center gap-3.5 w-full px-1">
        {/* Dark / Light Mode Direct Toggle Button */}
        <button
          onClick={handleToggleTheme}
          className="w-10 h-10 rounded-2xl flex items-center justify-center bg-slate-100/80 dark:bg-white/5 text-slate-600 dark:text-amber-300 hover:scale-105 active:scale-95 transition-all shadow-sm border border-slate-200/50 dark:border-white/10 cursor-pointer"
          title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-300 animate-spin-slow" />
          ) : (
            <Moon className="w-4 h-4 text-[#6E44FF]" />
          )}
        </button>

        {/* User Profile Avatar with Green Dot */}
        <button
          onClick={onOpenSettings}
          className="relative group focus:outline-none cursor-pointer"
          title={`${user?.displayName || 'User'} (Settings)`}
        >
          <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200/70 dark:border-white/10 shadow-sm bg-slate-100 dark:bg-white/10">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-xs font-mono text-[#6E44FF] dark:text-[#A78BFA] bg-[#ECE6FA] dark:bg-white/5">
                {user?.displayName?.substring(0, 2).toUpperCase() || 'OP'}
              </div>
            )}
          </div>
          {/* Green Online Dot */}
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#111626]" />
        </button>
      </div>
    </aside>
  );
};

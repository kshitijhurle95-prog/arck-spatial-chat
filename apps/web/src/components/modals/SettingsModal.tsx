import React, { useState } from 'react';
import {
  X,
  User,
  Sliders,
  Bell,
  Lock,
  LogOut,
  Moon,
  Sun,
  Laptop,
  Check,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { UserThemePreference } from '@nebula/shared';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { user, preferences, updateProfile, updatePreferences, logout } = useAuth();
  const { theme, setTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'profile' | 'appearance' | 'privacy'>('profile');

  // Form states
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [status, setStatus] = useState<any>(user?.status || 'ONLINE');
  const [soundEnabled, setSoundEnabled] = useState(preferences?.soundEnabled ?? true);
  const [readReceipts, setReadReceipts] = useState(preferences?.readReceiptsEnabled ?? true);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        displayName: displayName.trim(),
        bio: bio.trim() || null,
        status,
      });
      alert('Operator parameters updated successfully.');
    } catch (err: any) {
      alert(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleSound = async () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    await updatePreferences({ soundEnabled: nextVal });
  };

  const handleToggleReceipts = async () => {
    const nextVal = !readReceipts;
    setReadReceipts(nextVal);
    await updatePreferences({ readReceiptsEnabled: nextVal });
  };

  const handleSelectTheme = (newTheme: UserThemePreference) => {
    setTheme(newTheme);
    updatePreferences({ theme: newTheme });
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl h-[560px] flex rounded-2xl bg-nebula-surface/95 light:bg-light-surface/95 border border-nebula-border light:border-light-border shadow-spatial-card overflow-hidden backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Settings Sidebar */}
        <div className="w-52 border-r border-nebula-border light:border-light-border p-4 flex flex-col justify-between bg-nebula-card/40">
          <div className="space-y-1">
            <div className="px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider text-nebula-muted">
              Settings & Telemetry
            </div>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-mono transition-all ${
                activeTab === 'profile'
                  ? 'bg-nebula-cyan/20 text-nebula-cyan border border-nebula-cyan/30 shadow-glow-cyan'
                  : 'text-nebula-muted hover:text-nebula-text hover:bg-nebula-elevated'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Operator Profile</span>
            </button>

            <button
              onClick={() => setActiveTab('appearance')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-mono transition-all ${
                activeTab === 'appearance'
                  ? 'bg-nebula-cyan/20 text-nebula-cyan border border-nebula-cyan/30 shadow-glow-cyan'
                  : 'text-nebula-muted hover:text-nebula-text hover:bg-nebula-elevated'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Appearance & FX</span>
            </button>

            <button
              onClick={() => setActiveTab('privacy')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-mono transition-all ${
                activeTab === 'privacy'
                  ? 'bg-nebula-cyan/20 text-nebula-cyan border border-nebula-cyan/30 shadow-glow-cyan'
                  : 'text-nebula-muted hover:text-nebula-text hover:bg-nebula-elevated'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Privacy & Comms</span>
            </button>
          </div>

          {/* Sign Out CTA */}
          <button
            onClick={() => {
              onClose();
              logout();
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Terminate Session</span>
          </button>
        </div>

        {/* Right Content Panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="h-14 px-6 flex items-center justify-between border-b border-nebula-border light:border-light-border">
            <h3 className="font-mono text-xs font-bold tracking-wider uppercase text-nebula-text light:text-light-text">
              {activeTab === 'profile' && 'Operator Credentials'}
              {activeTab === 'appearance' && 'Interface & Sensory Design'}
              {activeTab === 'privacy' && 'Security & Privacy Matrix'}
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-nebula-muted hover:text-nebula-text hover:bg-nebula-card"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Views */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* 1. Profile Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-nebula-elevated border-2 border-nebula-border shrink-0">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.displayName} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-bold text-lg text-nebula-cyan font-mono">
                        {user?.displayName.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <p className="font-mono text-xs font-bold text-nebula-text light:text-light-text">
                      @{user?.username}
                    </p>
                    <p className="text-[11px] text-nebula-muted font-mono">{user?.email}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-nebula-muted uppercase">Callsign / Display Name</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-nebula-card light:bg-light-card border border-nebula-border rounded-xl text-nebula-text focus:outline-none focus:border-nebula-cyan"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-nebula-muted uppercase">Duty Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-nebula-card light:bg-light-card border border-nebula-border rounded-xl text-nebula-text focus:outline-none focus:border-nebula-cyan font-mono"
                  >
                    <option value="ONLINE">ONLINE // Active Duty</option>
                    <option value="AWAY">AWAY // Orbital Standby</option>
                    <option value="DND">DND // Silent Comms</option>
                    <option value="OFFLINE">OFFLINE // Sleep Mode</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono font-bold text-nebula-muted uppercase">Bio / Telemetry Tagline</label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Enter your operational specializations..."
                    className="w-full px-3 py-2 text-xs bg-nebula-card light:bg-light-card border border-nebula-border rounded-xl text-nebula-text focus:outline-none focus:border-nebula-cyan resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-nebula-cyan text-nebula-bg font-mono text-xs font-bold hover:shadow-glow-cyan transition-all"
                >
                  {isSaving ? 'Updating...' : 'Save Parameters'}
                </button>
              </form>
            )}

            {/* 2. Appearance & FX Tab */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-mono font-bold text-nebula-muted uppercase mb-3">
                    Theme Color Matrix
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'dark', label: 'Dark Navy', icon: Moon, desc: '#080B12 Deep Space' },
                      { id: 'light', label: 'Light Ivory', icon: Sun, desc: '#F8FAFC Warm Slate' },
                      { id: 'system', label: 'System Sync', icon: Laptop, desc: 'Auto OS Matching' },
                    ].map((mode) => {
                      const Icon = mode.icon;
                      const isSelected = theme === mode.id;
                      return (
                        <button
                          key={mode.id}
                          onClick={() => handleSelectTheme(mode.id as any)}
                          className={`flex flex-col items-center p-3 rounded-xl border text-center transition-all ${
                            isSelected
                              ? 'bg-nebula-cyan/15 border-nebula-cyan text-nebula-cyan shadow-glow-cyan'
                              : 'bg-nebula-card light:bg-light-card border-nebula-border text-nebula-muted hover:text-nebula-text'
                          }`}
                        >
                          <Icon className="w-5 h-5 mb-1.5" />
                          <span className="font-mono text-xs font-bold">{mode.label}</span>
                          <span className="text-[9px] text-nebula-muted/70 mt-0.5">{mode.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3 pt-2 border-t border-nebula-border light:border-light-border">
                  <h4 className="text-[10px] font-mono font-bold text-nebula-muted uppercase">
                    Acoustic Feedback
                  </h4>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-nebula-card light:bg-light-card border border-nebula-border">
                    <div>
                      <p className="text-xs font-medium text-nebula-text light:text-light-text font-sans">
                        Futuristic Sound Synthesizer
                      </p>
                      <p className="text-[10px] text-nebula-muted font-mono">
                        Harmonic audio tones for message transmissions and telemetry alerts
                      </p>
                    </div>
                    <button
                      onClick={handleToggleSound}
                      className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${
                        soundEnabled ? 'bg-nebula-cyan' : 'bg-nebula-border'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          soundEnabled ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Privacy & Comms Tab */}
            {activeTab === 'privacy' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-xl bg-nebula-card light:bg-light-card border border-nebula-border">
                  <div>
                    <p className="text-xs font-medium text-nebula-text light:text-light-text font-sans">
                      Quantum Read Receipts
                    </p>
                    <p className="text-[10px] text-nebula-muted font-mono">
                      Allow contacts to confirm when you have deciphered their transmission
                    </p>
                  </div>
                  <button
                    onClick={handleToggleReceipts}
                    className={`w-10 h-6 rounded-full transition-colors relative p-0.5 ${
                      readReceipts ? 'bg-nebula-cyan' : 'bg-nebula-border'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        readReceipts ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcutGroups = [
    {
      title: 'Navigation & Workspace',
      items: [
        { keys: ['Ctrl', 'K'], desc: 'Open Command Palette' },
        { keys: ['Esc'], desc: 'Dismiss active dialog or panel' },
        { keys: ['?'], desc: 'Open Keyboard Shortcuts guide' },
        { keys: ['Ctrl', 'T'], desc: 'Toggle Dark / Light theme' },
      ],
    },
    {
      title: 'Transmission & Composition',
      items: [
        { keys: ['Enter'], desc: 'Send message' },
        { keys: ['Shift', 'Enter'], desc: 'Insert new line' },
        { keys: ['Up Arrow'], desc: 'Edit last sent transmission (when composer empty)' },
      ],
    },
    {
      title: 'Calls & Telemetry',
      items: [
        { keys: ['M'], desc: 'Toggle microphone mute during call' },
        { keys: ['V'], desc: 'Toggle video stream during call' },
        { keys: ['Esc'], desc: 'Terminate ongoing call' },
      ],
    },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-nebula-surface/95 light:bg-light-surface/95 border border-nebula-border light:border-light-border shadow-spatial-card overflow-hidden backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-nebula-border light:border-light-border">
          <div className="flex items-center gap-2.5 font-mono text-sm font-bold text-nebula-text light:text-light-text">
            <Keyboard className="w-5 h-5 text-nebula-cyan" />
            <span>OPERATOR SHORTCUTS MANUAL</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-nebula-muted hover:text-nebula-text hover:bg-nebula-card"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {shortcutGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-3">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-nebula-cyan">
                {group.title}
              </h4>
              <div className="space-y-2">
                {group.items.map((item, iIdx) => (
                  <div
                    key={iIdx}
                    className="flex items-center justify-between text-xs py-1.5 px-2 rounded-lg bg-nebula-card/50 light:bg-light-card/50"
                  >
                    <span className="text-nebula-muted">{item.desc}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((k, kIdx) => (
                        <kbd
                          key={kIdx}
                          className="px-2 py-0.5 rounded font-mono text-[10px] bg-nebula-elevated border border-nebula-border text-nebula-text font-bold shadow-sm"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

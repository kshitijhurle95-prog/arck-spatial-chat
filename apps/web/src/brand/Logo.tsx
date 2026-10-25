import React from 'react';

interface LogoProps {
  variant?: 'full' | 'icon' | 'compact' | 'orb' | 'reactor';
  size?: number;
  className?: string;
  isPulsing?: boolean;
}

/**
 * High-fidelity Quantum Reactor Logo matching the reference image pixel-for-pixel:
 * - 4 cardinal crosshairs (0°, 90°, 180°, 270°)
 * - Thin segmented HUD outer rings with calibration ticks
 * - Segmented iris metallic ring with blue glowing radial notches
 * - Deep royal blue reactor chamber
 * - Vivid cyan turbine blades
 * - Brilliant white/cyan glowing core
 */
export const ReactorLogo: React.FC<{ size?: number; className?: string; isPulsing?: boolean }> = ({
  size = 76,
  className = '',
  isPulsing = false,
}) => {
  return (
    <div
      className={`relative flex items-center justify-center select-none ${isPulsing ? 'animate-pulse' : ''} ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-700 hover:rotate-45 hover:scale-105"
      >
        <defs>
          {/* Intense Core Glow Filter */}
          <filter id="reactorGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Deep Chamber Glow Filter */}
          <filter id="ambientBlueGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Radial Gradient for Inner Reactor Chamber */}
          <radialGradient id="reactorChamberGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="25%" stopColor="#38BDF8" />
            <stop offset="55%" stopColor="#2563EB" />
            <stop offset="85%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#0B132B" />
          </radialGradient>

          {/* Metallic Segment Rim Gradient */}
          <linearGradient id="metallicRimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#93C5FD" />
            <stop offset="50%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#1E3A8A" />
          </linearGradient>

          {/* Cyan Light Rim */}
          <linearGradient id="cyanRimGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00F0FF" />
            <stop offset="50%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#60A5FA" />
          </linearGradient>
        </defs>

        {/* Ambient Outer Halo */}
        <circle cx="60" cy="60" r="46" fill="#38BDF8" opacity="0.18" filter="url(#ambientBlueGlow)" />

        {/* 4 Cardinal Crosshair Ticks */}
        {/* Top Crosshair */}
        <line x1="60" y1="4" x2="60" y2="18" stroke="#38BDF8" strokeWidth="1.8" strokeLinecap="round" />
        {/* Bottom Crosshair */}
        <line x1="60" y1="102" x2="60" y2="116" stroke="#38BDF8" strokeWidth="1.8" strokeLinecap="round" />
        {/* Left Crosshair */}
        <line x1="4" y1="60" x2="18" y2="60" stroke="#38BDF8" strokeWidth="1.8" strokeLinecap="round" />
        {/* Right Crosshair */}
        <line x1="102" y1="60" x2="116" y2="60" stroke="#38BDF8" strokeWidth="1.8" strokeLinecap="round" />

        {/* Outer Fine HUD Ring */}
        <circle cx="60" cy="60" r="52" stroke="#93C5FD" strokeWidth="0.8" opacity="0.5" strokeDasharray="3 4" />

        {/* 4 Outer Segmented Guide Arcs */}
        <path
          d="M 28 28 A 45 45 0 0 1 92 28"
          stroke="#38BDF8"
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
          opacity="0.85"
        />
        <path
          d="M 92 92 A 45 45 0 0 1 28 92"
          stroke="#38BDF8"
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
          opacity="0.85"
        />
        <path
          d="M 24 38 A 45 45 0 0 0 24 82"
          stroke="#38BDF8"
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
          opacity="0.85"
        />
        <path
          d="M 96 38 A 45 45 0 0 1 96 82"
          stroke="#38BDF8"
          strokeWidth="1.4"
          fill="none"
          strokeLinecap="round"
          opacity="0.85"
        />

        {/* 4 Outer Guide Dots */}
        <circle cx="28" cy="28" r="1.5" fill="#38BDF8" />
        <circle cx="92" cy="28" r="1.5" fill="#38BDF8" />
        <circle cx="28" cy="92" r="1.5" fill="#38BDF8" />
        <circle cx="92" cy="92" r="1.5" fill="#38BDF8" />

        {/* Outer Circular Reactor Bezel */}
        <circle cx="60" cy="60" r="38" stroke="url(#metallicRimGrad)" strokeWidth="2.5" fill="#0B132B" />

        {/* Segmented Iris Teeth (12 Radial Notches) */}
        {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
          <line
            key={deg}
            x1="60"
            y1="24"
            x2="60"
            y2="28"
            stroke="#60A5FA"
            strokeWidth="2"
            strokeLinecap="round"
            transform={`rotate(${deg} 60 60)`}
          />
        ))}

        {/* Reactor Interior Deep Chamber */}
        <circle cx="60" cy="60" r="31" fill="url(#reactorChamberGrad)" />

        {/* Glowing Concentric Cyan Mid-Ring */}
        <circle
          cx="60"
          cy="60"
          r="23"
          stroke="url(#cyanRimGrad)"
          strokeWidth="2"
          strokeDasharray="8 4"
          opacity="0.9"
        />

        {/* Inner Glowing Cyan Blade Petals (8 segments) */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
          <path
            key={deg}
            d="M 58 42 L 62 42 L 61 48 L 59 48 Z"
            fill="#38BDF8"
            opacity="0.8"
            transform={`rotate(${deg} 60 60)`}
          />
        ))}

        {/* Central Core Chamber Ring */}
        <circle cx="60" cy="60" r="14" fill="#0284C7" stroke="#38BDF8" strokeWidth="1.5" />

        {/* High-Intensity White Core with Cyan Glow Flare */}
        <circle cx="60" cy="60" r="9" fill="#FFFFFF" filter="url(#reactorGlow)" />
        <circle cx="60" cy="60" r="5" fill="#FFFFFF" />
      </svg>
    </div>
  );
};

export const Logo: React.FC<LogoProps> = ({
  variant = 'reactor',
  size = 38,
  className = '',
  isPulsing = false,
}) => {
  if (variant === 'reactor') {
    return <ReactorLogo size={size} className={className} isPulsing={isPulsing} />;
  }

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* 3D Iridescent Holographic Orb */}
      <div className={`relative flex items-center justify-center ${isPulsing ? 'animate-pulse' : ''}`}>
        <svg
          width={size}
          height={size}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transition-transform duration-500 hover:rotate-12 hover:scale-105"
        >
          <defs>
            <radialGradient id="sphereGradient" cx="38%" cy="32%" r="65%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
              <stop offset="25%" stopColor="#69E6FF" />
              <stop offset="55%" stopColor="#6E44FF" />
              <stop offset="85%" stopColor="#3B82F6" />
              <stop offset="100%" stopColor="#1E1B4B" />
            </radialGradient>
            <linearGradient id="rimLight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#69E6FF" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.3" />
            </linearGradient>
            <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>
          <circle cx="50" cy="50" r="42" fill="url(#sphereGradient)" opacity="0.3" filter="url(#softGlow)" />
          <circle cx="50" cy="50" r="40" fill="url(#sphereGradient)" />
          <circle cx="50" cy="50" r="40" stroke="url(#rimLight)" strokeWidth="1.5" />
          <ellipse cx="40" cy="34" rx="16" ry="9" fill="#FFFFFF" opacity="0.45" transform="rotate(-30 40 34)" />
        </svg>
      </div>

      {/* Wordmark (if full) */}
      {variant === 'full' && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 font-bold tracking-wider leading-none">
            <span className="text-slate-800 dark:text-white text-base font-bold tracking-tight">
              ARCK
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-[#2563EB]/10 text-[#2563EB] dark:text-[#60A5FA] font-bold">
              2046
            </span>
          </div>
          <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-slate-400 mt-0.5">
            Quantum Mesh
          </span>
        </div>
      )}
    </div>
  );
};

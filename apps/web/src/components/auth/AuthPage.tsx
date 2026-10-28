import React, { useState } from 'react';
import { ReactorLogo } from '../../brand/Logo';
import { useAuth } from '../../context/AuthContext';
import { KeyRound, Mail, User, ShieldCheck, Lock, Eye, EyeOff, Sparkles } from 'lucide-react';

export const AuthPage: React.FC = () => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isRegister) {
        await register({
          email: email.trim(),
          username: username.trim(),
          displayName: displayName.trim(),
          password,
        });
      } else {
        await login({
          login: (username || email).trim(),
          password,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Instant one-click demo operator session login
  const handleSelectDemoAccount = async (u: string, p = 'Nebula2046!') => {
    setIsRegister(false);
    setUsername(u);
    setPassword(p);
    setError(null);
    setIsSubmitting(true);
    try {
      await login({
        login: u,
        password: p,
      });
    } catch (err: any) {
      setError(err.message || 'Authentication error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 md:p-8 bg-[#F4F8FD] overflow-hidden select-none font-sans">
      {/* ========================================================================= */}
      {/* 1. FUTURISTIC QUANTUM HUD BACKGROUND SCENERY (EXACT MATCH FROM REFERENCE) */}
      {/* ========================================================================= */}

      {/* Subtle Radial Gradient Floor / Ambient Lighting */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,#FFFFFF_0%,#EDF5FC_60%,#E2EEFA_100%)] pointer-events-none" />

      {/* Vertical Subtle Cyan Laser Beam passing through center */}
      <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px] bg-gradient-to-b from-transparent via-[#38BDF8]/40 to-transparent pointer-events-none blur-[0.5px]" />

      {/* Large Concentric Quantum HUD Rings in Background */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {/* Outer Ring with Calibration Ticks */}
        <div className="w-[1040px] h-[1040px] rounded-full border border-[#D5E5F7]/70 absolute flex items-center justify-center">
          {/* Inner Segmented Concentric Circle */}
          <div className="w-[820px] h-[820px] rounded-full border border-[#C5DCF4]/60 border-dashed absolute" />
          {/* Middle Fine HUD Ring */}
          <div className="w-[620px] h-[620px] rounded-full border border-[#BBD5F2]/50 absolute" />
          {/* Inner Accent Ring */}
          <div className="w-[460px] h-[460px] rounded-full border border-[#93C5FD]/40 absolute" />
        </div>
      </div>

      {/* Circuit Trace Schematic Lines (SVG Overlay) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-60"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="circuitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#93C5FD" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Top-Left Trace */}
        <path d="M 120 40 L 40 40 L 40 180 L 160 300" stroke="#BFDBFE" strokeWidth="1" fill="none" />
        <circle cx="120" cy="40" r="2.5" fill="#38BDF8" />

        {/* Bottom-Left Diagonal Trace */}
        <path d="M 40 820 L 140 920 L 280 920" stroke="#BFDBFE" strokeWidth="1" fill="none" />
        <circle cx="280" cy="920" r="2.5" fill="#38BDF8" />

        {/* Top-Right Circuit Trace */}
        <path d="M 90% 40 L 96% 40 L 96% 180" stroke="#BFDBFE" strokeWidth="1" fill="none" />
        <circle cx="90%" cy="40" r="2.5" fill="#38BDF8" />

        {/* Bottom-Right Angular Circuit Trace */}
        <path d="M 94% 760 L 88% 840 L 82% 840" stroke="#BFDBFE" strokeWidth="1" fill="none" />
        <circle cx="82%" cy="840" r="2.5" fill="#38BDF8" />
      </svg>

      {/* ========================================================================= */}
      {/* 2. BACKGROUND HUD LABELS & METRICS READOUTS (EXACT REPRODUCTION)          */}
      {/* ========================================================================= */}

      {/* Top-Left HUD: STARK INDUSTRIES */}
      <div className="hidden lg:flex flex-col absolute top-12 left-12 text-[10px] font-mono tracking-widest text-[#7E95B4] uppercase select-none pointer-events-none leading-relaxed">
        <span className="font-semibold text-[#577296]">STARK</span>
        <span>INDUSTRIES</span>
        <div className="w-6 h-[1.5px] bg-[#93C5FD] mt-1" />
      </div>

      {/* Top-Right HUD: QUANTUM MESH v2.0.46 */}
      <div className="hidden lg:flex flex-col items-end absolute top-12 right-12 text-[10px] font-mono tracking-widest text-[#7E95B4] uppercase select-none pointer-events-none leading-relaxed text-right">
        <span className="font-semibold text-[#577296]">QUANTUM</span>
        <span>MESH</span>
        <span>v2.0.46</span>
        <div className="w-6 h-[1.5px] bg-[#93C5FD] mt-1" />
      </div>

      {/* Mid-Left HUD: SECURE CONNECTION ESTABLISHED + 6 Vertical Dots */}
      <div className="hidden lg:flex flex-col absolute top-1/2 -translate-y-12 left-10 text-[9px] font-mono tracking-wider text-[#7E95B4] uppercase select-none pointer-events-none leading-normal">
        <span className="font-semibold text-[#4A6487]">SECURE</span>
        <span>CONNECTION</span>
        <span>ESTABLISHED</span>
        <div className="w-6 h-[2px] bg-[#38BDF8] my-2" />
        {/* 6 Vertical Dots */}
        <div className="flex flex-col gap-2 mt-4 ml-1">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-[#93C5FD]" />
          ))}
        </div>
      </div>

      {/* Mid-Right HUD: SYSTEM ONLINE + Core Metrics + 6 Vertical Dots */}
      <div className="hidden lg:flex flex-col absolute top-1/2 -translate-y-20 right-10 text-[9px] font-mono tracking-wider text-[#7E95B4] uppercase select-none pointer-events-none leading-normal">
        <span className="font-semibold text-[#4A6487]">SYSTEM</span>
        <span>ONLINE</span>
        <div className="w-6 h-[2px] bg-[#38BDF8] my-1.5" />
        <div className="space-y-0.5 mt-2 text-[8.5px]">
          <div>CORE : OK</div>
          <div>MESH : OK</div>
          <div>NODES : SYNC</div>
          <div>SIGNAL : STABLE</div>
        </div>
        {/* 6 Vertical Dots */}
        <div className="flex flex-col gap-2 mt-4 ml-1">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-[#93C5FD]" />
          ))}
        </div>
        {/* Bottom 2x3 Grid of Dots */}
        <div className="grid grid-cols-2 gap-2 mt-8 ml-1">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-[#BFDBFE]" />
          ))}
        </div>
      </div>

      {/* Bottom Floor Horizon Line & Diffuse Glow */}
      <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-white/95 to-transparent pointer-events-none border-t border-[#D5E5F7]/50" />

      {/* ========================================================================= */}
      {/* 3. CENTRAL FROSTED GLASS WINDOW (EXACT GEOMETRY & STYLING)               */}
      {/* ========================================================================= */}
      <div className="relative z-10 w-full max-w-[480px] rounded-[32px] bg-white/75 backdrop-blur-2xl border border-[#CDE1F8] shadow-[0_24px_60px_rgba(37,99,235,0.1),0_4px_16px_rgba(0,0,0,0.03)] p-7 sm:p-9 transition-all">
        {/* Top-Right Sci-Fi Corner Bracket Accent */}
        <svg
          className="absolute top-4 right-4 w-7 h-7 pointer-events-none text-[#38BDF8]"
          viewBox="0 0 28 28"
          fill="none"
        >
          <path d="M 2 2 L 26 2 L 26 26" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>

        {/* Left Edge Cyan Notch Accent */}
        <div className="absolute -left-[2px] top-28 w-1 h-11 bg-[#38BDF8] rounded-r-sm shadow-[0_0_8px_#38BDF8]" />

        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          {/* Reactor Logo */}
          <div className="mb-2">
            <ReactorLogo size={78} isPulsing />
          </div>

          {/* Brand Name: ARCK (Replacing NEBULA 2046 per global specification) */}
          <div className="text-[28px] font-black tracking-[0.14em] font-sans flex items-center justify-center gap-1.5 leading-none">
            <span className="text-[#0B1528]">AR</span>
            <span className="text-[#2563EB]">CK</span>
          </div>

          {/* Letter-spaced Subtitle: QUANTUM MESH */}
          <div className="text-[10px] font-mono tracking-[0.45em] text-[#556987] font-bold uppercase mt-1.5">
            QUANTUM MESH
          </div>

          {/* Contextual Description */}
          <p className="text-xs font-mono text-[#5B6B82] text-center mt-3 max-w-[320px] leading-relaxed">
            {isRegister
              ? 'Enroll operator credentials into the quantum communications mesh'
              : 'Authenticate quantum session for terminal access'}
          </p>
        </div>

        {/* Error Alert (if present) */}
        {error && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-mono text-center shadow-sm">
            {error}
          </div>
        )}

        {/* Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              {/* Registration: EMAIL ADDRESS */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono uppercase tracking-wider font-semibold text-[#4A5D78]">
                  EMAIL ADDRESS
                </label>
                <div className="relative flex items-center h-[52px] px-4 rounded-2xl bg-[#F0F5FC]/90 border border-[#BFD5F2] hover:border-[#93C5FD] focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/15 shadow-[inset_0_1px_3px_rgba(37,99,235,0.04)] transition-all">
                  <Mail className="w-5 h-5 text-[#2563EB] shrink-0" strokeWidth={1.8} />
                  <div className="w-[1.5px] h-6 bg-[#D1E2F6] mx-3.5 shrink-0" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operator@nebula.io"
                    className="w-full bg-transparent text-xs font-mono text-[#0F172A] placeholder:text-[#8E9EB5] outline-none"
                  />
                </div>
              </div>

              {/* Registration: CALLSIGN / DISPLAY NAME */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-mono uppercase tracking-wider font-semibold text-[#4A5D78]">
                  CALLSIGN / DISPLAY NAME
                </label>
                <div className="relative flex items-center h-[52px] px-4 rounded-2xl bg-[#F0F5FC]/90 border border-[#BFD5F2] hover:border-[#93C5FD] focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/15 shadow-[inset_0_1px_3px_rgba(37,99,235,0.04)] transition-all">
                  <User className="w-5 h-5 text-[#2563EB] shrink-0" strokeWidth={1.8} />
                  <div className="w-[1.5px] h-6 bg-[#D1E2F6] mx-3.5 shrink-0" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="e.g. Commander Marcus"
                    className="w-full bg-transparent text-xs font-mono text-[#0F172A] placeholder:text-[#8E9EB5] outline-none"
                  />
                </div>
              </div>
            </>
          )}

          {/* Username Field */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono uppercase tracking-wider font-semibold text-[#4A5D78]">
              {isRegister ? 'UNIQUE USERNAME' : 'USERNAME OR EMAIL'}
            </label>
            <div className="relative flex items-center h-[52px] px-4 rounded-2xl bg-[#F0F5FC]/90 border border-[#BFD5F2] hover:border-[#93C5FD] focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/15 shadow-[inset_0_1px_3px_rgba(37,99,235,0.04)] transition-all">
              {isRegister ? (
                <ShieldCheck className="w-5 h-5 text-[#2563EB] shrink-0" strokeWidth={1.8} />
              ) : (
                <User className="w-5 h-5 text-[#2563EB] shrink-0" strokeWidth={1.8} />
              )}
              <div className="w-[1.5px] h-6 bg-[#D1E2F6] mx-3.5 shrink-0" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isRegister ? 'operator_id' : 'alex_vance or email'}
                className="w-full bg-transparent text-xs font-mono text-[#0F172A] placeholder:text-[#8E9EB5] outline-none"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-mono uppercase tracking-wider font-semibold text-[#4A5D78]">
              SECURITY KEY / PASSWORD
            </label>
            <div className="relative flex items-center h-[52px] px-4 rounded-2xl bg-[#F0F5FC]/90 border border-[#BFD5F2] hover:border-[#93C5FD] focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/15 shadow-[inset_0_1px_3px_rgba(37,99,235,0.04)] transition-all">
              {isRegister ? (
                <KeyRound className="w-5 h-5 text-[#2563EB] shrink-0" strokeWidth={1.8} />
              ) : (
                <Lock className="w-5 h-5 text-[#2563EB] shrink-0" strokeWidth={1.8} />
              )}
              <div className="w-[1.5px] h-6 bg-[#D1E2F6] mx-3.5 shrink-0" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-transparent text-xs font-mono text-[#0F172A] placeholder:text-[#8E9EB5] outline-none tracking-widest"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="ml-2 text-[#475569] hover:text-[#2563EB] transition-colors p-1"
                title={showPassword ? 'Hide security key' : 'Show security key'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Primary Action Button (Gradient Pill with Reactor Lens Detail) */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="relative w-full h-[52px] rounded-full bg-gradient-to-r from-[#38BDF8] via-[#2563EB] to-[#1D4ED8] hover:opacity-95 text-white font-sans font-semibold text-sm tracking-wide shadow-[0_8px_25px_rgba(37,99,235,0.38),0_0_18px_rgba(56,189,248,0.3)] border border-[#7DD3FC]/70 flex items-center justify-between px-6 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] group mt-5 disabled:opacity-60"
          >
            {/* Subtle Chevron watermark on left */}
            <div className="w-8 shrink-0 flex items-center justify-start opacity-40">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M4 2L8 6L4 10" stroke="white" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>

            {/* Centered Button Text */}
            <span className="flex-1 text-center font-medium tracking-wide flex items-center justify-center gap-2">
              {isSubmitting ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <>
                  <span>{isRegister ? 'Complete Registration' : 'Establish Session'}</span>
                  <span className="text-base group-hover:translate-x-1 transition-transform">→</span>
                </>
              )}
            </span>

            {/* Circular Reactor Lens Detail on Far Right */}
            <div className="w-8 h-8 rounded-full border border-white/50 bg-white/15 flex items-center justify-center shrink-0 shadow-inner">
              <div className="w-5 h-5 rounded-full border border-[#93C5FD]/80 bg-[#1E40AF]/80 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_6px_#38BDF8]" />
              </div>
            </div>
          </button>
        </form>

        {/* Mode Toggle Link */}
        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="text-xs font-mono text-[#5B6B82] transition-colors"
          >
            {isRegister ? (
              <>
                Already registered?{' '}
                <span className="text-[#2563EB] hover:underline font-medium">
                  Authenticate existing session →
                </span>
              </>
            ) : (
              <>
                Need credentials?{' '}
                <span className="text-[#2563EB] hover:underline font-medium">
                  Enroll new operator account →
                </span>
              </>
            )}
          </button>
        </div>

        {/* Divider with Center Tick */}
        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#D5E3F3]" />
          </div>
          <div className="relative z-10 w-10 h-[2.5px] bg-[#2563EB] rounded-full" />
        </div>

        {/* Demo Accounts Section */}
        <div>
          <div className="text-[10px] font-mono tracking-[0.2em] uppercase text-[#64748B] font-semibold text-center mb-3 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>INSTANT DEMO ACCOUNTS (ONE-CLICK)</span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {/* Alex Vance */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSelectDemoAccount('alex_vance')}
              className="p-2.5 rounded-2xl bg-white/70 hover:bg-white border border-[#D5E3F3] hover:border-[#93C5FD] shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] text-left flex items-center gap-2.5 group disabled:opacity-60"
            >
              <div className="w-8 h-8 rounded-full bg-[#DBEAFE] border border-[#BFDBFE] text-[#2563EB] flex items-center justify-center shrink-0">
                <User className="w-4 h-4" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-sans font-bold text-xs text-[#0F172A] truncate leading-tight group-hover:text-[#2563EB] transition-colors">
                  Alex Vance
                </div>
                <div className="font-mono text-[9px] text-[#64748B] truncate mt-0.5">Cyberneticist</div>
              </div>
            </button>

            {/* Elena R. */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSelectDemoAccount('elena_rostova')}
              className="p-2.5 rounded-2xl bg-white/70 hover:bg-white border border-[#D5E3F3] hover:border-[#A7F3D0] shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] text-left flex items-center gap-2.5 group disabled:opacity-60"
            >
              <div className="w-8 h-8 rounded-full bg-[#D1FAE5] border border-[#A7F3D0] text-[#10B981] flex items-center justify-center shrink-0">
                <User className="w-4 h-4" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-sans font-bold text-xs text-[#0F172A] truncate leading-tight group-hover:text-[#10B981] transition-colors">
                  Elena R.
                </div>
                <div className="font-mono text-[9px] text-[#64748B] truncate mt-0.5">Commander</div>
              </div>
            </button>

            {/* Kai Chen */}
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSelectDemoAccount('kai_chen')}
              className="p-2.5 rounded-2xl bg-white/70 hover:bg-white border border-[#D5E3F3] hover:border-[#DDD6FE] shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] text-left flex items-center gap-2.5 group disabled:opacity-60"
            >
              <div className="w-8 h-8 rounded-full bg-[#EDE9FE] border border-[#DDD6FE] text-[#8B5CF6] flex items-center justify-center shrink-0">
                <User className="w-4 h-4" strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-sans font-bold text-xs text-[#0F172A] truncate leading-tight group-hover:text-[#8B5CF6] transition-colors">
                  Kai Chen
                </div>
                <div className="font-mono text-[9px] text-[#64748B] truncate mt-0.5">Quantum Lead</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

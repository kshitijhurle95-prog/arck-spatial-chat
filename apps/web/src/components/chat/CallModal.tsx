import React, { useEffect, useRef, useState } from 'react';
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  Sparkles,
} from 'lucide-react';
import { useSocket, IncomingCallData } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { SOCKET_EVENTS, CallType } from '@nebula/shared';
import { getResilientUserMedia } from '../../lib/webrtc';

interface CallModalProps {
  activeCallTarget: { userId: string; callType: CallType; conversationId: string } | null;
  incomingCall: IncomingCallData | null;
  onClose: () => void;
}

export const CallModal: React.FC<CallModalProps> = ({
  activeCallTarget,
  incomingCall,
  onClose,
}) => {
  const { user } = useAuth();
  const { socket, setIncomingCall } = useSocket();

  const [callState, setCallState] = useState<'RINGING' | 'CONNECTED' | 'ENDED'>('RINGING');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(
    activeCallTarget?.callType === 'VIDEO' || incomingCall?.callType === 'VIDEO'
  );
  const [isVirtualFeed, setIsVirtualFeed] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const isCaller = !!activeCallTarget;
  const targetUser = isCaller ? null : incomingCall?.caller;

  useEffect(() => {
    if (!socket) return;

    const configuration: RTCConfiguration = {
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    };

    const pc = new RTCPeerConnection(configuration);
    peerConnectionRef.current = pc;

    // Send ICE candidates to peer
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit(SOCKET_EVENTS.CALL_SIGNAL, {
          targetUserId: isCaller ? activeCallTarget?.userId : incomingCall?.caller.id,
          signalData: { type: 'candidate', candidate: event.candidate },
        });
      }
    };

    // Receive Remote Stream
    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    // If caller, initiate media capture and call offer
    if (isCaller && activeCallTarget) {
      getResilientUserMedia(activeCallTarget.callType, user?.displayName || 'Alex Vance')
        .then(async ({ stream, isVirtual }) => {
          localStreamRef.current = stream;
          setIsVirtualFeed(isVirtual);

          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }

          stream.getTracks().forEach((track) => pc.addTrack(track, stream));

          // Initiate call over socket
          socket.emit(SOCKET_EVENTS.CALL_INITIATE, {
            calleeId: activeCallTarget.userId,
            conversationId: activeCallTarget.conversationId,
            callType: activeCallTarget.callType,
          });

          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);

          socket.emit(SOCKET_EVENTS.CALL_SIGNAL, {
            targetUserId: activeCallTarget.userId,
            signalData: offer,
          });
        })
        .catch((err) => {
          console.error('Call initialization fallback:', err);
        });
    }

    // Listen for peer accepted event
    socket.on(SOCKET_EVENTS.CALL_ACCEPTED, () => {
      setCallState('CONNECTED');
      startTimer();
    });

    socket.on(SOCKET_EVENTS.CALL_REJECTED, () => {
      setCallState('ENDED');
      setTimeout(handleEndCall, 1200);
    });

    // Listen for remote signals (offer, answer, candidate)
    socket.on(SOCKET_EVENTS.CALL_SIGNAL, async (payload: any) => {
      const { signalData } = payload;
      if (!signalData) return;

      try {
        if (signalData.type === 'offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signalData));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);

          socket.emit(SOCKET_EVENTS.CALL_SIGNAL, {
            targetUserId: incomingCall?.caller.id,
            signalData: answer,
          });
        } else if (signalData.type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(signalData));
        } else if (signalData.type === 'candidate' && signalData.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
        }
      } catch (err) {
        console.error('WebRTC signal handling:', err);
      }
    });

    socket.on(SOCKET_EVENTS.CALL_ENDED, () => {
      handleEndCall();
    });

    return () => {
      cleanupMedia();
    };
  }, [socket, isCaller, activeCallTarget, incomingCall]);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const cleanupMedia = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
  };

  const handleAcceptIncoming = async () => {
    if (!socket || !incomingCall || !peerConnectionRef.current) return;
    const pc = peerConnectionRef.current;

    try {
      const { stream, isVirtual } = await getResilientUserMedia(
        incomingCall.callType,
        user?.displayName || 'Elena Rostova'
      );

      localStreamRef.current = stream;
      setIsVirtualFeed(isVirtual);

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      socket.emit(SOCKET_EVENTS.CALL_ACCEPT, {
        callId: incomingCall.callId,
        callerId: incomingCall.caller.id,
      });

      setCallState('CONNECTED');
      startTimer();
    } catch (err) {
      console.error('Error accepting call:', err);
      handleRejectIncoming();
    }
  };

  const handleRejectIncoming = () => {
    if (socket && incomingCall) {
      socket.emit(SOCKET_EVENTS.CALL_REJECT, {
        callId: incomingCall.callId,
        callerId: incomingCall.caller.id,
      });
    }
    setIncomingCall(null);
    onClose();
  };

  const handleEndCall = () => {
    cleanupMedia();
    if (socket) {
      socket.emit(SOCKET_EVENTS.CALL_END, {
        callId: incomingCall?.callId || 'call',
        targetUserId: isCaller ? activeCallTarget?.userId : incomingCall?.caller.id,
      });
    }
    setIncomingCall(null);
    onClose();
  };

  const toggleMic = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
        setIsMuted(!track.enabled);
      });
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
        setIsVideoEnabled(track.enabled);
      });
    }
  };

  const formatCallTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // 1. INCOMING CALL PROMPT (Ringing)
  if (!isCaller && incomingCall && callState === 'RINGING') {
    return (
      <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-[32px] bg-white/90 dark:bg-[#15132B]/95 border border-white/60 dark:border-white/10 shadow-2xl p-6 flex flex-col items-center text-center space-y-5 animate-in zoom-in-95">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#6E44FF] bg-slate-100 dark:bg-white/5 shadow-lg flex items-center justify-center">
              {incomingCall.caller.avatarUrl ? (
                <img
                  src={incomingCall.caller.avatarUrl}
                  alt={incomingCall.caller.displayName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold font-mono text-[#6E44FF]">
                  {incomingCall.caller.displayName.substring(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <span className="absolute inset-0 rounded-full border-2 border-[#6E44FF] animate-ping pointer-events-none opacity-40" />
          </div>

          <div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-white font-sans">
              {incomingCall.caller.displayName}
            </h3>
            <p className="text-xs font-mono text-[#6E44FF] dark:text-[#A78BFA] mt-1">
              Incoming {incomingCall.callType === 'VIDEO' ? 'Spatial Video' : 'Audio'} Call...
            </p>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <button
              onClick={handleRejectIncoming}
              className="w-14 h-14 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95"
              title="Decline"
            >
              <PhoneOff className="w-6 h-6" />
            </button>

            <button
              onClick={handleAcceptIncoming}
              className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-110 active:scale-95 animate-bounce"
              title="Accept"
            >
              <Phone className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. ACTIVE CALL WORKSPACE
  return (
    <div className="fixed inset-0 bg-slate-900/75 dark:bg-black/90 backdrop-blur-xl z-50 flex flex-col items-center justify-between p-6 select-none animate-in fade-in duration-300">
      {/* Top Bar: Caller Info & Duration */}
      <div className="w-full max-w-4xl flex items-center justify-between z-10 bg-white/10 dark:bg-white/5 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#6E44FF]/20 border border-[#6E44FF] flex items-center justify-center font-mono font-bold text-[#6E44FF] dark:text-white">
            {targetUser?.displayName?.substring(0, 2).toUpperCase() || 'OP'}
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white font-sans">
              {targetUser?.displayName || (activeCallTarget ? 'Live Call Connection' : 'Quantum Stream')}
            </h4>
            <p className="text-xs font-mono text-[#A78BFA]">
              {callState === 'RINGING' ? 'Ringing destination...' : formatCallTime(callDuration)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isVirtualFeed && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono text-[11px]">
              <Sparkles className="w-3 h-3" />
              <span>Simulated Stream</span>
            </span>
          )}
          <div className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>STUN Connected</span>
          </div>
        </div>
      </div>

      {/* Main Video Display */}
      <div className="relative w-full max-w-4xl flex-1 my-6 rounded-[32px] overflow-hidden bg-slate-950/80 border border-white/15 flex items-center justify-center shadow-2xl">
        {/* Remote Video Stream */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={`w-full h-full object-cover ${callState === 'CONNECTED' ? 'block' : 'hidden'}`}
        />

        {/* Audio Waveform / Avatar Display if not connected or audio only */}
        {callState !== 'CONNECTED' && (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-28 h-28 rounded-full border-2 border-[#6E44FF] flex items-center justify-center bg-[#6E44FF]/10 shadow-lg shadow-[#6E44FF]/25 animate-pulse">
              <Volume2 className="w-12 h-12 text-[#A78BFA]" />
            </div>
            <p className="text-xs font-mono text-slate-300 uppercase tracking-widest">
              {callState === 'RINGING' ? 'Awaiting Operator Acceptance...' : 'Connected'}
            </p>
          </div>
        )}

        {/* Local Picture-in-Picture Video */}
        <div className="absolute bottom-4 right-4 w-44 h-32 rounded-2xl overflow-hidden border-2 border-[#6E44FF] bg-black shadow-xl">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Bottom Control Bar */}
      <div className="flex items-center gap-4 z-10 bg-white/10 dark:bg-white/5 backdrop-blur-md px-6 py-3 rounded-full border border-white/20">
        {/* Mute Toggle */}
        <button
          onClick={toggleMic}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            isMuted ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50' : 'bg-white/15 text-white hover:bg-white/25'
          }`}
          title={isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Camera Toggle */}
        <button
          onClick={toggleCamera}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
            !isVideoEnabled ? 'bg-rose-500/30 text-rose-300 border border-rose-500/50' : 'bg-white/15 text-white hover:bg-white/25'
          }`}
          title={isVideoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
        >
          {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        {/* End Call Button */}
        <button
          onClick={handleEndCall}
          className="w-13 h-13 px-4 py-3 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
          title="End Transmission"
        >
          <PhoneOff className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

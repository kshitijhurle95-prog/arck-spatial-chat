import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io as SocketIOClient, Socket } from 'socket.io-client';
import { SOCKET_EVENTS, CallType, UserSummary } from '@nebula/shared';
import { useAuth } from './AuthContext';
import { getApiToken } from '../lib/api';
import { sounds } from '../brand/SoundEffects';

export interface IncomingCallData {
  callId: string;
  conversationId: string;
  caller: UserSummary;
  callType: CallType;
}

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  onlineUsers: Set<string>;
  typingUsers: Map<string, string>; // conversationId -> displayName
  incomingCall: IncomingCallData | null;
  setIncomingCall: (call: IncomingCallData | null) => void;
  joinConversationRoom: (conversationId: string) => void;
  leaveConversationRoom: (conversationId: string) => void;
  startTyping: (conversationId: string) => void;
  stopTyping: (conversationId: string) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const typingTimerRef = useRef<{ [key: string]: NodeJS.Timeout }>({});

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const token = getApiToken();
    const newSocket = SocketIOClient(window.location.origin, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on(SOCKET_EVENTS.CONNECT, () => {
      setIsConnected(true);
    });

    newSocket.on(SOCKET_EVENTS.DISCONNECT, () => {
      setIsConnected(false);
    });

    // Real-time presence change
    newSocket.on(
      SOCKET_EVENTS.USER_PRESENCE_CHANGED,
      (data: { userId: string; isOnline: boolean; status: string }) => {
        setOnlineUsers((prev) => {
          const updated = new Set(prev);
          if (data.isOnline) {
            updated.add(data.userId);
          } else {
            updated.delete(data.userId);
          }
          return updated;
        });
      }
    );

    // Ephemeral typing updates
    newSocket.on(
      SOCKET_EVENTS.USER_TYPING,
      (data: { conversationId: string; userId: string; displayName: string; isTyping: boolean }) => {
        if (data.userId === user.id) return;

        setTypingUsers((prev) => {
          const updated = new Map(prev);
          if (data.isTyping) {
            updated.set(data.conversationId, data.displayName);

            // Auto-clear after 3.5 seconds in case stopTyping was missed
            if (typingTimerRef.current[data.conversationId]) {
              clearTimeout(typingTimerRef.current[data.conversationId]);
            }
            typingTimerRef.current[data.conversationId] = setTimeout(() => {
              setTypingUsers((inner) => {
                const next = new Map(inner);
                next.delete(data.conversationId);
                return next;
              });
            }, 3500);
          } else {
            updated.delete(data.conversationId);
          }
          return updated;
        });
      }
    );

    // WebRTC Incoming Call Alert
    newSocket.on(SOCKET_EVENTS.CALL_INCOMING, (callData: IncomingCallData) => {
      setIncomingCall(callData);
      sounds.playIncomingCallTone();
    });

    newSocket.on(SOCKET_EVENTS.CALL_ENDED, () => {
      setIncomingCall(null);
      sounds.playCallEndTone();
    });

    return () => {
      newSocket.disconnect();
      socketRef.current = null;
    };
  }, [user]);

  const joinConversationRoom = (conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(SOCKET_EVENTS.JOIN_CONVERSATION, { conversationId });
    }
  };

  const leaveConversationRoom = (conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(SOCKET_EVENTS.LEAVE_CONVERSATION, { conversationId });
    }
  };

  const startTyping = (conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(SOCKET_EVENTS.TYPING_START, { conversationId });
    }
  };

  const stopTyping = (conversationId: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(SOCKET_EVENTS.TYPING_STOP, { conversationId });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        onlineUsers,
        typingUsers,
        incomingCall,
        setIncomingCall,
        joinConversationRoom,
        leaveConversationRoom,
        startTyping,
        stopTyping,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider');
  return context;
};

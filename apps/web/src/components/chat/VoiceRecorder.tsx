import React, { useEffect, useRef, useState } from 'react';
import { Mic, Square, Trash2, Send } from 'lucide-react';
import { api } from '../../lib/api';

interface VoiceRecorderProps {
  onRecorded: (attachmentId: string, durationSec: number) => void;
  onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onRecorded, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startAudioCapture() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        // Real-time Waveform Visualizer
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const canvas = canvasRef.current;
        const canvasCtx = canvas?.getContext('2d');

        const drawWaveform = () => {
          animationFrameRef.current = requestAnimationFrame(drawWaveform);
          analyser.getByteFrequencyData(dataArray);

          if (!canvas || !canvasCtx) return;
          canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

          const barWidth = (canvas.width / bufferLength) * 1.5;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * canvas.height * 0.9;
            canvasCtx.fillStyle = '#69E6FF';
            canvasCtx.fillRect(x, (canvas.height - barHeight) / 2, barWidth - 2, barHeight);
            x += barWidth;
          }
        };

        drawWaveform();
        mediaRecorder.start();
        setIsRecording(true);

        timerRef.current = setInterval(() => {
          setSeconds((prev) => prev + 1);
        }, 1000);
      } catch (err) {
        console.error('Microphone access denied:', err);
        alert('Microphone permission denied or not supported on this device.');
        onCancel();
      }
    }

    startAudioCapture();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {});
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [onCancel]);

  const handleStopAndSend = () => {
    if (!mediaRecorderRef.current) return;
    setIsUploading(true);

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });

      try {
        const uploadRes = await api.uploadFile(audioFile);
        onRecorded(uploadRes.file.filename, seconds);
      } catch (err) {
        console.error('Failed to upload audio:', err);
        alert('Failed to transmit voice recording.');
      } finally {
        setIsUploading(false);
      }
    };

    mediaRecorderRef.current.stop();
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${mins}:${remaining < 10 ? '0' : ''}${remaining}`;
  };

  return (
    <div className="flex items-center gap-3 w-full py-1.5 px-3 rounded-2xl bg-nebula-card light:bg-light-card border border-nebula-cyan/40 shadow-glow-cyan animate-pulse-slow">
      {/* Live Recording Pulse */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
        <span className="text-xs font-mono font-bold text-rose-400">{formatTimer(seconds)}</span>
      </div>

      {/* Waveform Visualizer Canvas */}
      <div className="flex-1 h-8 flex items-center justify-center overflow-hidden">
        <canvas ref={canvasRef} width={220} height={32} className="w-full h-8" />
      </div>

      {/* Controls: Discard and Send */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onCancel}
          disabled={isUploading}
          className="p-2 rounded-xl text-nebula-muted hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
          title="Discard Voice Note"
        >
          <Trash2 className="w-4 h-4" />
        </button>

        <button
          onClick={handleStopAndSend}
          disabled={isUploading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-nebula-cyan to-nebula-violet text-nebula-bg font-mono text-xs font-bold hover:scale-105 active:scale-95 transition-all shadow-glow-cyan"
          title="Transmit Voice Transmission"
        >
          {isUploading ? (
            <div className="w-3.5 h-3.5 rounded-full border-2 border-nebula-bg border-t-transparent animate-spin" />
          ) : (
            <>
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

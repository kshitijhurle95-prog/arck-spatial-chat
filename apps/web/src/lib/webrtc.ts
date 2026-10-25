// ==============================================================================
// ARCK - RESILIENT WEBRTC MEDIA STREAM ACQUISITION
// ==============================================================================

/**
 * Creates an animated virtual video canvas stream for environments
 * without physical cameras or when camera permission is restricted.
 */
export function createVirtualVideoStream(userName = 'Operator', isVideo = true): MediaStream {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');

  let hue = 250;
  let angle = 0;

  const draw = () => {
    if (!ctx) return;
    angle += 0.02;
    hue = (hue + 0.1) % 360;

    // Futuristic gradient background
    const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    grad.addColorStop(0, '#15132B');
    grad.addColorStop(0.5, '#22194D');
    grad.addColorStop(1, '#0F172A');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Glowing orbital circles
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);

    ctx.beginPath();
    ctx.arc(0, 0, 90 + Math.sin(angle * 2) * 8, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(110, 68, 255, 0.4)';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, 115 + Math.cos(angle * 1.5) * 10, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(105, 230, 255, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 6]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Central avatar node
    ctx.beginPath();
    ctx.arc(0, 0, 52, 0, Math.PI * 2);
    ctx.fillStyle = '#6E44FF';
    ctx.shadowColor = '#6E44FF';
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Initials
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 28px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(userName.substring(0, 2).toUpperCase(), 0, 2);

    ctx.restore();

    // Text labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = '600 16px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(userName, canvas.width / 2, canvas.height / 2 + 100);

    ctx.fillStyle = isVideo ? '#69E6FF' : '#A78BFA';
    ctx.font = '12px "JetBrains Mono", monospace';
    ctx.fillText(
      isVideo ? '● LIVE SPATIAL STREAM' : '● AUDIO CALL STREAM',
      canvas.width / 2,
      canvas.height / 2 + 125
    );

    requestAnimationFrame(draw);
  };

  draw();

  const videoStream = canvas.captureStream(30);

  // Add silent synthesized audio track so WebRTC audio channel always negotiates cleanly
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtx) {
      const audioCtx = new AudioCtx();
      const dest = audioCtx.createMediaStreamDestination();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      gain.gain.value = 0.0001; // virtually silent carrier
      osc.connect(gain);
      gain.connect(dest);
      osc.start();
      const audioTrack = dest.stream.getAudioTracks()[0];
      if (audioTrack) {
        videoStream.addTrack(audioTrack);
      }
    }
  } catch (e) {
    console.warn('Virtual audio generation skipped:', e);
  }

  return videoStream;
}

/**
 * Resilient media acquisition:
 * 1. Attempts physical hardware.
 * 2. If video fails, falls back to audio-only.
 * 3. If audio also fails (no mic / permission denied), seamlessly falls back
 *    to virtual media stream so the call NEVER breaks or triggers alerts!
 */
export async function getResilientUserMedia(
  callType: 'AUDIO' | 'VIDEO',
  userName = 'Operator'
): Promise<{ stream: MediaStream; isVirtual: boolean }> {
  // Step 1: Try requested hardware
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'VIDEO',
      });
      return { stream, isVirtual: false };
    } catch (primaryErr: any) {
      console.warn('Requested media hardware unavailable, trying audio-only fallback:', primaryErr.message);

      // Step 2: If video failed, try audio only
      if (callType === 'VIDEO') {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          // Add virtual video track to audio stream
          const virtualVideoStream = createVirtualVideoStream(userName, true);
          const videoTrack = virtualVideoStream.getVideoTracks()[0];
          if (videoTrack) {
            audioStream.addTrack(videoTrack);
          }
          return { stream: audioStream, isVirtual: true };
        } catch (audioErr: any) {
          console.warn('Audio hardware also unavailable, falling back to virtual stream:', audioErr.message);
        }
      }
    }
  }

  // Step 3: Virtual stream fallback (guaranteed to succeed on all browsers & headless environments)
  const virtualStream = createVirtualVideoStream(userName, callType === 'VIDEO');
  return { stream: virtualStream, isVirtual: true };
}

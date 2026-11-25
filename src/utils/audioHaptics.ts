let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtor) return null;
  if (!audioCtx) {
    audioCtx = new AudioCtor();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function triggerHaptic(enabled: boolean, durationMs = 12): void {
  if (!enabled || typeof navigator === 'undefined' || !navigator.vibrate) return;
  try {
    navigator.vibrate(durationMs);
  } catch {
    // Ignore on browsers without vibration permission
  }
}

export function playTactileClick(
  enabled: boolean,
  variant: 'key' | 'button' | 'trigger' | 'pad' = 'button'
): void {
  if (!enabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const freq =
      variant === 'trigger'
        ? 145
        : variant === 'pad'
          ? 240
          : variant === 'key'
            ? 420
            : 310;

    osc.type = variant === 'trigger' ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.52, now + 0.032);

    gain.gain.setValueAtTime(0.055, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  } catch {
    // Ignore audio errors when context is blocked
  }
}

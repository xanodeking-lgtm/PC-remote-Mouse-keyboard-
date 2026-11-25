import React, { useRef, useState } from 'react';
import { Lock, LockOpen, ArrowUpDown } from 'lucide-react';
import type {
  ControllerSettings,
  InputEventPayload,
  MouseButton,
} from '../types/controller';
import { computeTrackpadDelta } from '../utils/inputMath';
import { playTactileClick, triggerHaptic } from '../utils/audioHaptics';

interface MouseTrackpadViewProps {
  settings: ControllerSettings;
  onUpdateSettings: (patch: Partial<ControllerSettings>) => void;
  onEmitInput: (payload: InputEventPayload) => void;
}

interface ActiveTouch {
  x: number;
  y: number;
  startX: number;
  startY: number;
  startTime: number;
  movedDistance: number;
}

export const MouseTrackpadView: React.FC<MouseTrackpadViewProps> = ({
  settings,
  onUpdateSettings,
  onEmitInput,
}) => {
  const pointersRef = useRef<Map<number, ActiveTouch>>(new Map());
  const scrollPointerRef = useRef<{ id: number; lastY: number } | null>(null);
  const [dragLocked, setDragLocked] = useState(false);
  const [activeButtons, setActiveButtons] = useState<Set<MouseButton>>(
    () => new Set()
  );
  const [lastGestureHint, setLastGestureHint] = useState<string>(
    '1-finger move · Tap to click · 2-finger tap right-click'
  );

  const handlePadPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    pointersRef.current.set(e.pointerId, {
      x: e.clientX,
      y: e.clientY,
      startX: e.clientX,
      startY: e.clientY,
      startTime: performance.now(),
      movedDistance: 0,
    });
  };

  const handlePadPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const entry = pointersRef.current.get(e.pointerId);
    if (!entry) return;

    const rawDx = e.clientX - entry.x;
    const rawDy = e.clientY - entry.y;
    entry.x = e.clientX;
    entry.y = e.clientY;
    entry.movedDistance += Math.hypot(rawDx, rawDy);

    if (pointersRef.current.size === 1) {
      const { dx, dy } = computeTrackpadDelta(
        rawDx,
        rawDy,
        settings.pointerSpeed,
        settings.pointerAcceleration
      );
      if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
        onEmitInput({
          kind: 'mouse:move',
          dx,
          dy,
          source: 'trackpad',
        });
      }
    } else if (pointersRef.current.size === 2) {
      // Two-finger vertical scroll gesture on trackpad
      const dir = settings.naturalScroll ? -1 : 1;
      const scrollDy = rawDy * settings.scrollSpeed * dir;
      if (Math.abs(scrollDy) > 0.1) {
        onEmitInput({ kind: 'mouse:scroll', dy: scrollDy });
      }
    }
  };

  const handlePadPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const entry = pointersRef.current.get(e.pointerId);
    const activeCountBeforeDelete = pointersRef.current.size;
    pointersRef.current.delete(e.pointerId);

    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }

    if (!entry) return;
    const elapsed = performance.now() - entry.startTime;

    if (settings.tapToClick && entry.movedDistance < 8 && elapsed < 260) {
      if (activeCountBeforeDelete >= 2) {
        onEmitInput({ kind: 'mouse:button', button: 'right', action: 'click' });
        triggerHaptic(settings.hapticsEnabled, 16);
        playTactileClick(settings.soundEnabled, 'pad');
        setLastGestureHint('Right Click (two-finger tap)');
      } else {
        onEmitInput({ kind: 'mouse:button', button: 'left', action: 'click' });
        triggerHaptic(settings.hapticsEnabled, 10);
        playTactileClick(settings.soundEnabled, 'pad');
        setLastGestureHint('Left Click (tap)');
      }
    }
  };

  const handleScrollStripDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    scrollPointerRef.current = { id: e.pointerId, lastY: e.clientY };
  };

  const handleScrollStripMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!scrollPointerRef.current || scrollPointerRef.current.id !== e.pointerId) {
      return;
    }
    const rawDy = e.clientY - scrollPointerRef.current.lastY;
    scrollPointerRef.current.lastY = e.clientY;
    const dir = settings.naturalScroll ? -1 : 1;
    const dy = rawDy * settings.scrollSpeed * dir;
    if (Math.abs(dy) > 0.05) {
      onEmitInput({ kind: 'mouse:scroll', dy });
    }
  };

  const handleScrollStripUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (scrollPointerRef.current?.id === e.pointerId) {
      scrollPointerRef.current = null;
    }
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const toggleDragLock = () => {
    const next = !dragLocked;
    setDragLocked(next);
    onEmitInput({
      kind: 'mouse:button',
      button: 'left',
      action: next ? 'down' : 'up',
    });
    triggerHaptic(settings.hapticsEnabled, 14);
    playTactileClick(settings.soundEnabled, 'button');
    setLastGestureHint(next ? 'Drag Lock active (Left button held)' : 'Drag Lock released');
  };

  const handleMouseButton = (button: MouseButton, down: boolean) => {
    setActiveButtons((prev) => {
      const next = new Set(prev);
      if (down) next.add(button);
      else next.delete(button);
      return next;
    });
    if (down) {
      triggerHaptic(settings.hapticsEnabled, 14);
      playTactileClick(settings.soundEnabled, 'button');
      setLastGestureHint(
        `${button.charAt(0).toUpperCase() + button.slice(1)} button pressed`
      );
    }
    onEmitInput({
      kind: 'mouse:button',
      button,
      action: down ? 'down' : 'up',
    });
  };

  return (
    <div className="flex flex-col gap-3 select-none">
      {/* Compact Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-[#161A20] px-3.5 py-2.5">
        <div className="flex items-center gap-3 text-xs text-slate-300">
          <span className="font-mono-tabular text-slate-200">
            Speed {settings.pointerSpeed.toFixed(2)}x
          </span>
          <span aria-hidden="true" className="text-slate-600">
            ·
          </span>
          <span className="text-slate-400 truncate max-w-[260px] sm:max-w-none">
            {lastGestureHint}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              onUpdateSettings({ naturalScroll: !settings.naturalScroll })
            }
            aria-pressed={settings.naturalScroll}
            className={`flex min-h-[36px] items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
              settings.naturalScroll
                ? 'border-[#FF5A1F]/60 bg-[#FF5A1F]/15 text-[#FF8A5C]'
                : 'border-white/10 bg-[#222832] text-slate-300 hover:text-white'
            }`}
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            <span>{settings.naturalScroll ? 'Natural Scroll' : 'Standard Scroll'}</span>
          </button>

          <button
            type="button"
            onClick={toggleDragLock}
            aria-pressed={dragLocked}
            className={`flex min-h-[36px] items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors ${
              dragLocked
                ? 'border-[#FF5A1F] bg-[#FF5A1F] text-white'
                : 'border-white/10 bg-[#222832] text-slate-300 hover:text-white'
            }`}
          >
            {dragLocked ? (
              <Lock className="h-3.5 w-3.5" />
            ) : (
              <LockOpen className="h-3.5 w-3.5" />
            )}
            <span>Drag Lock</span>
          </button>
        </div>
      </div>

      {/* Spacious Precision Trackpad + Vertical Scroll Strip */}
      <div className="rounded-3xl border border-white/10 bg-[#161A20] p-3 sm:p-4 shadow-xl">
        <div className="grid grid-cols-12 gap-3">
          {/* Multi-touch Trackpad */}
          <div
            data-testid="trackpad-surface"
            role="application"
            aria-label="Precision wireless trackpad surface"
            onPointerDown={handlePadPointerDown}
            onPointerMove={handlePadPointerMove}
            onPointerUp={handlePadPointerUp}
            onPointerCancel={handlePadPointerUp}
            className="touch-pad-surface col-span-10 relative flex min-h-[260px] sm:min-h-[340px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-b from-[#13171D] to-[#0F1217] shadow-[inset_0_4px_20px_rgba(0,0,0,0.65)] cursor-crosshair"
          >
            {/* Subtle corner registration marks */}
            <span className="pointer-events-none absolute top-3 left-3 h-3 w-3 border-t border-l border-white/15" />
            <span className="pointer-events-none absolute top-3 right-3 h-3 w-3 border-t border-r border-white/15" />
            <span className="pointer-events-none absolute bottom-3 left-3 h-3 w-3 border-b border-l border-white/15" />
            <span className="pointer-events-none absolute bottom-3 right-3 h-3 w-3 border-b border-r border-white/15" />

            <div className="pointer-events-none flex flex-col items-center gap-1.5 text-center px-4">
              <span className="text-sm font-semibold text-slate-400">
                Precision Trackpad
              </span>
              <span className="text-xs text-slate-500">
                Drag to move pointer · {settings.tapToClick ? 'Tap to click' : 'Tap-to-click off'}
              </span>
            </div>
          </div>

          {/* Dedicated Vertical Scroll Rail */}
          <div
            data-testid="scroll-strip"
            role="slider"
            aria-label="Vertical scroll strip"
            aria-valuetext="Scroll rail"
            onPointerDown={handleScrollStripDown}
            onPointerMove={handleScrollStripMove}
            onPointerUp={handleScrollStripUp}
            onPointerCancel={handleScrollStripUp}
            className="touch-pad-surface col-span-2 flex min-h-[260px] sm:min-h-[340px] flex-col items-center justify-between rounded-2xl border border-white/10 bg-[#12151B] py-4 shadow-[inset_0_2px_12px_rgba(0,0,0,0.7)]"
          >
            <span className="pointer-events-none text-[10px] font-semibold text-slate-400">
              ▲
            </span>
            <div className="pointer-events-none flex flex-col items-center gap-2.5">
              {Array.from({ length: 7 }).map((_, idx) => (
                <span key={idx} className="h-0.5 w-5 rounded-full bg-white/15" />
              ))}
              <span className="text-[10px] font-medium text-slate-500 rotate-90 my-3 whitespace-nowrap">
                SCROLL
              </span>
              {Array.from({ length: 7 }).map((_, idx) => (
                <span key={idx} className="h-0.5 w-5 rounded-full bg-white/15" />
              ))}
            </div>
            <span className="pointer-events-none text-[10px] font-semibold text-slate-400">
              ▼
            </span>
          </div>
        </div>

        {/* Physical Left / Middle / Right Mouse Buttons */}
        <div className="mt-3 grid grid-cols-12 gap-2.5">
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              handleMouseButton('left', true);
            }}
            onPointerUp={(e) => {
              if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                e.currentTarget.releasePointerCapture(e.pointerId);
              }
              handleMouseButton('left', false);
            }}
            onPointerCancel={() => handleMouseButton('left', false)}
            className={`hardware-key touch-pad-surface col-span-5 min-h-[54px] rounded-xl border text-sm font-semibold ${
              activeButtons.has('left') || dragLocked
                ? 'border-[#FF5A1F] bg-[#FF5A1F]/25 text-white'
                : 'border-white/10 bg-[#222832] text-slate-200 hover:border-white/25'
            }`}
          >
            Left Click
          </button>

          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              handleMouseButton('middle', true);
            }}
            onPointerUp={(e) => {
              if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                e.currentTarget.releasePointerCapture(e.pointerId);
              }
              handleMouseButton('middle', false);
            }}
            onPointerCancel={() => handleMouseButton('middle', false)}
            className={`hardware-key touch-pad-surface col-span-2 min-h-[54px] rounded-xl border text-xs font-semibold ${
              activeButtons.has('middle')
                ? 'border-[#FF5A1F] bg-[#FF5A1F]/25 text-white'
                : 'border-white/10 bg-[#1C212A] text-slate-300 hover:border-white/25'
            }`}
          >
            Mid
          </button>

          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              e.currentTarget.setPointerCapture(e.pointerId);
              handleMouseButton('right', true);
            }}
            onPointerUp={(e) => {
              if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                e.currentTarget.releasePointerCapture(e.pointerId);
              }
              handleMouseButton('right', false);
            }}
            onPointerCancel={() => handleMouseButton('right', false)}
            className={`hardware-key touch-pad-surface col-span-5 min-h-[54px] rounded-xl border text-sm font-semibold ${
              activeButtons.has('right')
                ? 'border-[#FF5A1F] bg-[#FF5A1F]/25 text-white'
                : 'border-white/10 bg-[#222832] text-slate-200 hover:border-white/25'
            }`}
          >
            Right Click
          </button>
        </div>
      </div>
    </div>
  );
};

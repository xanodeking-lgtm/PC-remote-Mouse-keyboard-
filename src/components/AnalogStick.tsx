import React, { useCallback, useRef, useState } from 'react';
import { applyRadialDeadzone } from '../utils/inputMath';

interface AnalogStickProps {
  label: string;
  sublabel: string;
  deadzone: number;
  sensitivity: number;
  onChange: (x: number, y: number) => void;
  onClickStick?: (pressed: boolean) => void;
  clickLabel?: string;
  accentColor?: 'orange' | 'sky';
}

export const AnalogStick: React.FC<AnalogStickProps> = ({
  label,
  sublabel,
  deadzone,
  sensitivity,
  onChange,
  onClickStick,
  clickLabel = 'L3',
  accentColor = 'orange',
}) => {
  const baseRef = useRef<HTMLDivElement | null>(null);
  const activePointerRef = useRef<number | null>(null);
  const [knobPos, setKnobPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [vector, setVector] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [stickPressed, setStickPressed] = useState(false);

  const updateStickFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const el = baseRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const maxRadius = rect.width * 0.38;

      const rawDx = clientX - cx;
      const rawDy = clientY - cy;
      const dist = Math.hypot(rawDx, rawDy);
      const clampedDist = Math.min(dist, maxRadius);
      const angle = Math.atan2(rawDy, rawDx);

      const visualX = dist > 0 ? Math.cos(angle) * clampedDist : 0;
      const visualY = dist > 0 ? Math.sin(angle) * clampedDist : 0;
      setKnobPos({ x: visualX, y: visualY });

      const normX = maxRadius > 0 ? visualX / maxRadius : 0;
      const normY = maxRadius > 0 ? visualY / maxRadius : 0;
      const dz = applyRadialDeadzone(normX, normY, deadzone, sensitivity);
      setVector({ x: dz.x, y: dz.y });
      onChange(dz.x, dz.y);
    },
    [deadzone, sensitivity, onChange]
  );

  const resetStick = useCallback(() => {
    activePointerRef.current = null;
    setIsDragging(false);
    setKnobPos({ x: 0, y: 0 });
    setVector({ x: 0, y: 0 });
    onChange(0, 0);
  }, [onChange]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (activePointerRef.current !== null) return;
    activePointerRef.current = e.pointerId;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    updateStickFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerRef.current !== e.pointerId) return;
    updateStickFromPointer(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerRef.current !== e.pointerId) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    resetStick();
  };

  const ringBorder =
    accentColor === 'orange' ? 'border-[#FF5A1F]/40' : 'border-sky-400/40';
  const dotBg = accentColor === 'orange' ? 'bg-[#FF5A1F]' : 'bg-sky-400';

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span className="font-semibold text-slate-200">{label}</span>
        <span aria-hidden="true">·</span>
        <span className="font-mono-tabular text-[11px] text-slate-400">
          {sublabel}
        </span>
      </div>

      <div
        ref={baseRef}
        role="slider"
        aria-label={`${label} analog joystick`}
        aria-valuetext={`X ${vector.x.toFixed(2)}, Y ${vector.y.toFixed(2)}`}
        data-testid={`analog-stick-${clickLabel.toLowerCase()}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="touch-pad-surface relative flex h-36 w-36 sm:h-40 sm:w-40 items-center justify-center rounded-full border border-white/10 bg-[#12151B] shadow-[inset_0_4px_16px_rgba(0,0,0,0.75)]"
      >
        {/* Crosshair axes */}
        <div className="pointer-events-none absolute inset-x-4 top-1/2 h-px -translate-y-1/2 bg-white/5" />
        <div className="pointer-events-none absolute inset-y-4 left-1/2 w-px -translate-x-1/2 bg-white/5" />

        {/* Deadzone ring */}
        <div
          className="pointer-events-none absolute rounded-full border border-dashed border-white/15"
          style={{
            width: `${Math.max(18, deadzone * 100)}%`,
            height: `${Math.max(18, deadzone * 100)}%`,
          }}
        />

        {/* Active vector indicator */}
        <div
          className={`pointer-events-none relative flex h-16 w-16 items-center justify-center rounded-full border ${
            isDragging ? ringBorder : 'border-white/15'
          } bg-gradient-to-b from-[#2B323E] to-[#1B2028] shadow-[0_8px_18px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.12)] ${
            isDragging ? '' : 'transition-transform duration-150 ease-out'
          }`}
          style={{
            transform: `translate3d(${knobPos.x}px, ${knobPos.y}px, 0)`,
          }}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-black/40 bg-[#171B22] shadow-inner">
            <span
              className={`h-2 w-2 rounded-full ${
                isDragging ? dotBg : 'bg-slate-500'
              }`}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="font-mono-tabular text-[11px] text-slate-400">
          {vector.x >= 0 ? '+' : ''}
          {vector.x.toFixed(2)}, {vector.y >= 0 ? '+' : ''}
          {vector.y.toFixed(2)}
        </span>
        {onClickStick && (
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              setStickPressed(true);
              onClickStick(true);
            }}
            onPointerUp={() => {
              setStickPressed(false);
              onClickStick(false);
            }}
            onPointerLeave={() => {
              if (stickPressed) {
                setStickPressed(false);
                onClickStick(false);
              }
            }}
            onPointerCancel={() => {
              setStickPressed(false);
              onClickStick(false);
            }}
            className={`hardware-key min-h-[36px] min-w-[44px] rounded-lg border px-2.5 py-1 text-xs font-semibold ${
              stickPressed
                ? 'border-[#FF5A1F] bg-[#FF5A1F]/20 text-[#FF5A1F]'
                : 'border-white/10 bg-[#1C2129] text-slate-300 hover:border-white/20 hover:text-white'
            }`}
          >
            {clickLabel}
          </button>
        )}
      </div>
    </div>
  );
};

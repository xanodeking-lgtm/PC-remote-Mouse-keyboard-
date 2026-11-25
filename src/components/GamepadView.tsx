import React, { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ControllerProfile,
  ControllerSettings,
  GamepadButtonId,
  InputEventPayload,
  MappingTarget,
} from '../types/controller';
import { AnalogStick } from './AnalogStick';
import { playTactileClick, triggerHaptic } from '../utils/audioHaptics';
import { stickToDirectionalKeys } from '../utils/inputMath';

interface GamepadViewProps {
  profile: ControllerProfile;
  profiles: ControllerProfile[];
  onSelectProfile: (profileId: string) => void;
  settings: ControllerSettings;
  onEmitInput: (payload: InputEventPayload) => void;
}

export const GamepadView: React.FC<GamepadViewProps> = ({
  profile,
  profiles,
  onSelectProfile,
  settings,
  onEmitInput,
}) => {
  const [pressedButtons, setPressedButtons] = useState<Set<GamepadButtonId>>(
    () => new Set()
  );

  // Track WASD/Arrow keys synthesized from Left Stick
  const stickKeysRef = useRef<{ up: boolean; down: boolean; left: boolean; right: boolean }>({
    up: false,
    down: false,
    left: false,
    right: false,
  });

  // Track Right Stick continuous mouse look velocity
  const rightStickVecRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const emitMappedTarget = useCallback(
    (target: MappingTarget, pressed: boolean) => {
      if (target.type === 'mouse') {
        const button =
          target.code === 'right'
            ? 'right'
            : target.code === 'middle'
              ? 'middle'
              : 'left';
        onEmitInput({
          kind: 'mouse:button',
          button,
          action: pressed ? 'down' : 'up',
        });
      } else {
        onEmitInput({
          kind: 'key:state',
          code: target.code,
          label: target.label,
          pressed,
        });
      }
    },
    [onEmitInput]
  );

  const handlePadButton = useCallback(
    (buttonId: GamepadButtonId, pressed: boolean) => {
      setPressedButtons((prev) => {
        const has = prev.has(buttonId);
        if (has === pressed) return prev;
        const next = new Set(prev);
        if (pressed) next.add(buttonId);
        else next.delete(buttonId);
        return next;
      });

      if (pressed) {
        triggerHaptic(settings.hapticsEnabled, 14);
        const isTrigger = buttonId === 'LT' || buttonId === 'RT';
        playTactileClick(settings.soundEnabled, isTrigger ? 'trigger' : 'button');
      }

      const mapped = profile.mappings[buttonId];
      onEmitInput({
        kind: 'gamepad:button',
        button: buttonId,
        pressed,
        mappedTarget: mapped,
      });

      if (mapped) {
        emitMappedTarget(mapped, pressed);
      }
    },
    [profile.mappings, settings.hapticsEnabled, settings.soundEnabled, onEmitInput, emitMappedTarget]
  );

  const handleLeftStick = useCallback(
    (x: number, y: number) => {
      onEmitInput({ kind: 'gamepad:stick', stick: 'left', x, y });

      if (profile.leftStickMode === 'wasd' || profile.leftStickMode === 'arrows') {
        const dirs = stickToDirectionalKeys(x, y, 0.35);
        const prev = stickKeysRef.current;
        const useWasd = profile.leftStickMode === 'wasd';

        const pairs: {
          key: 'up' | 'down' | 'left' | 'right';
          code: string;
          label: string;
        }[] = [
          {
            key: 'up',
            code: useWasd ? 'KeyW' : 'ArrowUp',
            label: useWasd ? 'W' : 'UP',
          },
          {
            key: 'down',
            code: useWasd ? 'KeyS' : 'ArrowDown',
            label: useWasd ? 'S' : 'DOWN',
          },
          {
            key: 'left',
            code: useWasd ? 'KeyA' : 'ArrowLeft',
            label: useWasd ? 'A' : 'LEFT',
          },
          {
            key: 'right',
            code: useWasd ? 'KeyD' : 'ArrowRight',
            label: useWasd ? 'D' : 'RIGHT',
          },
        ];

        for (const p of pairs) {
          if (dirs[p.key] !== prev[p.key]) {
            onEmitInput({
              kind: 'key:state',
              code: p.code,
              label: p.label,
              pressed: dirs[p.key],
            });
          }
        }
        stickKeysRef.current = dirs;
      }
    },
    [onEmitInput, profile.leftStickMode]
  );

  const handleRightStick = useCallback(
    (x: number, y: number) => {
      rightStickVecRef.current = { x, y };
      onEmitInput({ kind: 'gamepad:stick', stick: 'right', x, y });
    },
    [onEmitInput]
  );

  // Continuous mouse-look loop when right stick is deflected in 'mouse' mode
  useEffect(() => {
    if (profile.rightStickMode !== 'mouse') return;
    let rafId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      const vec = rightStickVecRef.current;
      if (Math.abs(vec.x) > 0.01 || Math.abs(vec.y) > 0.01) {
        const speedPxPerSec = 520 * settings.pointerSpeed;
        onEmitInput({
          kind: 'mouse:move',
          dx: vec.x * speedPxPerSec * dt,
          dy: vec.y * speedPxPerSec * dt,
          source: 'stick',
        });
      }
      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(rafId);
  }, [profile.rightStickMode, settings.pointerSpeed, onEmitInput]);

  // Helper to bind multi-touch pointer events safely
  const bindPadButton = (buttonId: GamepadButtonId) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      handlePadButton(buttonId, true);
    },
    onPointerUp: (e: React.PointerEvent) => {
      e.preventDefault();
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
      handlePadButton(buttonId, false);
    },
    onPointerCancel: () => handlePadButton(buttonId, false),
  });

  const isPressed = (id: GamepadButtonId) => pressedButtons.has(id);

  return (
    <div className="flex flex-col gap-4 select-none">
      {/* Profile Selector & Shoulder / Trigger Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-[#161A20] px-3 py-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {profiles.map((p) => {
            const active = p.id === profile.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onSelectProfile(p.id)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? 'bg-[#FF5A1F] text-white'
                    : 'bg-[#222832] text-slate-300 hover:bg-[#2C3340] hover:text-white'
                }`}
              >
                {p.name}
              </button>
            );
          })}
        </div>
        <span className="text-xs text-slate-400 truncate max-w-full">
          {profile.description}
        </span>
      </div>

      {/* Main Controller Deck */}
      <div className="rounded-3xl border border-white/10 bg-[#161A20] p-4 sm:p-5 shadow-xl">
        {/* Top Shoulder / Trigger + PC Hotkey Strip */}
        <div className="mb-5 grid grid-cols-12 items-center gap-2">
          {/* Left Triggers */}
          <div className="col-span-6 sm:col-span-3 flex items-center gap-2">
            <button
              type="button"
              {...bindPadButton('LT')}
              className={`hardware-key touch-pad-surface flex-1 min-h-[46px] rounded-xl border px-2 py-2 text-center ${
                isPressed('LT')
                  ? 'border-[#FF5A1F] bg-[#FF5A1F]/25 text-white'
                  : 'border-white/10 bg-[#222832] text-slate-200 hover:border-white/25'
              }`}
            >
              <div className="text-xs font-bold">LT</div>
              <div className="font-mono-tabular text-[10px] text-slate-400">
                {profile.mappings.LT.label}
              </div>
            </button>
            <button
              type="button"
              {...bindPadButton('LB')}
              className={`hardware-key touch-pad-surface flex-1 min-h-[46px] rounded-xl border px-2 py-2 text-center ${
                isPressed('LB')
                  ? 'border-[#FF5A1F] bg-[#FF5A1F]/25 text-white'
                  : 'border-white/10 bg-[#222832] text-slate-200 hover:border-white/25'
              }`}
            >
              <div className="text-xs font-bold">LB</div>
              <div className="font-mono-tabular text-[10px] text-slate-400">
                {profile.mappings.LB.label}
              </div>
            </button>
          </div>

          {/* Right Triggers */}
          <div className="col-span-6 sm:col-span-3 sm:order-3 flex items-center gap-2">
            <button
              type="button"
              {...bindPadButton('RB')}
              className={`hardware-key touch-pad-surface flex-1 min-h-[46px] rounded-xl border px-2 py-2 text-center ${
                isPressed('RB')
                  ? 'border-[#FF5A1F] bg-[#FF5A1F]/25 text-white'
                  : 'border-white/10 bg-[#222832] text-slate-200 hover:border-white/25'
              }`}
            >
              <div className="text-xs font-bold">RB</div>
              <div className="font-mono-tabular text-[10px] text-slate-400">
                {profile.mappings.RB.label}
              </div>
            </button>
            <button
              type="button"
              {...bindPadButton('RT')}
              className={`hardware-key touch-pad-surface flex-1 min-h-[46px] rounded-xl border px-2 py-2 text-center ${
                isPressed('RT')
                  ? 'border-[#FF5A1F] bg-[#FF5A1F]/25 text-white'
                  : 'border-white/10 bg-[#222832] text-slate-200 hover:border-white/25'
              }`}
            >
              <div className="text-xs font-bold">RT</div>
              <div className="font-mono-tabular text-[10px] text-slate-400">
                {profile.mappings.RT.label}
              </div>
            </button>
          </div>

          {/* Center PC Utility Keys */}
          <div className="col-span-12 sm:col-span-6 sm:order-2 grid grid-cols-4 sm:flex sm:flex-wrap items-center justify-center gap-1.5">
            {(['ESC', 'TAB', 'START', 'SPACE'] as GamepadButtonId[]).map((keyId) => (
              <button
                key={keyId}
                type="button"
                {...bindPadButton(keyId)}
                className={`hardware-key touch-pad-surface min-h-[40px] rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold tracking-wide whitespace-nowrap ${
                  isPressed(keyId)
                    ? 'border-[#FF5A1F] bg-[#FF5A1F]/25 text-white'
                    : 'border-white/10 bg-[#1D222A] text-slate-300 hover:border-white/25'
                }`}
              >
                {keyId}
              </button>
            ))}
          </div>
        </div>

        {/* Main Ergonomic Dual-Thumb Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-6">
          {/* Left Wing: Analog Stick + D-Pad + Sprint/Ctrl */}
          <div className="md:col-span-5 flex flex-col items-center gap-5">
            <div className="flex flex-wrap items-center justify-center gap-5">
              <AnalogStick
                label="Left Stick"
                sublabel={profile.leftStickMode.toUpperCase()}
                deadzone={settings.stickDeadzone}
                sensitivity={settings.stickSensitivity}
                onChange={handleLeftStick}
                onClickStick={(down) => handlePadButton('L3', down)}
                clickLabel="L3"
                accentColor="orange"
              />

              {/* 4-Way D-Pad */}
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs font-semibold text-slate-300">D-Pad</span>
                <div className="grid grid-cols-3 grid-rows-3 gap-1.5 rounded-2xl border border-white/10 bg-[#12151B] p-2">
                  <div />
                  <button
                    type="button"
                    aria-label="D-Pad Up"
                    {...bindPadButton('DPAD_UP')}
                    className={`hardware-key touch-pad-surface flex h-11 w-11 items-center justify-center rounded-lg border text-xs font-bold ${
                      isPressed('DPAD_UP')
                        ? 'border-[#FF5A1F] bg-[#FF5A1F]/25 text-white'
                        : 'border-white/10 bg-[#222832] text-slate-200'
                    }`}
                  >
                    ▲
                  </button>
                  <div />
                  <button
                    type="button"
                    aria-label="D-Pad Left"
                    {...bindPadButton('DPAD_LEFT')}
                    className={`hardware-key touch-pad-surface flex h-11 w-11 items-center justify-center rounded-lg border text-xs font-bold ${
                      isPressed('DPAD_LEFT')
                        ? 'border-[#FF5A1F] bg-[#FF5A1F]/25 text-white'
                        : 'border-white/10 bg-[#222832] text-slate-200'
                    }`}
                  >
                    ◀
                  </button>
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#181C23]">
                    <span className="h-2 w-2 rounded-full bg-white/15" />
                  </div>
                  <button
                    type="button"
                    aria-label="D-Pad Right"
                    {...bindPadButton('DPAD_RIGHT')}
                    className={`hardware-key touch-pad-surface flex h-11 w-11 items-center justify-center rounded-lg border text-xs font-bold ${
                      isPressed('DPAD_RIGHT')
                        ? 'border-[#FF5A1F] bg-[#FF5A1F]/25 text-white'
                        : 'border-white/10 bg-[#222832] text-slate-200'
                    }`}
                  >
                    ▶
                  </button>
                  <div />
                  <button
                    type="button"
                    aria-label="D-Pad Down"
                    {...bindPadButton('DPAD_DOWN')}
                    className={`hardware-key touch-pad-surface flex h-11 w-11 items-center justify-center rounded-lg border text-xs font-bold ${
                      isPressed('DPAD_DOWN')
                        ? 'border-[#FF5A1F] bg-[#FF5A1F]/25 text-white'
                        : 'border-white/10 bg-[#222832] text-slate-200'
                    }`}
                  >
                    ▼
                  </button>
                  <div />
                </div>
              </div>
            </div>
          </div>

          {/* Center PC Action Hotkeys */}
          <div className="md:col-span-2 flex flex-row md:flex-col items-center justify-center gap-2.5">
            <button
              type="button"
              {...bindPadButton('SPRINT')}
              className={`hardware-key touch-pad-surface min-h-[44px] min-w-[84px] rounded-xl border px-3 py-2 text-xs font-bold ${
                isPressed('SPRINT')
                  ? 'border-[#FF5A1F] bg-[#FF5A1F]/25 text-white'
                  : 'border-white/10 bg-[#1D222A] text-slate-200 hover:border-white/25'
              }`}
            >
              SPRINT
            </button>
            <button
              type="button"
              {...bindPadButton('CTRL')}
              className={`hardware-key touch-pad-surface min-h-[44px] min-w-[84px] rounded-xl border px-3 py-2 text-xs font-bold ${
                isPressed('CTRL')
                  ? 'border-[#FF5A1F] bg-[#FF5A1F]/25 text-white'
                  : 'border-white/10 bg-[#1D222A] text-slate-200 hover:border-white/25'
              }`}
            >
              CTRL
            </button>
            <button
              type="button"
              {...bindPadButton('SELECT')}
              className={`hardware-key touch-pad-surface min-h-[44px] min-w-[84px] rounded-xl border px-3 py-2 text-xs font-bold ${
                isPressed('SELECT')
                  ? 'border-[#FF5A1F] bg-[#FF5A1F]/25 text-white'
                  : 'border-white/10 bg-[#1D222A] text-slate-300 hover:border-white/25'
              }`}
            >
              MAP
            </button>
          </div>

          {/* Right Wing: ABXY Diamond + Right Stick */}
          <div className="md:col-span-5 flex flex-wrap items-center justify-center gap-5">
            {/* ABXY Diamond */}
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-semibold text-slate-300">
                Action Cluster
              </span>
              <div className="grid grid-cols-3 grid-rows-3 gap-2 rounded-2xl border border-white/10 bg-[#12151B] p-2.5">
                <div />
                <button
                  type="button"
                  aria-label={`Button Y mapped to ${profile.mappings.Y.label}`}
                  {...bindPadButton('Y')}
                  className={`hardware-key touch-pad-surface flex h-13 w-13 flex-col items-center justify-center rounded-full border-2 ${
                    isPressed('Y')
                      ? 'border-amber-400 bg-amber-400/25 text-white'
                      : 'border-amber-400/50 bg-[#222832] text-amber-300'
                  }`}
                >
                  <span className="text-sm font-extrabold leading-none">Y</span>
                  <span className="font-mono-tabular text-[9px] text-slate-300 mt-0.5">
                    {profile.mappings.Y.label}
                  </span>
                </button>
                <div />

                <button
                  type="button"
                  aria-label={`Button X mapped to ${profile.mappings.X.label}`}
                  {...bindPadButton('X')}
                  className={`hardware-key touch-pad-surface flex h-13 w-13 flex-col items-center justify-center rounded-full border-2 ${
                    isPressed('X')
                      ? 'border-sky-400 bg-sky-400/25 text-white'
                      : 'border-sky-400/50 bg-[#222832] text-sky-300'
                  }`}
                >
                  <span className="text-sm font-extrabold leading-none">X</span>
                  <span className="font-mono-tabular text-[9px] text-slate-300 mt-0.5">
                    {profile.mappings.X.label}
                  </span>
                </button>
                <div />
                <button
                  type="button"
                  aria-label={`Button B mapped to ${profile.mappings.B.label}`}
                  {...bindPadButton('B')}
                  className={`hardware-key touch-pad-surface flex h-13 w-13 flex-col items-center justify-center rounded-full border-2 ${
                    isPressed('B')
                      ? 'border-rose-400 bg-rose-400/25 text-white'
                      : 'border-rose-400/50 bg-[#222832] text-rose-300'
                  }`}
                >
                  <span className="text-sm font-extrabold leading-none">B</span>
                  <span className="font-mono-tabular text-[9px] text-slate-300 mt-0.5">
                    {profile.mappings.B.label}
                  </span>
                </button>

                <div />
                <button
                  type="button"
                  aria-label={`Button A mapped to ${profile.mappings.A.label}`}
                  {...bindPadButton('A')}
                  className={`hardware-key touch-pad-surface flex h-13 w-13 flex-col items-center justify-center rounded-full border-2 ${
                    isPressed('A')
                      ? 'border-emerald-400 bg-emerald-400/25 text-white'
                      : 'border-emerald-400/50 bg-[#222832] text-emerald-300'
                  }`}
                >
                  <span className="text-sm font-extrabold leading-none">A</span>
                  <span className="font-mono-tabular text-[9px] text-slate-300 mt-0.5">
                    {profile.mappings.A.label}
                  </span>
                </button>
                <div />
              </div>
            </div>

            <AnalogStick
              label="Right Stick"
              sublabel={profile.rightStickMode.toUpperCase()}
              deadzone={settings.stickDeadzone}
              sensitivity={settings.stickSensitivity}
              onChange={handleRightStick}
              onClickStick={(down) => handlePadButton('R3', down)}
              clickLabel="R3"
              accentColor="sky"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

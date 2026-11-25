import React, { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import type {
  ControllerProfile,
  ControllerSettings,
  GamepadButtonId,
  MappingTarget,
  StickMode,
} from '../types/controller';
import { AVAILABLE_KEY_TARGETS } from '../utils/inputMath';

interface TuneRemapViewProps {
  settings: ControllerSettings;
  onUpdateSettings: (patch: Partial<ControllerSettings>) => void;
  onResetSettings: () => void;
  profile: ControllerProfile;
  onUpdateProfile: (nextProfile: ControllerProfile) => void;
  onResetProfile: () => void;
}

const REMAPPABLE_BUTTONS: GamepadButtonId[] = [
  'A',
  'B',
  'X',
  'Y',
  'LB',
  'RB',
  'LT',
  'RT',
  'L3',
  'R3',
  'DPAD_UP',
  'DPAD_DOWN',
  'DPAD_LEFT',
  'DPAD_RIGHT',
  'START',
  'SELECT',
];

export const TuneRemapView: React.FC<TuneRemapViewProps> = ({
  settings,
  onUpdateSettings,
  onResetSettings,
  profile,
  onUpdateProfile,
  onResetProfile,
}) => {
  const [selectedButton, setSelectedButton] = useState<GamepadButtonId>('A');

  const assignTarget = (target: MappingTarget) => {
    onUpdateProfile({
      ...profile,
      mappings: {
        ...profile.mappings,
        [selectedButton]: target,
      },
    });
  };

  const updateStickMode = (stick: 'left' | 'right', mode: StickMode) => {
    onUpdateProfile({
      ...profile,
      ...(stick === 'left'
        ? { leftStickMode: mode }
        : { rightStickMode: mode }),
    });
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
      {/* Left Column: Sensitivity, Deadzone & Feedback */}
      <section className="xl:col-span-5 flex flex-col gap-4 rounded-3xl border border-white/10 bg-[#161A20] p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">
            Sensitivity &amp; Hardware Feel
          </h2>
          <button
            type="button"
            onClick={onResetSettings}
            className="flex min-h-[36px] items-center gap-1.5 rounded-lg border border-white/10 bg-[#222832] px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>

        {/* Sliders */}
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-200">
                Mouse Pointer Speed
              </span>
              <span className="font-mono-tabular font-semibold text-[#FF8A5C]">
                {settings.pointerSpeed.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min={0.4}
              max={3.0}
              step={0.05}
              value={settings.pointerSpeed}
              onChange={(e) =>
                onUpdateSettings({ pointerSpeed: Number(e.target.value) })
              }
              className="accent-[#FF5A1F]"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-200">
                Analog Stick Sensitivity
              </span>
              <span className="font-mono-tabular font-semibold text-[#FF8A5C]">
                {settings.stickSensitivity.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min={0.5}
              max={2.5}
              step={0.05}
              value={settings.stickSensitivity}
              onChange={(e) =>
                onUpdateSettings({ stickSensitivity: Number(e.target.value) })
              }
              className="accent-[#FF5A1F]"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-200">
                Stick Radial Dead Zone
              </span>
              <span className="font-mono-tabular font-semibold text-[#FF8A5C]">
                {Math.round(settings.stickDeadzone * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={0.35}
              step={0.01}
              value={settings.stickDeadzone}
              onChange={(e) =>
                onUpdateSettings({ stickDeadzone: Number(e.target.value) })
              }
              className="accent-[#FF5A1F]"
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-200">
                Scroll Strip Speed
              </span>
              <span className="font-mono-tabular font-semibold text-[#FF8A5C]">
                {settings.scrollSpeed.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min={0.5}
              max={2.5}
              step={0.05}
              value={settings.scrollSpeed}
              onChange={(e) =>
                onUpdateSettings({ scrollSpeed: Number(e.target.value) })
              }
              className="accent-[#FF5A1F]"
            />
          </label>
        </div>

        <hr className="border-white/10" />

        {/* Toggle Switches */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {[
            {
              key: 'tapToClick' as const,
              label: 'Tap-to-Click',
              desc: '1-finger & 2-finger tap',
            },
            {
              key: 'pointerAcceleration' as const,
              label: 'Pointer Accel',
              desc: 'Boost fast flicks',
            },
            {
              key: 'naturalScroll' as const,
              label: 'Natural Scroll',
              desc: 'Invert scroll direction',
            },
            {
              key: 'hapticsEnabled' as const,
              label: 'Haptic Pulse',
              desc: 'Vibrate on button press',
            },
            {
              key: 'soundEnabled' as const,
              label: 'Tactile Sound',
              desc: 'Subtle switch audio',
            },
          ].map((item) => {
            const active = settings[item.key];
            return (
              <button
                key={item.key}
                type="button"
                role="switch"
                aria-checked={active}
                onClick={() => onUpdateSettings({ [item.key]: !active })}
                className={`flex min-h-[52px] items-center justify-between rounded-xl border px-3 py-2 text-left transition-colors ${
                  active
                    ? 'border-[#FF5A1F]/60 bg-[#FF5A1F]/12 text-white'
                    : 'border-white/10 bg-[#1D222A] text-slate-300'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold">{item.label}</div>
                  <div className="text-[11px] text-slate-400">{item.desc}</div>
                </div>
                <span
                  className={`font-mono-tabular text-[11px] font-bold ${
                    active ? 'text-[#FF8A5C]' : 'text-slate-500'
                  }`}
                >
                  {active ? 'ON' : 'OFF'}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Right Column: Button Remapper for Active Profile */}
      <section className="xl:col-span-7 flex flex-col gap-4 rounded-3xl border border-white/10 bg-[#161A20] p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white">
              Button Mapping · {profile.name}
            </h2>
            <p className="text-xs text-slate-400">
              Select a controller button below, then pick its PC key or mouse action.
            </p>
          </div>
          <button
            type="button"
            onClick={onResetProfile}
            className="flex min-h-[36px] items-center gap-1.5 rounded-lg border border-white/10 bg-[#222832] px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset Profile</span>
          </button>
        </div>

        {/* Stick Mode Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#12151B] px-3 py-2">
            <span className="text-xs font-semibold text-slate-300 whitespace-nowrap">
              Left Stick
            </span>
            <div className="flex items-center gap-1 shrink-0">
              {(['wasd', 'arrows'] as StickMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => updateStickMode('left', mode)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold uppercase whitespace-nowrap ${
                    profile.leftStickMode === mode
                      ? 'bg-[#FF5A1F] text-white'
                      : 'bg-[#222832] text-slate-300'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#12151B] px-3 py-2">
            <span className="text-xs font-semibold text-slate-300 whitespace-nowrap">
              Right Stick
            </span>
            <div className="flex items-center gap-1 shrink-0">
              {(['mouse', 'arrows'] as StickMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => updateStickMode('right', mode)}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold uppercase whitespace-nowrap ${
                    profile.rightStickMode === mode
                      ? 'bg-[#FF5A1F] text-white'
                      : 'bg-[#222832] text-slate-300'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Gamepad Buttons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2">
          {REMAPPABLE_BUTTONS.map((btn) => {
            const isSelected = selectedButton === btn;
            const currentTarget = profile.mappings[btn];
            const displayBtn = btn.replace('DPAD_', 'D-');
            return (
              <button
                key={btn}
                type="button"
                onClick={() => setSelectedButton(btn)}
                className={`flex min-h-[48px] items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition-colors ${
                  isSelected
                    ? 'border-[#FF5A1F] bg-[#FF5A1F]/15 text-white'
                    : 'border-white/10 bg-[#1C212A] text-slate-200 hover:border-white/25'
                }`}
              >
                <span className="text-xs font-bold whitespace-nowrap">
                  {displayBtn}
                </span>
                <span className="font-mono-tabular text-[11px] font-semibold text-[#FF8A5C] whitespace-nowrap">
                  {currentTarget?.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Target Picker */}
        <div className="rounded-2xl border border-white/10 bg-[#12151B] p-3">
          <div className="mb-2 text-xs font-semibold text-slate-300">
            Assign PC action for{' '}
            <span className="text-[#FF8A5C]">{selectedButton}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {AVAILABLE_KEY_TARGETS.map((target) => {
              const active =
                profile.mappings[selectedButton]?.code === target.code &&
                profile.mappings[selectedButton]?.type === target.type;
              return (
                <button
                  key={`${target.type}-${target.code}`}
                  type="button"
                  onClick={() => assignTarget(target)}
                  className={`min-h-[36px] rounded-lg border px-2.5 py-1 font-mono-tabular text-xs font-semibold transition-colors ${
                    active
                      ? 'border-[#FF5A1F] bg-[#FF5A1F] text-white'
                      : 'border-white/10 bg-[#222832] text-slate-200 hover:border-white/25'
                  }`}
                >
                  {target.label}
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

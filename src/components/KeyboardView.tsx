import React, { useState } from 'react';
import { Send } from 'lucide-react';
import type { ControllerSettings, InputEventPayload } from '../types/controller';
import { playTactileClick, triggerHaptic } from '../utils/audioHaptics';

interface KeyboardViewProps {
  settings: ControllerSettings;
  onEmitInput: (payload: InputEventPayload) => void;
}

interface KeyDef {
  code: string;
  label: string;
  shiftLabel?: string;
  span?: string;
}

const FN_ROW: KeyDef[] = [
  { code: 'Escape', label: 'Esc' },
  { code: 'F1', label: 'F1' },
  { code: 'F2', label: 'F2' },
  { code: 'F3', label: 'F3' },
  { code: 'F4', label: 'F4' },
  { code: 'F5', label: 'F5' },
  { code: 'F6', label: 'F6' },
  { code: 'F7', label: 'F7' },
  { code: 'F8', label: 'F8' },
  { code: 'F9', label: 'F9' },
  { code: 'F10', label: 'F10' },
  { code: 'F11', label: 'F11' },
  { code: 'F12', label: 'F12' },
  { code: 'PrintScreen', label: 'PrtSc' },
  { code: 'Delete', label: 'Del' },
];

const NAV_ROW: KeyDef[] = [
  { code: 'Insert', label: 'Ins' },
  { code: 'Home', label: 'Home' },
  { code: 'PageUp', label: 'PgUp' },
  { code: 'PageDown', label: 'PgDn' },
  { code: 'End', label: 'End' },
];

const NUMBER_ROW: KeyDef[] = [
  { code: 'Backquote', label: '`', shiftLabel: '~' },
  { code: 'Digit1', label: '1', shiftLabel: '!' },
  { code: 'Digit2', label: '2', shiftLabel: '@' },
  { code: 'Digit3', label: '3', shiftLabel: '#' },
  { code: 'Digit4', label: '4', shiftLabel: '$' },
  { code: 'Digit5', label: '5', shiftLabel: '%' },
  { code: 'Digit6', label: '6', shiftLabel: '^' },
  { code: 'Digit7', label: '7', shiftLabel: '&' },
  { code: 'Digit8', label: '8', shiftLabel: '*' },
  { code: 'Digit9', label: '9', shiftLabel: '(' },
  { code: 'Digit0', label: '0', shiftLabel: ')' },
  { code: 'Minus', label: '-', shiftLabel: '_' },
  { code: 'Equal', label: '=', shiftLabel: '+' },
  { code: 'Backspace', label: 'Bksp' },
];

const ROW_QWERTY: KeyDef[] = [
  { code: 'Tab', label: 'Tab' },
  { code: 'KeyQ', label: 'Q' },
  { code: 'KeyW', label: 'W' },
  { code: 'KeyE', label: 'E' },
  { code: 'KeyR', label: 'R' },
  { code: 'KeyT', label: 'T' },
  { code: 'KeyY', label: 'Y' },
  { code: 'KeyU', label: 'U' },
  { code: 'KeyI', label: 'I' },
  { code: 'KeyO', label: 'O' },
  { code: 'KeyP', label: 'P' },
  { code: 'BracketLeft', label: '[', shiftLabel: '{' },
  { code: 'BracketRight', label: ']', shiftLabel: '}' },
  { code: 'Backslash', label: '\\', shiftLabel: '|' },
];

const ROW_ASDF: KeyDef[] = [
  { code: 'KeyA', label: 'A' },
  { code: 'KeyS', label: 'S' },
  { code: 'KeyD', label: 'D' },
  { code: 'KeyF', label: 'F' },
  { code: 'KeyG', label: 'G' },
  { code: 'KeyH', label: 'H' },
  { code: 'KeyJ', label: 'J' },
  { code: 'KeyK', label: 'K' },
  { code: 'KeyL', label: 'L' },
  { code: 'Semicolon', label: ';', shiftLabel: ':' },
  { code: 'Quote', label: "'", shiftLabel: '"' },
  { code: 'Enter', label: 'Enter' },
];

const ROW_ZXCV: KeyDef[] = [
  { code: 'KeyZ', label: 'Z' },
  { code: 'KeyX', label: 'X' },
  { code: 'KeyC', label: 'C' },
  { code: 'KeyV', label: 'V' },
  { code: 'KeyB', label: 'B' },
  { code: 'KeyN', label: 'N' },
  { code: 'KeyM', label: 'M' },
  { code: 'Comma', label: ',', shiftLabel: '<' },
  { code: 'Period', label: '.', shiftLabel: '>' },
  { code: 'Slash', label: '/', shiftLabel: '?' },
];

const MACROS: {
  label: string;
  code: string;
  keyLabel: string;
  modifiers: { ctrl?: boolean; alt?: boolean; shift?: boolean; meta?: boolean };
}[] = [
  { label: 'Ctrl+C', code: 'KeyC', keyLabel: 'C', modifiers: { ctrl: true } },
  { label: 'Ctrl+V', code: 'KeyV', keyLabel: 'V', modifiers: { ctrl: true } },
  { label: 'Ctrl+Z', code: 'KeyZ', keyLabel: 'Z', modifiers: { ctrl: true } },
  { label: 'Alt+Tab', code: 'Tab', keyLabel: 'Tab', modifiers: { alt: true } },
  { label: 'Win+D', code: 'KeyD', keyLabel: 'D', modifiers: { meta: true } },
  {
    label: 'Task Mgr',
    code: 'Escape',
    keyLabel: 'Esc',
    modifiers: { ctrl: true, shift: true },
  },
];

export const KeyboardView: React.FC<KeyboardViewProps> = ({
  settings,
  onEmitInput,
}) => {
  const [pasteText, setPasteText] = useState('');
  const [modifiers, setModifiers] = useState({
    ctrl: false,
    alt: false,
    shift: false,
    meta: false,
  });
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const toggleModifier = (mod: keyof typeof modifiers) => {
    setModifiers((prev) => ({ ...prev, [mod]: !prev[mod] }));
    triggerHaptic(settings.hapticsEnabled, 10);
    playTactileClick(settings.soundEnabled, 'key');
  };

  const fireKey = (key: KeyDef) => {
    const label =
      modifiers.shift && key.shiftLabel ? key.shiftLabel : key.label;
    triggerHaptic(settings.hapticsEnabled, 9);
    playTactileClick(settings.soundEnabled, 'key');
    setActiveKey(key.code);
    window.setTimeout(() => setActiveKey(null), 110);

    onEmitInput({
      kind: 'key:tap',
      code: key.code,
      label:
        key.label.length === 1
          ? modifiers.shift
            ? label.toUpperCase()
            : label.toLowerCase()
          : key.label,
      modifiers: { ...modifiers },
    });

    // Clear sticky modifiers after non-modifier key tap
    if (modifiers.ctrl || modifiers.alt || modifiers.shift || modifiers.meta) {
      setModifiers({ ctrl: false, alt: false, shift: false, meta: false });
    }
  };

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasteText) return;
    onEmitInput({ kind: 'key:text', text: pasteText });
    triggerHaptic(settings.hapticsEnabled, 14);
    playTactileClick(settings.soundEnabled, 'button');
    setPasteText('');
  };

  const fireMacro = (macro: (typeof MACROS)[number]) => {
    triggerHaptic(settings.hapticsEnabled, 12);
    playTactileClick(settings.soundEnabled, 'button');
    onEmitInput({
      kind: 'key:tap',
      code: macro.code,
      label: macro.keyLabel,
      modifiers: macro.modifiers,
    });
  };

  return (
    <div className="flex flex-col gap-3 select-none">
      {/* Quick-Paste Text Bar + PC Shortcut Macros */}
      <div className="flex flex-col gap-2.5 rounded-2xl border border-white/10 bg-[#161A20] p-3">
        <form onSubmit={handleSendText} className="flex items-center gap-2">
          <label htmlFor="quick-paste-input" className="sr-only">
            Quick paste text to PC
          </label>
          <input
            id="quick-paste-input"
            type="text"
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="Paste or type text block to send directly to PC..."
            className="min-h-[42px] flex-1 rounded-xl border border-white/10 bg-[#101318] px-3.5 text-sm text-white placeholder:text-slate-500 focus:border-[#FF5A1F] focus:outline-none"
          />
          <button
            type="submit"
            disabled={!pasteText}
            className="flex min-h-[42px] items-center gap-1.5 rounded-xl bg-[#FF5A1F] px-4 text-xs sm:text-sm font-semibold text-white whitespace-nowrap shrink-0 hover:bg-[#ff6d38] disabled:opacity-40 transition-colors"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Send Text</span>
          </button>
        </form>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {MACROS.map((m) => (
            <button
              key={m.label}
              type="button"
              onClick={() => fireMacro(m)}
              className="hardware-key min-h-[34px] rounded-lg border border-white/10 bg-[#222832] px-2.5 py-1 font-mono-tabular text-[11px] font-medium text-slate-200 whitespace-nowrap shrink-0 hover:border-white/25 hover:text-white"
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Full PC Keyboard Chassis */}
      <div className="flex flex-col gap-2 rounded-3xl border border-white/10 bg-[#161A20] p-3 sm:p-4 shadow-xl">
        {/* Function Keys & Navigation Row */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {FN_ROW.map((k) => (
            <button
              key={k.code}
              type="button"
              onClick={() => fireKey(k)}
              className={`hardware-key min-h-[38px] min-w-[40px] flex-1 rounded-lg border px-1.5 font-mono-tabular text-[11px] font-semibold whitespace-nowrap ${
                activeKey === k.code
                  ? 'border-[#FF5A1F] bg-[#FF5A1F]/25 text-white'
                  : 'border-white/10 bg-[#1C212A] text-slate-300 hover:border-white/25'
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>

        {/* Number Row */}
        <div className="grid grid-cols-15 gap-1">
          {NUMBER_ROW.map((k) => (
            <button
              key={k.code}
              type="button"
              onClick={() => fireKey(k)}
              className={`hardware-key min-h-[44px] rounded-lg border px-1 text-xs font-semibold ${
                k.code === 'Backspace' ? 'col-span-2 text-[11px]' : 'col-span-1'
              } ${
                activeKey === k.code
                  ? 'border-[#FF5A1F] bg-[#FF5A1F]/25 text-white'
                  : 'border-white/10 bg-[#222832] text-slate-100 hover:border-white/25'
              }`}
            >
              {modifiers.shift && k.shiftLabel ? k.shiftLabel : k.label}
            </button>
          ))}
        </div>

        {/* QWERTY Row */}
        <div className="grid grid-cols-15 gap-1">
          {ROW_QWERTY.map((k) => (
            <button
              key={k.code}
              type="button"
              onClick={() => fireKey(k)}
              className={`hardware-key min-h-[44px] rounded-lg border px-1 text-xs font-semibold ${
                k.code === 'Tab' ? 'col-span-2 text-[11px]' : 'col-span-1'
              } ${
                activeKey === k.code
                  ? 'border-[#FF5A1F] bg-[#FF5A1F]/25 text-white'
                  : 'border-white/10 bg-[#222832] text-slate-100 hover:border-white/25'
              }`}
            >
              {modifiers.shift && k.shiftLabel ? k.shiftLabel : k.label}
            </button>
          ))}
        </div>

        {/* ASDF Row */}
        <div className="grid grid-cols-13 gap-1">
          {ROW_ASDF.map((k) => (
            <button
              key={k.code}
              type="button"
              onClick={() => fireKey(k)}
              className={`hardware-key min-h-[44px] rounded-lg border px-1 text-xs font-semibold ${
                k.code === 'Enter'
                  ? 'col-span-2 bg-[#2B3340] text-white'
                  : 'col-span-1 bg-[#222832] text-slate-100'
              } ${
                activeKey === k.code
                  ? 'border-[#FF5A1F] bg-[#FF5A1F]/25'
                  : 'border-white/10 hover:border-white/25'
              }`}
            >
              {modifiers.shift && k.shiftLabel ? k.shiftLabel : k.label}
            </button>
          ))}
        </div>

        {/* Shift + ZXCV Row */}
        <div className="grid grid-cols-12 gap-1">
          <button
            type="button"
            aria-pressed={modifiers.shift}
            onClick={() => toggleModifier('shift')}
            className={`hardware-key col-span-2 min-h-[44px] rounded-lg border text-xs font-bold ${
              modifiers.shift
                ? 'border-[#FF5A1F] bg-[#FF5A1F] text-white'
                : 'border-white/10 bg-[#1C212A] text-slate-200 hover:border-white/25'
            }`}
          >
            Shift
          </button>
          {ROW_ZXCV.map((k) => (
            <button
              key={k.code}
              type="button"
              onClick={() => fireKey(k)}
              className={`hardware-key col-span-1 min-h-[44px] rounded-lg border px-1 text-xs font-semibold ${
                activeKey === k.code
                  ? 'border-[#FF5A1F] bg-[#FF5A1F]/25 text-white'
                  : 'border-white/10 bg-[#222832] text-slate-100 hover:border-white/25'
              }`}
            >
              {modifiers.shift && k.shiftLabel ? k.shiftLabel : k.label}
            </button>
          ))}
        </div>

        {/* Bottom Modifiers + Spacebar + Arrow Cluster */}
        <div className="grid grid-cols-12 gap-1.5 items-center pt-0.5">
          <button
            type="button"
            aria-pressed={modifiers.ctrl}
            onClick={() => toggleModifier('ctrl')}
            className={`hardware-key col-span-2 sm:col-span-1 min-h-[46px] rounded-lg border text-xs font-bold ${
              modifiers.ctrl
                ? 'border-[#FF5A1F] bg-[#FF5A1F] text-white'
                : 'border-white/10 bg-[#1C212A] text-slate-200'
            }`}
          >
            Ctrl
          </button>
          <button
            type="button"
            aria-pressed={modifiers.meta}
            onClick={() => toggleModifier('meta')}
            className={`hardware-key col-span-2 sm:col-span-1 min-h-[46px] rounded-lg border text-xs font-bold ${
              modifiers.meta
                ? 'border-[#FF5A1F] bg-[#FF5A1F] text-white'
                : 'border-white/10 bg-[#1C212A] text-slate-200'
            }`}
          >
            Win
          </button>
          <button
            type="button"
            aria-pressed={modifiers.alt}
            onClick={() => toggleModifier('alt')}
            className={`hardware-key col-span-2 sm:col-span-1 min-h-[46px] rounded-lg border text-xs font-bold ${
              modifiers.alt
                ? 'border-[#FF5A1F] bg-[#FF5A1F] text-white'
                : 'border-white/10 bg-[#1C212A] text-slate-200'
            }`}
          >
            Alt
          </button>

          <button
            type="button"
            onClick={() => fireKey({ code: 'Space', label: 'Space' })}
            className={`hardware-key col-span-6 sm:col-span-5 min-h-[46px] rounded-lg border text-xs font-semibold ${
              activeKey === 'Space'
                ? 'border-[#FF5A1F] bg-[#FF5A1F]/25 text-white'
                : 'border-white/10 bg-[#222832] text-slate-200 hover:border-white/25'
            }`}
          >
            Space
          </button>

          {/* Arrow Keys */}
          <div className="col-span-12 sm:col-span-4 flex items-center justify-end gap-1">
            <button
              type="button"
              aria-label="Arrow Left"
              onClick={() => fireKey({ code: 'ArrowLeft', label: 'LEFT' })}
              className="hardware-key min-h-[46px] min-w-[44px] flex-1 rounded-lg border border-white/10 bg-[#222832] text-xs font-bold text-slate-200"
            >
              ◀
            </button>
            <button
              type="button"
              aria-label="Arrow Up"
              onClick={() => fireKey({ code: 'ArrowUp', label: 'UP' })}
              className="hardware-key min-h-[46px] min-w-[44px] flex-1 rounded-lg border border-white/10 bg-[#222832] text-xs font-bold text-slate-200"
            >
              ▲
            </button>
            <button
              type="button"
              aria-label="Arrow Down"
              onClick={() => fireKey({ code: 'ArrowDown', label: 'DOWN' })}
              className="hardware-key min-h-[46px] min-w-[44px] flex-1 rounded-lg border border-white/10 bg-[#222832] text-xs font-bold text-slate-200"
            >
              ▼
            </button>
            <button
              type="button"
              aria-label="Arrow Right"
              onClick={() => fireKey({ code: 'ArrowRight', label: 'RIGHT' })}
              className="hardware-key min-h-[46px] min-w-[44px] flex-1 rounded-lg border border-white/10 bg-[#222832] text-xs font-bold text-slate-200"
            >
              ▶
            </button>
          </div>
        </div>

        {/* Dedicated Editing & Navigation Strip */}
        <div className="flex items-center gap-1.5 pt-0.5 overflow-x-auto">
          {NAV_ROW.map((k) => (
            <button
              key={k.code}
              type="button"
              onClick={() => fireKey(k)}
              className={`hardware-key min-h-[38px] flex-1 min-w-[54px] rounded-lg border font-mono-tabular text-[11px] font-semibold ${
                activeKey === k.code
                  ? 'border-[#FF5A1F] bg-[#FF5A1F]/25 text-white'
                  : 'border-white/10 bg-[#1C212A] text-slate-300 hover:border-white/25'
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import { RotateCcw, Trash2, MousePointer2 } from 'lucide-react';
import type { ReceiverState } from '../types/controller';

interface ReceiverPreviewPanelProps {
  state: ReceiverState;
  standalone?: boolean;
  pairingCode: string;
  peersCount: number;
  onResetState: () => void;
  onClearText: () => void;
}

export const ReceiverPreviewPanel: React.FC<ReceiverPreviewPanelProps> = ({
  state,
  standalone = false,
  pairingCode,
  peersCount,
  onResetState,
  onClearText,
}) => {
  return (
    <aside
      aria-label="PC Receiver Live Stage"
      className={`flex flex-col gap-3 rounded-3xl border border-white/10 bg-[#161A20] p-4 ${
        standalone ? 'w-full max-w-5xl mx-auto' : 'w-full'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-bold text-white">
            {standalone ? `PC Receiver · Room ${pairingCode}` : 'Live PC Target Stage'}
          </h2>
          <p className="font-mono-tabular text-[11px] text-slate-400">
            {standalone
              ? `${peersCount} controller${peersCount === 1 ? '' : 's'} connected`
              : `Cursor ${Math.round(state.cursorX)}%, ${Math.round(state.cursorY)}% · Clicks ${state.totalClicks}`}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onClearText}
            aria-label="Clear receiver text buffer"
            className="flex min-h-[34px] items-center gap-1 rounded-lg border border-white/10 bg-[#222832] px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear</span>
          </button>
          <button
            type="button"
            onClick={onResetState}
            aria-label="Reset receiver cursor and counters"
            className="flex min-h-[34px] items-center gap-1 rounded-lg border border-white/10 bg-[#222832] px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Virtual Desktop Cursor Viewport */}
      <div
        data-testid="receiver-desktop"
        className={`relative overflow-hidden rounded-2xl border border-white/10 bg-[#0D0F12] ${
          standalone ? 'h-72 sm:h-80' : 'h-48'
        }`}
      >
        {/* Grid lines */}
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Interactive Target Zone */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-dashed border-[#FF5A1F]/50 bg-[#FF5A1F]/10 text-center">
          <span className="font-mono-tabular text-lg font-bold text-[#FF8A5C]">
            {state.targetHits}
          </span>
          <span className="text-[10px] font-medium text-slate-300">
            Target Hits
          </span>
        </div>

        {/* Scroll Indicator Rail */}
        <div className="pointer-events-none absolute right-2 top-3 bottom-3 w-1.5 rounded-full bg-white/10">
          <div
            className="w-full rounded-full bg-[#FF5A1F] transition-transform duration-75"
            style={{
              height: '28%',
              transform: `translateY(${Math.max(
                0,
                Math.min(250, 125 + state.scrollOffset * 0.35)
              )}%)`,
            }}
          />
        </div>

        {/* Click Ripples */}
        {state.ripples.slice(0, 3).map((r) => (
          <span
            key={r.id}
            className={`pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 opacity-75 ${
              r.button === 'right'
                ? 'border-sky-400'
                : r.button === 'middle'
                  ? 'border-amber-400'
                  : 'border-[#FF5A1F]'
            }`}
            style={{ left: `${r.x}%`, top: `${r.y}%` }}
          />
        ))}

        {/* Virtual Mouse Cursor */}
        <div
          data-testid="receiver-cursor"
          className="pointer-events-none absolute -translate-x-1 -translate-y-1 transition-transform duration-75 ease-out"
          style={{
            left: `${state.cursorX}%`,
            top: `${state.cursorY}%`,
          }}
        >
          <MousePointer2
            className={`h-5 w-5 drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)] ${
              state.leftButtonDown
                ? 'text-[#FF5A1F] fill-[#FF5A1F]'
                : state.rightButtonDown
                  ? 'text-sky-400 fill-sky-400'
                  : 'text-white fill-white'
            }`}
          />
        </div>

        {/* Mouse button status overlay */}
        <div className="pointer-events-none absolute bottom-2 left-2.5 flex items-center gap-1.5 font-mono-tabular text-[10px]">
          <span
            className={`rounded px-1.5 py-0.5 ${
              state.leftButtonDown
                ? 'bg-[#FF5A1F] text-white'
                : 'bg-white/10 text-slate-400'
            }`}
          >
            LMB
          </span>
          <span
            className={`rounded px-1.5 py-0.5 ${
              state.middleButtonDown
                ? 'bg-amber-500 text-black'
                : 'bg-white/10 text-slate-400'
            }`}
          >
            MMB
          </span>
          <span
            className={`rounded px-1.5 py-0.5 ${
              state.rightButtonDown
                ? 'bg-sky-500 text-white'
                : 'bg-white/10 text-slate-400'
            }`}
          >
            RMB
          </span>
        </div>
      </div>

      {/* Live Typed Text / Notepad */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-300">PC Text Buffer</span>
          <span className="font-mono-tabular text-[11px] text-slate-400">
            {state.activeKeys.length > 0
              ? `Held: ${state.activeKeys.join(' + ')}`
              : 'Idle'}
          </span>
        </div>
        <pre
          data-testid="receiver-notepad"
          className="h-28 overflow-y-auto whitespace-pre-wrap break-words rounded-xl border border-white/10 bg-[#0D0F12] p-3 font-mono-tabular text-xs leading-relaxed text-slate-200"
        >
          {state.textBuffer || '(empty)'}
          <span className="inline-block h-3.5 w-1.5 align-middle bg-[#FF5A1F] ml-0.5" />
        </pre>
      </div>

      {/* Stick Vector & Event Feed */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-xl border border-white/10 bg-[#12151B] px-3 py-2">
          <div className="text-[11px] text-slate-400">Left Stick</div>
          <div className="font-mono-tabular font-semibold text-slate-200">
            {state.leftStick.x.toFixed(2)}, {state.leftStick.y.toFixed(2)}
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#12151B] px-3 py-2">
          <div className="text-[11px] text-slate-400">Right Stick</div>
          <div className="font-mono-tabular font-semibold text-slate-200">
            {state.rightStick.x.toFixed(2)}, {state.rightStick.y.toFixed(2)}
          </div>
        </div>
      </div>

      {state.eventLog.length > 0 && (
        <div className="flex flex-col gap-1 rounded-xl border border-white/10 bg-[#12151B] p-2.5">
          <span className="text-[11px] font-semibold text-slate-400">
            Recent Input Stream
          </span>
          <div className="flex max-h-20 flex-col gap-0.5 overflow-y-auto font-mono-tabular text-[11px] text-slate-300">
            {state.eventLog.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2">
                <span className="truncate">{item.summary}</span>
                <span className="text-[10px] text-slate-500 shrink-0">
                  {item.kind}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};

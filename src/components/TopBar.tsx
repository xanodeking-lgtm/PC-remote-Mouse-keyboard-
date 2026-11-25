import React from 'react';
import {
  Gamepad2,
  Keyboard,
  MousePointer2,
  SlidersHorizontal,
  Monitor,
  Wifi,
} from 'lucide-react';
import type {
  ConnectionState,
  ControllerTab,
  RoomPeers,
} from '../types/controller';
import { formatPairingCode } from '../utils/inputMath';
import { PWAInstallButton } from './PWAInstallButton';

interface TopBarProps {
  activeTab: ControllerTab;
  onSelectTab: (tab: ControllerTab) => void;
  pairingCode: string;
  connectionState: ConnectionState;
  peers: RoomPeers;
  latencyMs: number | null;
  showPreview: boolean;
  onTogglePreview: () => void;
  onOpenPairModal: () => void;
}

const TABS: { id: ControllerTab; label: string; icon: React.ReactNode }[] = [
  { id: 'gamepad', label: 'Gamepad', icon: <Gamepad2 className="h-4 w-4" /> },
  { id: 'mouse', label: 'Mouse', icon: <MousePointer2 className="h-4 w-4" /> },
  { id: 'keyboard', label: 'Keyboard', icon: <Keyboard className="h-4 w-4" /> },
  { id: 'tune', label: 'Tune', icon: <SlidersHorizontal className="h-4 w-4" /> },
];

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onSelectTab,
  pairingCode,
  connectionState,
  peers,
  latencyMs,
  showPreview,
  onTogglePreview,
  onOpenPairModal,
}) => {
  const receiverOnline = peers.receivers > 0;

  return (
    <header className="sticky top-0 z-30 flex h-13 w-full items-center justify-between gap-3 border-b border-white/10 bg-[#0D0F12]/95 px-3 sm:px-6 backdrop-blur-md">
      {/* Zone 1: Brand Title */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF5A1F] text-white shadow-sm">
          <Gamepad2 className="h-4 w-4" />
        </div>
        <span className="text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0">
          PadBridge
        </span>
      </div>

      {/* Zone 2: Mode Switcher Tabs (desktop inline, compact on mobile) */}
      <nav
        aria-label="Controller modes"
        className="hidden md:flex items-center gap-1 rounded-xl border border-white/10 bg-[#161A20] p-1"
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-sm font-medium whitespace-nowrap shrink-0 transition-colors ${
                isActive
                  ? 'bg-[#252B36] text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Primary Action & Preview Toggle */}
      <div className="flex items-center gap-2 shrink-0">
        <PWAInstallButton />
        <button
          type="button"
          onClick={onTogglePreview}
          aria-pressed={showPreview}
          className={`hidden lg:flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
            showPreview
              ? 'border-white/20 bg-[#222832] text-white'
              : 'border-white/10 bg-[#161A20] text-slate-400 hover:text-white'
          }`}
        >
          <Monitor className="h-3.5 w-3.5" />
          <span>{showPreview ? 'Hide PC Stage' : 'Show PC Stage'}</span>
        </button>

        <button
          type="button"
          onClick={onOpenPairModal}
          className="flex min-h-[38px] items-center gap-2 rounded-lg bg-[#FF5A1F] px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-white whitespace-nowrap shrink-0 hover:bg-[#ff6d38] transition-colors"
        >
          <Wifi className="h-3.5 w-3.5" />
          <span className="font-mono-tabular">{formatPairingCode(pairingCode)}</span>
          <span className="hidden sm:inline text-white/80">
            {connectionState === 'connected'
              ? receiverOnline
                ? `· ${peers.receivers} PC`
                : latencyMs !== null
                  ? `· ${latencyMs}ms`
                  : '· Ready'
              : '· Offline'}
          </span>
        </button>
      </div>
    </header>
  );
};

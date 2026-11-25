import { useCallback, useEffect, useMemo, useState } from 'react';
import { Gamepad2, ArrowLeft } from 'lucide-react';
import type {
  ControllerProfile,
  ControllerSettings,
  ControllerTab,
  InputEventPayload,
  ReceiverState,
} from './types/controller';
import {
  applyReceiverEvent,
  createInitialReceiverState,
  DEFAULT_PROFILES,
  DEFAULT_SETTINGS,
  formatPairingCode,
  generatePairingCode,
  normalizePairingCode,
} from './utils/inputMath';
import { usePadBridgeSocket } from './hooks/usePadBridgeSocket';
import { TopBar } from './components/TopBar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { GamepadView } from './components/GamepadView';
import { MouseTrackpadView } from './components/MouseTrackpadView';
import { KeyboardView } from './components/KeyboardView';
import { TuneRemapView } from './components/TuneRemapView';
import { ReceiverPreviewPanel } from './components/ReceiverPreviewPanel';
import { PairModal } from './components/PairModal';
import { nativeHidSession } from './utils/nativeBluetoothHid';

const STORAGE_SETTINGS_KEY = 'padbridge.settings.v1';
const STORAGE_PROFILES_KEY = 'padbridge.profiles.v1';
const STORAGE_ACTIVE_PROFILE_KEY = 'padbridge.activeProfileId.v1';
const STORAGE_PAIR_CODE_KEY = 'padbridge.pairingCode.v1';

function readInitialQueryParams(): {
  isReceiverMode: boolean;
  pairParam: string;
} {
  if (typeof window === 'undefined') {
    return { isReceiverMode: false, pairParam: '' };
  }
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');
  const pairParam = normalizePairingCode(params.get('pair') || '');
  return {
    isReceiverMode: mode === 'receiver',
    pairParam,
  };
}

export default function App() {
  const initialQuery = useMemo(() => readInitialQueryParams(), []);

  const [pairingCode, setPairingCode] = useState<string>(() => {
    if (initialQuery.pairParam.length === 6) return initialQuery.pairParam;
    try {
      const saved = localStorage.getItem(STORAGE_PAIR_CODE_KEY);
      if (saved && normalizePairingCode(saved).length === 6) {
        return normalizePairingCode(saved);
      }
    } catch {
      // Ignore storage errors
    }
    const fresh = generatePairingCode();
    try {
      localStorage.setItem(STORAGE_PAIR_CODE_KEY, fresh);
    } catch {
      // Ignore
    }
    return fresh;
  });

  const [activeTab, setActiveTab] = useState<ControllerTab>('gamepad');
  const [showPreview, setShowPreview] = useState<boolean>(true);
  const [pairModalOpen, setPairModalOpen] = useState<boolean>(false);

  const [settings, setSettings] = useState<ControllerSettings>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (raw) {
        return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<ControllerSettings>) };
      }
    } catch {
      // Ignore
    }
    return DEFAULT_SETTINGS;
  });

  const [profiles, setProfiles] = useState<ControllerProfile[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_PROFILES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ControllerProfile[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignore
    }
    return DEFAULT_PROFILES;
  });

  const [activeProfileId, setActiveProfileId] = useState<string>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_ACTIVE_PROFILE_KEY);
      if (raw) return raw;
    } catch {
      // Ignore
    }
    return DEFAULT_PROFILES[0].id;
  });

  const activeProfile = useMemo(
    () => profiles.find((p) => p.id === activeProfileId) ?? profiles[0],
    [profiles, activeProfileId]
  );

  const [receiverState, setReceiverState] = useState<ReceiverState>(() =>
    createInitialReceiverState()
  );

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // Ignore
    }
  }, [settings]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(profiles));
    } catch {
      // Ignore
    }
  }, [profiles]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_ACTIVE_PROFILE_KEY, activeProfileId);
    } catch {
      // Ignore
    }
  }, [activeProfileId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PAIR_CODE_KEY, pairingCode);
    } catch {
      // Ignore
    }
  }, [pairingCode]);

  const handleRemoteInput = useCallback((payload: InputEventPayload) => {
    setReceiverState((prev) => applyReceiverEvent(prev, payload));
  }, []);

  const { connectionState, peers, latencyMs, sendInput } = usePadBridgeSocket({
    room: pairingCode,
    role: initialQuery.isReceiverMode ? 'receiver' : 'controller',
    onRemoteInput: handleRemoteInput,
  });

  const handleEmitInput = useCallback(
    (payload: InputEventPayload) => {
      // Send over native Android Bluetooth HID when running inside APK
      nativeHidSession.dispatch(payload);
      // Send over WebSocket to paired PC / Receiver tab
      sendInput(payload);
      // Mirror immediately on local Live PC Stage if visible
      setReceiverState((prev) => applyReceiverEvent(prev, payload));
    },
    [sendInput]
  );

  // Physical Gamepad API pass-through when a hardware controller is connected
  useEffect(() => {
    if (initialQuery.isReceiverMode || typeof navigator === 'undefined' || !navigator.getGamepads) {
      return;
    }
    let rafId = 0;
    let lastStickX = 0;
    let lastStickY = 0;

    const poll = () => {
      const pads = navigator.getGamepads();
      const pad = pads.find((p) => p && p.connected);
      if (pad) {
        const lx = Math.abs(pad.axes[0] ?? 0) > settings.stickDeadzone ? Number((pad.axes[0] ?? 0).toFixed(2)) : 0;
        const ly = Math.abs(pad.axes[1] ?? 0) > settings.stickDeadzone ? Number((pad.axes[1] ?? 0).toFixed(2)) : 0;
        if (Math.abs(lx - lastStickX) > 0.04 || Math.abs(ly - lastStickY) > 0.04) {
          lastStickX = lx;
          lastStickY = ly;
          handleEmitInput({ kind: 'gamepad:stick', stick: 'left', x: lx, y: ly });
        }
      }
      rafId = window.requestAnimationFrame(poll);
    };

    const onConnected = () => {
      rafId = window.requestAnimationFrame(poll);
    };
    window.addEventListener('gamepadconnected', onConnected);
    if (navigator.getGamepads().some((p) => p && p.connected)) {
      rafId = window.requestAnimationFrame(poll);
    }

    return () => {
      window.removeEventListener('gamepadconnected', onConnected);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [initialQuery.isReceiverMode, settings.stickDeadzone, handleEmitInput]);

  const handleUpdateSettings = (patch: Partial<ControllerSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  const handleUpdateProfile = (nextProfile: ControllerProfile) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === nextProfile.id ? nextProfile : p))
    );
  };

  const handleResetProfile = () => {
    const defaultMatch =
      DEFAULT_PROFILES.find((p) => p.id === activeProfile.id) ??
      DEFAULT_PROFILES[0];
    handleUpdateProfile({ ...defaultMatch });
  };

  if (initialQuery.isReceiverMode) {
    return (
      <div className="min-h-screen bg-[#0D0F12] text-[#F4F5F7] p-4 sm:p-6">
        <header className="mx-auto mb-5 flex max-w-5xl items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF5A1F] text-white">
              <Gamepad2 className="h-4 w-4" />
            </div>
            <span className="text-base font-bold text-white">
              PadBridge Receiver
            </span>
          </div>
          <a
            href={`/?pair=${pairingCode}`}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#161A20] px-3 py-1.5 text-xs font-medium text-slate-200 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Switch to Controller</span>
          </a>
        </header>

        <ReceiverPreviewPanel
          state={receiverState}
          standalone
          pairingCode={formatPairingCode(pairingCode)}
          peersCount={peers.controllers}
          onResetState={() => setReceiverState(createInitialReceiverState())}
          onClearText={() =>
            setReceiverState((prev) => ({ ...prev, textBuffer: '' }))
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0F12] text-[#F4F5F7] pb-20 md:pb-6">
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        pairingCode={pairingCode}
        connectionState={connectionState}
        peers={peers}
        latencyMs={latencyMs}
        showPreview={showPreview}
        onTogglePreview={() => setShowPreview((v) => !v)}
        onOpenPairModal={() => setPairModalOpen(true)}
      />

      <main className="mx-auto w-full max-w-[1400px] px-3 sm:px-6 pt-4">
        <div
          className={`grid grid-cols-1 gap-4 items-start ${
            showPreview ? 'lg:grid-cols-12' : ''
          }`}
        >
          <div className={showPreview ? 'lg:col-span-8' : 'w-full'}>
            {activeTab === 'gamepad' && (
              <GamepadView
                profile={activeProfile}
                profiles={profiles}
                onSelectProfile={setActiveProfileId}
                settings={settings}
                onEmitInput={handleEmitInput}
              />
            )}

            {activeTab === 'mouse' && (
              <MouseTrackpadView
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onEmitInput={handleEmitInput}
              />
            )}

            {activeTab === 'keyboard' && (
              <KeyboardView
                settings={settings}
                onEmitInput={handleEmitInput}
              />
            )}

            {activeTab === 'tune' && (
              <TuneRemapView
                settings={settings}
                onUpdateSettings={handleUpdateSettings}
                onResetSettings={() => setSettings(DEFAULT_SETTINGS)}
                profile={activeProfile}
                onUpdateProfile={handleUpdateProfile}
                onResetProfile={handleResetProfile}
              />
            )}
          </div>

          {showPreview && (
            <div className="lg:col-span-4">
              <ReceiverPreviewPanel
                state={receiverState}
                pairingCode={formatPairingCode(pairingCode)}
                peersCount={peers.controllers}
                onResetState={() =>
                  setReceiverState(createInitialReceiverState())
                }
                onClearText={() =>
                  setReceiverState((prev) => ({ ...prev, textBuffer: '' }))
                }
              />
            </div>
          )}
        </div>
      </main>

      <MobileBottomNav activeTab={activeTab} onSelectTab={setActiveTab} />

      <PairModal
        isOpen={pairModalOpen}
        onClose={() => setPairModalOpen(false)}
        pairingCode={pairingCode}
        onChangePairingCode={setPairingCode}
        onGenerateNewCode={() => setPairingCode(generatePairingCode())}
        connectionState={connectionState}
        peers={peers}
      />
    </div>
  );
}

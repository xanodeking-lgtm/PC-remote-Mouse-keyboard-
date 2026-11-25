import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Bluetooth, Check, Copy, Download, ExternalLink, RefreshCw, Smartphone, X } from 'lucide-react';
import type { ConnectionState, RoomPeers } from '../types/controller';
import { formatPairingCode, normalizePairingCode } from '../utils/inputMath';
import { generatePcCompanionScript } from '../utils/pcCompanionTemplate';
import {
  connectBluetoothHost,
  disconnectBluetoothHost,
  getHidStatus,
  getPairedBluetoothDevices,
  isNativeAndroid,
  registerHidDevice,
  requestBluetoothPermissions,
  subscribeHidState,
  type BluetoothHidStatus,
  type PairedBluetoothDevice,
} from '../utils/nativeBluetoothHid';

interface PairModalProps {
  isOpen: boolean;
  onClose: () => void;
  pairingCode: string;
  onChangePairingCode: (nextCode: string) => void;
  onGenerateNewCode: () => void;
  connectionState: ConnectionState;
  peers: RoomPeers;
}

export const PairModal: React.FC<PairModalProps> = ({
  isOpen,
  onClose,
  pairingCode,
  onChangePairingCode,
  onGenerateNewCode,
  connectionState,
  peers,
}) => {
  const [joinInput, setJoinInput] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [hidStatus, setHidStatus] = useState<BluetoothHidStatus | null>(null);
  const [bondedDevices, setBondedDevices] = useState<PairedBluetoothDevice[]>([]);
  const [hidError, setHidError] = useState<string>('');
  const nativeAndroid = isNativeAndroid();

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const controllerUrl = `${origin}/?pair=${pairingCode}`;
  const receiverUrl = `${origin}/?mode=receiver&pair=${pairingCode}`;
  const wsProtocol =
    typeof window !== 'undefined' && window.location.protocol === 'https:'
      ? 'wss:'
      : 'ws:';
  const wsUrl =
    typeof window !== 'undefined'
      ? `${wsProtocol}//${window.location.host}/ws`
      : 'ws://localhost:3000/ws';

  useEffect(() => {
    if (!isOpen || !controllerUrl) return;
    let cancelled = false;
    QRCode.toDataURL(controllerUrl, {
      width: 200,
      margin: 2,
      color: {
        dark: '#0D0F12',
        light: '#F4F5F7',
      },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [isOpen, controllerUrl]);

  useEffect(() => {
    if (!isOpen || !nativeAndroid) return;
    getHidStatus()
      .then((s) => setHidStatus(s))
      .catch(() => {});
    const unsub = subscribeHidState((s) => setHidStatus(s));
    return unsub;
  }, [isOpen, nativeAndroid]);

  if (!isOpen) return null;

  const handleEnableBluetoothHid = async () => {
    setHidError('');
    try {
      const perm = await requestBluetoothPermissions();
      setHidStatus(perm);
      const reg = await registerHidDevice();
      setHidStatus(reg);
      const devs = await getPairedBluetoothDevices();
      setBondedDevices(devs);
    } catch (err) {
      setHidError(err instanceof Error ? err.message : 'Bluetooth HID setup failed.');
    }
  };

  const handleConnectBtDevice = async (address: string) => {
    setHidError('');
    try {
      const next = await connectBluetoothHost(address);
      setHidStatus(next);
    } catch (err) {
      setHidError(err instanceof Error ? err.message : 'Failed to connect device.');
    }
  };

  const copyText = (key: string, value: string) => {
    navigator.clipboard?.writeText(value).catch(() => {});
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1600);
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = normalizePairingCode(joinInput);
    if (cleaned.length === 6) {
      onChangePairingCode(cleaned);
      setJoinInput('');
    }
  };

  const handleDownloadCompanion = () => {
    const script = generatePcCompanionScript(wsUrl, pairingCode);
    const blob = new Blob([script], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'padbridge_pc.py';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="pair-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/15 bg-[#161A20] p-5 sm:p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <h2 id="pair-modal-title" className="text-lg font-bold text-white">
              Pair Phone &amp; PC Receiver
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Ad-free real-time WebSocket pairing. Scan on your phone or run the lightweight PC agent.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close pairing dialog"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#222832] text-slate-300 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Pairing Code + QR */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
          <div className="sm:col-span-5 flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-[#111419] p-4">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR code for pairing room ${formatPairingCode(pairingCode)}`}
                referrerPolicy="no-referrer"
                className="h-40 w-40 rounded-xl"
              />
            ) : (
              <div className="flex h-40 w-40 items-center justify-center rounded-xl bg-[#1C212A] text-xs text-slate-400">
                Generating QR...
              </div>
            )}
            <span className="mt-2.5 text-[11px] text-slate-400 text-center">
              Scan with your phone camera to open the controller
            </span>
          </div>

          <div className="sm:col-span-7 flex flex-col gap-3.5">
            <div className="rounded-2xl border border-white/10 bg-[#111419] p-3.5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Active Room Code</span>
                <span className="font-mono-tabular">
                  {connectionState === 'connected'
                    ? `${peers.controllers} controller · ${peers.receivers} PC`
                    : connectionState}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="font-mono-tabular text-2xl font-bold tracking-wider text-white">
                  {formatPairingCode(pairingCode)}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => copyText('url', controllerUrl)}
                    className="flex min-h-[36px] items-center gap-1.5 rounded-lg border border-white/10 bg-[#222832] px-2.5 py-1 text-xs font-medium text-slate-200 hover:text-white"
                  >
                    {copiedKey === 'url' ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span>{copiedKey === 'url' ? 'Copied' : 'Copy Link'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={onGenerateNewCode}
                    aria-label="Generate new pairing code"
                    className="flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border border-white/10 bg-[#222832] text-slate-200 hover:text-white"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Join Existing Room */}
            <form onSubmit={handleJoinSubmit} className="flex items-center gap-2">
              <label htmlFor="join-room-input" className="sr-only">
                Enter 6-character room code
              </label>
              <input
                id="join-room-input"
                type="text"
                maxLength={7}
                value={joinInput}
                onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
                placeholder="Enter code (e.g. K7M49P)"
                className="min-h-[42px] flex-1 rounded-xl border border-white/10 bg-[#111419] px-3 font-mono-tabular text-sm text-white placeholder:text-slate-500 focus:border-[#FF5A1F] focus:outline-none"
              />
              <button
                type="submit"
                disabled={normalizePairingCode(joinInput).length !== 6}
                className="min-h-[42px] rounded-xl bg-[#252B36] px-4 text-xs font-semibold text-white hover:bg-[#313948] disabled:opacity-40"
              >
                Join Room
              </button>
            </form>

            {/* Browser Receiver Tab */}
            <a
              href={receiverUrl}
              target="_blank"
              rel="noreferrer"
              className="flex min-h-[42px] items-center justify-between rounded-xl border border-white/10 bg-[#1D222A] px-3.5 py-2 text-xs font-semibold text-slate-200 hover:border-white/25 hover:text-white"
            >
              <span>Open Standalone PC Receiver Tab</span>
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            </a>
          </div>
        </div>

        {/* Real OS-level PC Agent Download */}
        <div className="mt-5 rounded-2xl border border-white/10 bg-[#111419] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white">
                Control Your Real Windows / Mac / Linux Desktop
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Download the open-source 90-line Python agent pre-paired to room{' '}
                <span className="font-mono-tabular text-slate-200">
                  {formatPairingCode(pairingCode)}
                </span>
                .
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadCompanion}
              className="flex min-h-[40px] items-center gap-2 rounded-xl bg-[#FF5A1F] px-4 py-2 text-xs font-semibold text-white hover:bg-[#ff6d38]"
            >
              <Download className="h-4 w-4" />
              <span>Download padbridge_pc.py</span>
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#0B0D10] px-3 py-2">
            <code className="font-mono-tabular text-xs text-slate-300 overflow-x-auto whitespace-nowrap">
              pip install websockets pynput &amp;&amp; python padbridge_pc.py
            </code>
            <button
              type="button"
              onClick={() =>
                copyText(
                  'cmd',
                  'pip install websockets pynput && python padbridge_pc.py'
                )
              }
              className="shrink-0 rounded-lg bg-[#1D222A] px-2.5 py-1 text-[11px] font-medium text-slate-200 hover:text-white"
            >
              {copiedKey === 'cmd' ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Native Android Bluetooth HID / APK Build Card */}
        <div className="mt-4 rounded-2xl border border-white/10 bg-[#111419] p-4">
          {nativeAndroid ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Bluetooth className="h-4 w-4 text-[#FF8A5C]" />
                  <h3 className="text-sm font-bold text-white">
                    Direct Bluetooth HID (No PC Server Needed)
                  </h3>
                </div>
                {hidStatus?.connectedDeviceName ? (
                  <button
                    type="button"
                    onClick={() => disconnectBluetoothHost().then(setHidStatus)}
                    className="rounded-lg border border-white/15 bg-[#222832] px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Disconnect {hidStatus.connectedDeviceName}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleEnableBluetoothHid}
                    className="rounded-lg bg-[#FF5A1F] px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Enable Bluetooth HID
                  </button>
                )}
              </div>

              {hidError && (
                <p className="text-xs text-rose-400">{hidError}</p>
              )}

              {bondedDevices.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] text-slate-400">
                    Paired Bluetooth PCs
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {bondedDevices.map((d) => (
                      <button
                        key={d.address}
                        type="button"
                        onClick={() => handleConnectBtDevice(d.address)}
                        className="flex items-center justify-between rounded-xl border border-white/10 bg-[#1C212A] px-3 py-2 text-left text-xs text-slate-200 hover:border-[#FF5A1F]"
                      >
                        <span className="font-semibold truncate">{d.name}</span>
                        <span className="font-mono-tabular text-[10px] text-[#FF8A5C]">
                          Connect
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-[#FF8A5C]" />
                <h3 className="text-sm font-bold text-white">
                  Android APK Project &amp; Bluetooth HID Included
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                Build your own ad-free Android APK with native{' '}
                <code className="text-slate-200">BluetoothHidDevice</code> support via
                Android Studio (<code className="text-slate-200">android/</code>) or
                CLI:
              </p>
              <div className="flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#0B0D10] px-3 py-2">
                <code className="font-mono-tabular text-xs text-slate-300 overflow-x-auto whitespace-nowrap">
                  npm run android:sync &amp;&amp; cd android &amp;&amp; ./gradlew assembleDebug
                </code>
                <button
                  type="button"
                  onClick={() =>
                    copyText(
                      'apk',
                      'npm run android:sync && cd android && ./gradlew assembleDebug'
                    )
                  }
                  className="shrink-0 rounded-lg bg-[#1D222A] px-2.5 py-1 text-[11px] font-medium text-slate-200 hover:text-white"
                >
                  {copiedKey === 'apk' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Download } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { isNativeAndroid } from '../utils/nativeBluetoothHid';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled || isNativeAndroid()) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="flex min-h-[38px] items-center gap-1.5 rounded-lg border border-white/15 bg-[#1C212A] px-3 py-1.5 text-xs font-semibold text-white whitespace-nowrap shrink-0 hover:border-white/30 transition-colors"
      >
        <Download className="h-3.5 w-3.5 text-[#FF8A5C]" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="flex min-h-[38px] items-center gap-1.5 rounded-lg border border-white/15 bg-[#1C212A] px-2.5 py-1.5 text-xs font-medium text-slate-200 whitespace-nowrap shrink-0"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Install</span>
        </button>

        {showIOSGuide && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          >
            <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#161A20] p-5 shadow-2xl">
              <h3 className="text-base font-bold text-white">
                Install PadBridge on iOS
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                1. Tap the <strong>Share</strong> icon in Safari.
                <br />
                2. Select <strong>Add to Home Screen</strong> for full-screen launch.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full min-h-[40px] rounded-xl bg-[#FF5A1F] text-xs font-semibold text-white"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};

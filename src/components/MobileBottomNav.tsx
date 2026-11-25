import React from 'react';
import { Gamepad2, Keyboard, MousePointer2, SlidersHorizontal } from 'lucide-react';
import type { ControllerTab } from '../types/controller';

interface MobileBottomNavProps {
  activeTab: ControllerTab;
  onSelectTab: (tab: ControllerTab) => void;
}

const ITEMS: { id: ControllerTab; label: string; icon: React.ReactNode }[] = [
  { id: 'gamepad', label: 'Gamepad', icon: <Gamepad2 className="h-5 w-5" /> },
  { id: 'mouse', label: 'Mouse', icon: <MousePointer2 className="h-5 w-5" /> },
  { id: 'keyboard', label: 'Keyboard', icon: <Keyboard className="h-5 w-5" /> },
  { id: 'tune', label: 'Tune', icon: <SlidersHorizontal className="h-5 w-5" /> },
];

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
}) => {
  return (
    <nav
      aria-label="Mobile controller navigation"
      className="fixed bottom-0 left-0 right-0 z-40 grid h-15 grid-cols-4 items-center border-t border-white/10 bg-[#0D0F12]/95 backdrop-blur-md md:hidden"
    >
      {ITEMS.map((item) => {
        const active = activeTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectTab(item.id)}
            className={`flex h-full flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${
              active ? 'text-[#FF5A1F]' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

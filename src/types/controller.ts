export type ControllerTab = 'gamepad' | 'mouse' | 'keyboard' | 'tune';

export type MouseButton = 'left' | 'middle' | 'right';

export type GamepadButtonId =
  | 'A'
  | 'B'
  | 'X'
  | 'Y'
  | 'LB'
  | 'RB'
  | 'LT'
  | 'RT'
  | 'L3'
  | 'R3'
  | 'DPAD_UP'
  | 'DPAD_DOWN'
  | 'DPAD_LEFT'
  | 'DPAD_RIGHT'
  | 'START'
  | 'SELECT'
  | 'ESC'
  | 'TAB'
  | 'SPACE'
  | 'SPRINT'
  | 'CTRL';

export type StickMode = 'wasd' | 'arrows' | 'mouse' | 'analog';

export interface MappingTarget {
  type: 'key' | 'mouse';
  code: string;
  label: string;
}

export interface ControllerProfile {
  id: string;
  name: string;
  description: string;
  leftStickMode: StickMode;
  rightStickMode: StickMode;
  mappings: Record<GamepadButtonId, MappingTarget>;
}

export interface ControllerSettings {
  pointerSpeed: number; // 0.4 - 3.0
  scrollSpeed: number; // 0.5 - 2.5
  stickSensitivity: number; // 0.5 - 2.5
  stickDeadzone: number; // 0.0 - 0.35
  naturalScroll: boolean;
  tapToClick: boolean;
  pointerAcceleration: boolean;
  hapticsEnabled: boolean;
  soundEnabled: boolean;
}

export type InputEventPayload =
  | {
      kind: 'mouse:move';
      dx: number;
      dy: number;
      source?: 'trackpad' | 'stick';
    }
  | {
      kind: 'mouse:button';
      button: MouseButton;
      action: 'down' | 'up' | 'click';
    }
  | {
      kind: 'mouse:scroll';
      dy: number;
      dx?: number;
    }
  | {
      kind: 'key:state';
      code: string;
      label: string;
      pressed: boolean;
      modifiers?: {
        ctrl?: boolean;
        alt?: boolean;
        shift?: boolean;
        meta?: boolean;
      };
    }
  | {
      kind: 'key:tap';
      code: string;
      label: string;
      modifiers?: {
        ctrl?: boolean;
        alt?: boolean;
        shift?: boolean;
        meta?: boolean;
      };
    }
  | {
      kind: 'key:text';
      text: string;
    }
  | {
      kind: 'gamepad:stick';
      stick: 'left' | 'right';
      x: number;
      y: number;
    }
  | {
      kind: 'gamepad:button';
      button: GamepadButtonId;
      pressed: boolean;
      mappedTarget?: MappingTarget;
    };

export interface ClickRipple {
  id: number;
  x: number; // 0..100 percentage
  y: number; // 0..100 percentage
  button: MouseButton;
  timestamp: number;
}

export interface ReceiverEventLogItem {
  id: number;
  summary: string;
  kind: string;
  timestamp: number;
}

export interface ReceiverState {
  cursorX: number; // 0..100 percentage on virtual desktop
  cursorY: number; // 0..100 percentage on virtual desktop
  scrollOffset: number;
  leftButtonDown: boolean;
  rightButtonDown: boolean;
  middleButtonDown: boolean;
  totalClicks: number;
  targetHits: number;
  ripples: ClickRipple[];
  textBuffer: string;
  activeKeys: string[];
  leftStick: { x: number; y: number };
  rightStick: { x: number; y: number };
  activeGamepadButtons: GamepadButtonId[];
  eventLog: ReceiverEventLogItem[];
  nextId: number;
}

export type ConnectionState = 'disconnected' | 'connecting' | 'connected';

export interface RoomPeers {
  controllers: number;
  receivers: number;
}

import type {
  ControllerProfile,
  ControllerSettings,
  GamepadButtonId,
  InputEventPayload,
  MappingTarget,
  ReceiverState,
} from '../types/controller';

export const DEFAULT_SETTINGS: ControllerSettings = {
  pointerSpeed: 1.35,
  scrollSpeed: 1.2,
  stickSensitivity: 1.25,
  stickDeadzone: 0.14,
  naturalScroll: false,
  tapToClick: true,
  pointerAcceleration: true,
  hapticsEnabled: true,
  soundEnabled: false,
};

export const AVAILABLE_KEY_TARGETS: MappingTarget[] = [
  { type: 'key', code: 'Space', label: 'SPACE' },
  { type: 'key', code: 'KeyE', label: 'E' },
  { type: 'key', code: 'KeyQ', label: 'Q' },
  { type: 'key', code: 'KeyR', label: 'R' },
  { type: 'key', code: 'KeyF', label: 'F' },
  { type: 'key', code: 'KeyG', label: 'G' },
  { type: 'key', code: 'ShiftLeft', label: 'SHIFT' },
  { type: 'key', code: 'ControlLeft', label: 'CTRL' },
  { type: 'key', code: 'AltLeft', label: 'ALT' },
  { type: 'key', code: 'Tab', label: 'TAB' },
  { type: 'key', code: 'Escape', label: 'ESC' },
  { type: 'key', code: 'Enter', label: 'ENTER' },
  { type: 'key', code: 'KeyC', label: 'C' },
  { type: 'key', code: 'KeyV', label: 'V' },
  { type: 'key', code: 'KeyM', label: 'M' },
  { type: 'key', code: 'ArrowUp', label: 'UP' },
  { type: 'key', code: 'ArrowDown', label: 'DOWN' },
  { type: 'key', code: 'ArrowLeft', label: 'LEFT' },
  { type: 'key', code: 'ArrowRight', label: 'RIGHT' },
  { type: 'key', code: 'Digit1', label: '1' },
  { type: 'key', code: 'Digit2', label: '2' },
  { type: 'key', code: 'Digit3', label: '3' },
  { type: 'mouse', code: 'left', label: 'LMB' },
  { type: 'mouse', code: 'right', label: 'RMB' },
  { type: 'mouse', code: 'middle', label: 'MMB' },
];

const BASE_MAPPINGS: Record<GamepadButtonId, MappingTarget> = {
  A: { type: 'key', code: 'Space', label: 'SPACE' },
  B: { type: 'key', code: 'ControlLeft', label: 'CTRL' },
  X: { type: 'key', code: 'KeyR', label: 'R' },
  Y: { type: 'key', code: 'KeyF', label: 'F' },
  LB: { type: 'key', code: 'KeyQ', label: 'Q' },
  RB: { type: 'key', code: 'KeyE', label: 'E' },
  LT: { type: 'mouse', code: 'right', label: 'RMB' },
  RT: { type: 'mouse', code: 'left', label: 'LMB' },
  L3: { type: 'key', code: 'ShiftLeft', label: 'SHIFT' },
  R3: { type: 'key', code: 'KeyV', label: 'V' },
  DPAD_UP: { type: 'key', code: 'Digit1', label: '1' },
  DPAD_RIGHT: { type: 'key', code: 'Digit2', label: '2' },
  DPAD_DOWN: { type: 'key', code: 'Digit3', label: '3' },
  DPAD_LEFT: { type: 'key', code: 'KeyG', label: 'G' },
  START: { type: 'key', code: 'Enter', label: 'ENTER' },
  SELECT: { type: 'key', code: 'KeyM', label: 'MAP' },
  ESC: { type: 'key', code: 'Escape', label: 'ESC' },
  TAB: { type: 'key', code: 'Tab', label: 'TAB' },
  SPACE: { type: 'key', code: 'Space', label: 'SPACE' },
  SPRINT: { type: 'key', code: 'ShiftLeft', label: 'SPRINT' },
  CTRL: { type: 'key', code: 'ControlLeft', label: 'CTRL' },
};

export const DEFAULT_PROFILES: ControllerProfile[] = [
  {
    id: 'fps',
    name: 'FPS & Action',
    description: 'Left stick WASD, right stick mouse look, LT/RT aim & fire',
    leftStickMode: 'wasd',
    rightStickMode: 'mouse',
    mappings: { ...BASE_MAPPINGS },
  },
  {
    id: 'platformer',
    name: 'Platformer',
    description: 'Arrow/WASD movement, A jump, X attack, B dash',
    leftStickMode: 'wasd',
    rightStickMode: 'arrows',
    mappings: {
      ...BASE_MAPPINGS,
      A: { type: 'key', code: 'Space', label: 'SPACE' },
      B: { type: 'key', code: 'ShiftLeft', label: 'DASH' },
      X: { type: 'key', code: 'KeyJ', label: 'J' },
      Y: { type: 'key', code: 'KeyK', label: 'K' },
      DPAD_UP: { type: 'key', code: 'ArrowUp', label: 'UP' },
      DPAD_DOWN: { type: 'key', code: 'ArrowDown', label: 'DOWN' },
      DPAD_LEFT: { type: 'key', code: 'ArrowLeft', label: 'LEFT' },
      DPAD_RIGHT: { type: 'key', code: 'ArrowRight', label: 'RIGHT' },
    },
  },
  {
    id: 'couch',
    name: 'Couch Media',
    description: 'Right stick mouse, A click/play, D-pad arrow navigation',
    leftStickMode: 'arrows',
    rightStickMode: 'mouse',
    mappings: {
      ...BASE_MAPPINGS,
      A: { type: 'key', code: 'Space', label: 'PLAY' },
      B: { type: 'key', code: 'Escape', label: 'ESC' },
      X: { type: 'key', code: 'KeyF', label: 'FULL' },
      Y: { type: 'key', code: 'KeyM', label: 'MUTE' },
      LB: { type: 'key', code: 'ArrowLeft', label: 'BACK' },
      RB: { type: 'key', code: 'ArrowRight', label: 'SKIP' },
      LT: { type: 'mouse', code: 'right', label: 'RMB' },
      RT: { type: 'mouse', code: 'left', label: 'LMB' },
      DPAD_UP: { type: 'key', code: 'ArrowUp', label: 'UP' },
      DPAD_DOWN: { type: 'key', code: 'ArrowDown', label: 'DOWN' },
      DPAD_LEFT: { type: 'key', code: 'ArrowLeft', label: 'LEFT' },
      DPAD_RIGHT: { type: 'key', code: 'ArrowRight', label: 'RIGHT' },
    },
  },
];

export interface DeadzoneResult {
  x: number;
  y: number;
  magnitude: number;
  rawMagnitude: number;
}

/**
 * Applies a scaled radial deadzone to a normalized stick vector in [-1, 1].
 * Smoothly rescales values outside [deadzone, 1] back to [0, 1] so motion starts at zero.
 */
export function applyRadialDeadzone(
  dx: number,
  dy: number,
  deadzone = 0.14,
  sensitivity = 1.0
): DeadzoneResult {
  const clampedDz = Math.max(0, Math.min(0.6, deadzone));
  const rawMag = Math.hypot(dx, dy);

  if (rawMag <= clampedDz || rawMag === 0) {
    return { x: 0, y: 0, magnitude: 0, rawMagnitude: rawMag };
  }

  const clampedRaw = Math.min(1, rawMag);
  const rescaledMag = (clampedRaw - clampedDz) / (1 - clampedDz);
  const boostedMag = Math.min(1, rescaledMag * Math.max(0.25, sensitivity));

  const nx = (dx / rawMag) * boostedMag;
  const ny = (dy / rawMag) * boostedMag;

  return {
    x: Number(nx.toFixed(3)),
    y: Number(ny.toFixed(3)),
    magnitude: Number(boostedMag.toFixed(3)),
    rawMagnitude: Number(rawMag.toFixed(3)),
  };
}

export interface StickDirections {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

export function stickToDirectionalKeys(
  x: number,
  y: number,
  threshold = 0.35
): StickDirections {
  return {
    up: y < -threshold,
    down: y > threshold,
    left: x < -threshold,
    right: x > threshold,
  };
}

export function computeTrackpadDelta(
  rawDx: number,
  rawDy: number,
  sensitivity: number,
  acceleration: boolean
): { dx: number; dy: number } {
  const speed = Math.hypot(rawDx, rawDy);
  const accelBoost = acceleration ? 1 + Math.min(1.4, speed * 0.045) : 1;
  const factor = Math.max(0.2, sensitivity) * accelBoost;
  return {
    dx: rawDx * factor,
    dy: rawDy * factor,
  };
}

const PAIRING_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generatePairingCode(): string {
  let out = '';
  for (let i = 0; i < 6; i += 1) {
    const idx = Math.floor(Math.random() * PAIRING_ALPHABET.length);
    out += PAIRING_ALPHABET[idx];
  }
  return out;
}

export function normalizePairingCode(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 6);
}

export function formatPairingCode(code: string): string {
  const clean = normalizePairingCode(code);
  if (clean.length <= 3) return clean;
  return `${clean.slice(0, 3)}-${clean.slice(3)}`;
}

export function remapProfileButton(
  profile: ControllerProfile,
  button: GamepadButtonId,
  target: MappingTarget
): ControllerProfile {
  return {
    ...profile,
    mappings: {
      ...profile.mappings,
      [button]: target,
    },
  };
}

export function createInitialReceiverState(): ReceiverState {
  return {
    cursorX: 50,
    cursorY: 50,
    scrollOffset: 0,
    leftButtonDown: false,
    rightButtonDown: false,
    middleButtonDown: false,
    totalClicks: 0,
    targetHits: 0,
    ripples: [],
    textBuffer: 'PadBridge PC Receiver ready.\nType, paste, or click targets from your controller.',
    activeKeys: [],
    leftStick: { x: 0, y: 0 },
    rightStick: { x: 0, y: 0 },
    activeGamepadButtons: [],
    eventLog: [],
    nextId: 1,
  };
}

function appendLog(
  state: ReceiverState,
  kind: string,
  summary: string
): { eventLog: ReceiverState['eventLog']; nextId: number } {
  const id = state.nextId;
  const entry = {
    id,
    kind,
    summary,
    timestamp: Date.now(),
  };
  return {
    eventLog: [entry, ...state.eventLog].slice(0, 14),
    nextId: id + 1,
  };
}

function applySingleKeyToBuffer(buffer: string, code: string, label: string): string {
  if (code === 'Backspace') {
    return buffer.slice(0, -1);
  }
  if (code === 'Enter') {
    return `${buffer}\n`;
  }
  if (code === 'Space') {
    return `${buffer} `;
  }
  if (code === 'Tab') {
    return `${buffer}  `;
  }
  if (label.length === 1) {
    return `${buffer}${label}`;
  }
  return buffer;
}

export function applyReceiverEvent(
  state: ReceiverState,
  event: InputEventPayload
): ReceiverState {
  switch (event.kind) {
    case 'mouse:move': {
      // Scale pixel delta cleanly into 0..100% virtual desktop percentage
      const nextX = Math.max(1, Math.min(99, state.cursorX + event.dx * 0.14));
      const nextY = Math.max(1, Math.min(99, state.cursorY + event.dy * 0.2));
      return {
        ...state,
        cursorX: Number(nextX.toFixed(2)),
        cursorY: Number(nextY.toFixed(2)),
      };
    }

    case 'mouse:button': {
      const next = { ...state };
      if (event.action === 'down') {
        if (event.button === 'left') next.leftButtonDown = true;
        if (event.button === 'right') next.rightButtonDown = true;
        if (event.button === 'middle') next.middleButtonDown = true;
      } else if (event.action === 'up') {
        if (event.button === 'left') next.leftButtonDown = false;
        if (event.button === 'right') next.rightButtonDown = false;
        if (event.button === 'middle') next.middleButtonDown = false;
      }

      if (event.action === 'down' || event.action === 'click') {
        const logUpdate = appendLog(
          state,
          'mouse',
          `${event.button.toUpperCase()} ${event.action}`
        );
        const ripple = {
          id: logUpdate.nextId,
          x: state.cursorX,
          y: state.cursorY,
          button: event.button,
          timestamp: Date.now(),
        };
        // Check hit on center target zone (40..60% X, 32..62% Y)
        const hitCenter =
          state.cursorX >= 38 &&
          state.cursorX <= 62 &&
          state.cursorY >= 30 &&
          state.cursorY <= 65;

        return {
          ...next,
          totalClicks: state.totalClicks + 1,
          targetHits: hitCenter ? state.targetHits + 1 : state.targetHits,
          ripples: [ripple, ...state.ripples].slice(0, 6),
          eventLog: logUpdate.eventLog,
          nextId: logUpdate.nextId + 1,
        };
      }
      return next;
    }

    case 'mouse:scroll': {
      const nextOffset = Math.max(-400, Math.min(400, state.scrollOffset + event.dy));
      return {
        ...state,
        scrollOffset: Number(nextOffset.toFixed(1)),
      };
    }

    case 'key:state': {
      const hasKey = state.activeKeys.includes(event.label);
      const activeKeys = event.pressed
        ? hasKey
          ? state.activeKeys
          : [...state.activeKeys, event.label]
        : state.activeKeys.filter((k) => k !== event.label);

      if (!event.pressed) {
        return { ...state, activeKeys };
      }

      const modPrefix = [
        event.modifiers?.ctrl ? 'Ctrl' : null,
        event.modifiers?.alt ? 'Alt' : null,
        event.modifiers?.shift ? 'Shift' : null,
        event.modifiers?.meta ? 'Win' : null,
      ]
        .filter(Boolean)
        .join('+');
      const fullLabel = modPrefix ? `${modPrefix}+${event.label}` : event.label;
      const logUpdate = appendLog(state, 'key', fullLabel);

      const isPrintableOrEdit = !event.modifiers?.ctrl && !event.modifiers?.alt && !event.modifiers?.meta;
      const charToWrite =
        event.modifiers?.shift && event.label.length === 1
          ? event.label.toUpperCase()
          : event.label.length === 1
            ? event.label.toLowerCase()
            : event.label;

      const textBuffer = isPrintableOrEdit
        ? applySingleKeyToBuffer(state.textBuffer, event.code, charToWrite)
        : state.textBuffer;

      return {
        ...state,
        activeKeys,
        textBuffer: textBuffer.slice(-600),
        eventLog: logUpdate.eventLog,
        nextId: logUpdate.nextId,
      };
    }

    case 'key:tap': {
      const modPrefix = [
        event.modifiers?.ctrl ? 'Ctrl' : null,
        event.modifiers?.alt ? 'Alt' : null,
        event.modifiers?.shift ? 'Shift' : null,
        event.modifiers?.meta ? 'Win' : null,
      ]
        .filter(Boolean)
        .join('+');
      const fullLabel = modPrefix ? `${modPrefix}+${event.label}` : event.label;
      const logUpdate = appendLog(state, 'macro', fullLabel);

      const isPrintableOrEdit = !event.modifiers?.ctrl && !event.modifiers?.alt && !event.modifiers?.meta;
      const textBuffer = isPrintableOrEdit
        ? applySingleKeyToBuffer(state.textBuffer, event.code, event.label)
        : state.textBuffer;

      return {
        ...state,
        textBuffer: textBuffer.slice(-600),
        eventLog: logUpdate.eventLog,
        nextId: logUpdate.nextId,
      };
    }

    case 'key:text': {
      const logUpdate = appendLog(
        state,
        'paste',
        `Paste (${event.text.length} chars)`
      );
      return {
        ...state,
        textBuffer: `${state.textBuffer}${event.text}`.slice(-600),
        eventLog: logUpdate.eventLog,
        nextId: logUpdate.nextId,
      };
    }

    case 'gamepad:stick': {
      if (event.stick === 'left') {
        return { ...state, leftStick: { x: event.x, y: event.y } };
      }
      return { ...state, rightStick: { x: event.x, y: event.y } };
    }

    case 'gamepad:button': {
      const exists = state.activeGamepadButtons.includes(event.button);
      const activeGamepadButtons = event.pressed
        ? exists
          ? state.activeGamepadButtons
          : [...state.activeGamepadButtons, event.button]
        : state.activeGamepadButtons.filter((b) => b !== event.button);

      if (!event.pressed) {
        return { ...state, activeGamepadButtons };
      }
      const targetStr = event.mappedTarget ? ` → ${event.mappedTarget.label}` : '';
      const logUpdate = appendLog(state, 'pad', `${event.button}${targetStr}`);
      return {
        ...state,
        activeGamepadButtons,
        eventLog: logUpdate.eventLog,
        nextId: logUpdate.nextId,
      };
    }
  }
}

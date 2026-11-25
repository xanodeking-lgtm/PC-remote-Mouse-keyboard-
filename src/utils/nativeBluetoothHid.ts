import { Capacitor, registerPlugin } from '@capacitor/core';
import type { GamepadButtonId, InputEventPayload } from '../types/controller';

export interface BluetoothHidStatus {
  supported: boolean;
  permissionsGranted: boolean;
  bluetoothEnabled: boolean;
  registered: boolean;
  connectedDeviceName: string | null;
  connectedDeviceAddress: string | null;
}

export interface PairedBluetoothDevice {
  name: string;
  address: string;
}

interface BluetoothHidPluginInterface {
  getStatus(): Promise<BluetoothHidStatus>;
  requestPermissions(): Promise<BluetoothHidStatus>;
  registerHid(): Promise<BluetoothHidStatus>;
  getPairedDevices(): Promise<{ devices: PairedBluetoothDevice[] }>;
  connectDevice(options: { address: string }): Promise<BluetoothHidStatus>;
  disconnectDevice(): Promise<BluetoothHidStatus>;
  sendMouseReport(options: {
    buttons: number;
    dx: number;
    dy: number;
    wheel: number;
  }): Promise<void>;
  sendKeyboardReport(options: {
    modifiers: number;
    keys: number[];
  }): Promise<void>;
  sendGamepadReport(options: {
    buttonsMask: number;
    lx: number;
    ly: number;
    rx: number;
    ry: number;
  }): Promise<void>;
  addListener(
    eventName: 'hidStateChange',
    listenerFunc: (status: BluetoothHidStatus) => void
  ): Promise<{ remove: () => Promise<void> }>;
}

const BluetoothHid = registerPlugin<BluetoothHidPluginInterface>('BluetoothHid');

// Standard USB HID Keyboard Usage IDs (Usage Page 0x07)
const KEY_USAGE_MAP: Record<string, number> = {
  KeyA: 0x04,
  KeyB: 0x05,
  KeyC: 0x06,
  KeyD: 0x07,
  KeyE: 0x08,
  KeyF: 0x09,
  KeyG: 0x0a,
  KeyH: 0x0b,
  KeyI: 0x0c,
  KeyJ: 0x0d,
  KeyK: 0x0e,
  KeyL: 0x0f,
  KeyM: 0x10,
  KeyN: 0x11,
  KeyO: 0x12,
  KeyP: 0x13,
  KeyQ: 0x14,
  KeyR: 0x15,
  KeyS: 0x16,
  KeyT: 0x17,
  KeyU: 0x18,
  KeyV: 0x19,
  KeyW: 0x1a,
  KeyX: 0x1b,
  KeyY: 0x1c,
  KeyZ: 0x1d,
  Digit1: 0x1e,
  Digit2: 0x1f,
  Digit3: 0x20,
  Digit4: 0x21,
  Digit5: 0x22,
  Digit6: 0x23,
  Digit7: 0x24,
  Digit8: 0x25,
  Digit9: 0x26,
  Digit0: 0x27,
  Enter: 0x28,
  Escape: 0x29,
  Backspace: 0x2a,
  Tab: 0x2b,
  Space: 0x2c,
  Minus: 0x2d,
  Equal: 0x2e,
  BracketLeft: 0x2f,
  BracketRight: 0x30,
  Backslash: 0x31,
  Semicolon: 0x33,
  Quote: 0x34,
  Backquote: 0x35,
  Comma: 0x36,
  Period: 0x37,
  Slash: 0x38,
  F1: 0x3a,
  F2: 0x3b,
  F3: 0x3c,
  F4: 0x3d,
  F5: 0x3e,
  F6: 0x3f,
  F7: 0x40,
  F8: 0x41,
  F9: 0x42,
  F10: 0x43,
  F11: 0x44,
  F12: 0x45,
  PrintScreen: 0x46,
  Insert: 0x49,
  Home: 0x4a,
  PageUp: 0x4b,
  Delete: 0x4c,
  End: 0x4d,
  PageDown: 0x4e,
  ArrowRight: 0x4f,
  ArrowLeft: 0x50,
  ArrowDown: 0x51,
  ArrowUp: 0x52,
};

export function mapKeyCodeToHidUsage(code: string): number {
  return KEY_USAGE_MAP[code] ?? 0;
}

export function clampHidByte(value: number): number {
  return Math.max(-127, Math.min(127, Math.round(value)));
}

export function encodeMouseReport(
  dx: number,
  dy: number,
  wheel: number,
  buttonsMask: number
): { buttons: number; dx: number; dy: number; wheel: number } {
  return {
    buttons: buttonsMask & 0x07,
    dx: clampHidByte(dx),
    dy: clampHidByte(dy),
    wheel: clampHidByte(wheel),
  };
}

export function encodeKeyboardModifiers(modifiers?: {
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
}): number {
  if (!modifiers) return 0;
  let mask = 0;
  if (modifiers.ctrl) mask |= 0x01;
  if (modifiers.shift) mask |= 0x02;
  if (modifiers.alt) mask |= 0x04;
  if (modifiers.meta) mask |= 0x08;
  return mask;
}

export function encodeKeyboardReport(
  modifiers: number,
  activeKeyCodes: string[]
): { modifiers: number; keys: number[] } {
  const keys: number[] = [];
  for (const code of activeKeyCodes) {
    const usage = mapKeyCodeToHidUsage(code);
    if (usage > 0 && !keys.includes(usage)) {
      keys.push(usage);
      if (keys.length === 6) break;
    }
  }
  while (keys.length < 6) {
    keys.push(0);
  }
  return { modifiers: modifiers & 0xff, keys };
}

const GAMEPAD_BUTTON_BITS: Partial<Record<GamepadButtonId, number>> = {
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  LB: 4,
  RB: 5,
  LT: 6,
  RT: 7,
  SELECT: 8,
  START: 9,
  L3: 10,
  R3: 11,
  DPAD_UP: 12,
  DPAD_DOWN: 13,
  DPAD_LEFT: 14,
  DPAD_RIGHT: 15,
};

export function gamepadButtonToBitIndex(button: GamepadButtonId): number | null {
  return GAMEPAD_BUTTON_BITS[button] ?? null;
}

export function encodeGamepadReport(
  buttonsMask: number,
  lx: number,
  ly: number,
  rx: number,
  ry: number
): { buttonsMask: number; lx: number; ly: number; rx: number; ry: number } {
  return {
    buttonsMask: buttonsMask & 0xffff,
    lx: clampHidByte(lx * 127),
    ly: clampHidByte(ly * 127),
    rx: clampHidByte(rx * 127),
    ry: clampHidByte(ry * 127),
  };
}

export function isNativeAndroid(): boolean {
  try {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  } catch {
    return false;
  }
}

export async function getHidStatus(): Promise<BluetoothHidStatus | null> {
  if (!isNativeAndroid()) return null;
  return BluetoothHid.getStatus();
}

export async function requestBluetoothPermissions(): Promise<BluetoothHidStatus | null> {
  if (!isNativeAndroid()) return null;
  return BluetoothHid.requestPermissions();
}

export async function registerHidDevice(): Promise<BluetoothHidStatus | null> {
  if (!isNativeAndroid()) return null;
  return BluetoothHid.registerHid();
}

export async function getPairedBluetoothDevices(): Promise<PairedBluetoothDevice[]> {
  if (!isNativeAndroid()) return [];
  const res = await BluetoothHid.getPairedDevices();
  return res.devices ?? [];
}

export async function connectBluetoothHost(
  address: string
): Promise<BluetoothHidStatus | null> {
  if (!isNativeAndroid()) return null;
  return BluetoothHid.connectDevice({ address });
}

export async function disconnectBluetoothHost(): Promise<BluetoothHidStatus | null> {
  if (!isNativeAndroid()) return null;
  return BluetoothHid.disconnectDevice();
}

export function subscribeHidState(
  cb: (status: BluetoothHidStatus) => void
): () => void {
  if (!isNativeAndroid()) return () => {};
  const handlePromise = BluetoothHid.addListener('hidStateChange', cb);
  return () => {
    handlePromise.then((h) => h.remove()).catch(() => {});
  };
}

// Stateful HID accumulator for live mouse buttons, active keys, and gamepad sticks
class NativeHidSession {
  private mouseButtonsMask = 0;
  private activeKeys = new Set<string>();
  private gamepadButtonsMask = 0;
  private leftStick = { x: 0, y: 0 };
  private rightStick = { x: 0, y: 0 };

  dispatch(payload: InputEventPayload): void {
    if (!isNativeAndroid()) return;

    switch (payload.kind) {
      case 'mouse:move': {
        const rep = encodeMouseReport(payload.dx, payload.dy, 0, this.mouseButtonsMask);
        BluetoothHid.sendMouseReport(rep).catch(() => {});
        break;
      }
      case 'mouse:scroll': {
        const rep = encodeMouseReport(
          0,
          0,
          -payload.dy * 0.2,
          this.mouseButtonsMask
        );
        BluetoothHid.sendMouseReport(rep).catch(() => {});
        break;
      }
      case 'mouse:button': {
        const bit =
          payload.button === 'left' ? 0x01 : payload.button === 'right' ? 0x02 : 0x04;
        if (payload.action === 'down') {
          this.mouseButtonsMask |= bit;
          BluetoothHid.sendMouseReport(
            encodeMouseReport(0, 0, 0, this.mouseButtonsMask)
          ).catch(() => {});
        } else if (payload.action === 'up') {
          this.mouseButtonsMask &= ~bit;
          BluetoothHid.sendMouseReport(
            encodeMouseReport(0, 0, 0, this.mouseButtonsMask)
          ).catch(() => {});
        } else {
          BluetoothHid.sendMouseReport(
            encodeMouseReport(0, 0, 0, this.mouseButtonsMask | bit)
          ).catch(() => {});
          window.setTimeout(() => {
            BluetoothHid.sendMouseReport(
              encodeMouseReport(0, 0, 0, this.mouseButtonsMask)
            ).catch(() => {});
          }, 25);
        }
        break;
      }
      case 'key:state': {
        if (payload.code === 'ControlLeft') break;
        if (payload.pressed) this.activeKeys.add(payload.code);
        else this.activeKeys.delete(payload.code);
        const mods = encodeKeyboardModifiers(payload.modifiers);
        BluetoothHid.sendKeyboardReport(
          encodeKeyboardReport(mods, Array.from(this.activeKeys))
        ).catch(() => {});
        break;
      }
      case 'key:tap': {
        const mods = encodeKeyboardModifiers(payload.modifiers);
        const list = Array.from(new Set([...this.activeKeys, payload.code]));
        BluetoothHid.sendKeyboardReport(
          encodeKeyboardReport(mods, list)
        ).catch(() => {});
        window.setTimeout(() => {
          BluetoothHid.sendKeyboardReport(
            encodeKeyboardReport(0, Array.from(this.activeKeys))
          ).catch(() => {});
        }, 28);
        break;
      }
      case 'key:text': {
        // Type character-by-character via HID usage codes
        const chars = Array.from(payload.text);
        chars.forEach((ch, idx) => {
          const upper = ch >= 'A' && ch <= 'Z';
          const code =
            ch === ' '
              ? 'Space'
              : ch === '\n'
                ? 'Enter'
                : /^[a-zA-Z]$/.test(ch)
                  ? `Key${ch.toUpperCase()}`
                  : /^[0-9]$/.test(ch)
                    ? `Digit${ch}`
                    : '';
          if (!code) return;
          window.setTimeout(() => {
            const mods = upper ? 0x02 : 0;
            BluetoothHid.sendKeyboardReport(
              encodeKeyboardReport(mods, [code])
            ).catch(() => {});
            window.setTimeout(() => {
              BluetoothHid.sendKeyboardReport(
                encodeKeyboardReport(0, [])
              ).catch(() => {});
            }, 14);
          }, idx * 24);
        });
        break;
      }
      case 'gamepad:stick': {
        if (payload.stick === 'left') {
          this.leftStick = { x: payload.x, y: payload.y };
        } else {
          this.rightStick = { x: payload.x, y: payload.y };
        }
        BluetoothHid.sendGamepadReport(
          encodeGamepadReport(
            this.gamepadButtonsMask,
            this.leftStick.x,
            this.leftStick.y,
            this.rightStick.x,
            this.rightStick.y
          )
        ).catch(() => {});
        break;
      }
      case 'gamepad:button': {
        const bitIdx = gamepadButtonToBitIndex(payload.button);
        if (bitIdx === null) break;
        if (payload.pressed) {
          this.gamepadButtonsMask |= 1 << bitIdx;
        } else {
          this.gamepadButtonsMask &= ~(1 << bitIdx);
        }
        BluetoothHid.sendGamepadReport(
          encodeGamepadReport(
            this.gamepadButtonsMask,
            this.leftStick.x,
            this.leftStick.y,
            this.rightStick.x,
            this.rightStick.y
          )
        ).catch(() => {});
        break;
      }
    }
  }
}

export const nativeHidSession = new NativeHidSession();

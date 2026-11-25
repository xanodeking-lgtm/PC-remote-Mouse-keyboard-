export function generatePcCompanionScript(wsUrl: string, pairingCode: string): string {
  return `#!/usr/bin/env python3
"""
PadBridge PC Receiver Agent (Ad-Free Open Companion)
---------------------------------------------------
Translates live WebSocket input events from your phone/browser
into real OS-level mouse, scroll, and keyboard actions on Windows, macOS, or Linux.

Requirements:
  pip install websockets pynput

Run:
  python padbridge_pc.py
"""

import asyncio
import json
from pynput.mouse import Button, Controller as MouseController
from pynput.keyboard import Key, Controller as KeyboardController
import websockets

WS_URL = "${wsUrl}"
PAIRING_CODE = "${pairingCode}"

mouse = MouseController()
keyboard = KeyboardController()

KEY_MAP = {
    "Space": Key.space,
    "Enter": Key.enter,
    "Escape": Key.esc,
    "Tab": Key.tab,
    "Backspace": Key.backspace,
    "ShiftLeft": Key.shift,
    "ShiftRight": Key.shift_r,
    "ControlLeft": Key.ctrl_l,
    "ControlRight": Key.ctrl_r,
    "AltLeft": Key.alt_l,
    "AltRight": Key.alt_r,
    "MetaLeft": Key.cmd,
    "ArrowUp": Key.up,
    "ArrowDown": Key.down,
    "ArrowLeft": Key.left,
    "ArrowRight": Key.right,
    "Home": Key.home,
    "End": Key.end,
    "PageUp": Key.page_up,
    "PageDown": Key.page_down,
    "Insert": Key.insert,
    "Delete": Key.delete,
    "PrintScreen": Key.print_screen,
    **{f"F{i}": getattr(Key, f"f{i}") for i in range(1, 13)},
}

MOUSE_BUTTON_MAP = {
    "left": Button.left,
    "right": Button.right,
    "middle": Button.middle,
}

def resolve_key(code: str, label: str):
    if code in KEY_MAP:
        return KEY_MAP[code]
    if code.startswith("Key") and len(code) == 4:
        return code[3].lower()
    if code.startswith("Digit") and len(code) == 6:
        return code[5]
    if len(label) == 1:
        return label.lower()
    return None

def handle_event(event: dict):
    kind = event.get("kind")
    if kind == "mouse:move":
        mouse.move(float(event.get("dx", 0)), float(event.get("dy", 0)))
    elif kind == "mouse:button":
        btn = MOUSE_BUTTON_MAP.get(event.get("button", "left"), Button.left)
        action = event.get("action")
        if action == "down":
            mouse.press(btn)
        elif action == "up":
            mouse.release(btn)
        elif action == "click":
            mouse.click(btn, 1)
    elif kind == "mouse:scroll":
        mouse.scroll(float(event.get("dx", 0)), float(event.get("dy", 0)) * -0.15)
    elif kind == "key:text":
        keyboard.type(str(event.get("text", "")))
    elif kind in ("key:state", "key:tap"):
        key = resolve_key(str(event.get("code", "")), str(event.get("label", "")))
        if not key:
            return
        mods = event.get("modifiers") or {}
        held_mods = []
        if mods.get("ctrl"): held_mods.append(Key.ctrl_l)
        if mods.get("alt"): held_mods.append(Key.alt_l)
        if mods.get("shift"): held_mods.append(Key.shift)
        if mods.get("meta"): held_mods.append(Key.cmd)

        for m in held_mods:
            keyboard.press(m)
        if kind == "key:tap":
            keyboard.press(key)
            keyboard.release(key)
        elif event.get("pressed"):
            keyboard.press(key)
        else:
            keyboard.release(key)
        for m in reversed(held_mods):
            keyboard.release(m)

async def main():
    print(f"Connecting PadBridge PC Receiver to {WS_URL} (Room {PAIRING_CODE})...")
    async with websockets.connect(WS_URL) as ws:
        await ws.send(json.dumps({
            "type": "join",
            "room": PAIRING_CODE,
            "role": "receiver",
        }))
        print("Paired! Your phone/browser now controls this PC.")
        async for raw in ws:
            msg = json.loads(raw)
            if msg.get("type") == "input" and msg.get("payload"):
                handle_event(msg["payload"])

if __name__ == "__main__":
    asyncio.run(main())
`;
}

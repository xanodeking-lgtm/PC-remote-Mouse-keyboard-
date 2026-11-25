import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampHidByte,
  encodeGamepadReport,
  encodeKeyboardModifiers,
  encodeKeyboardReport,
  encodeMouseReport,
  gamepadButtonToBitIndex,
  mapKeyCodeToHidUsage,
} from './nativeBluetoothHid';

test('mapKeyCodeToHidUsage resolves standard HID keyboard usages', () => {
  assert.equal(mapKeyCodeToHidUsage('KeyA'), 0x04);
  assert.equal(mapKeyCodeToHidUsage('Space'), 0x2c);
  assert.equal(mapKeyCodeToHidUsage('Enter'), 0x28);
  assert.equal(mapKeyCodeToHidUsage('F12'), 0x45);
  assert.equal(mapKeyCodeToHidUsage('UnknownKey'), 0);
});

test('encodeMouseReport clamps movement deltas and masks buttons', () => {
  const rep = encodeMouseReport(300, -250, 4.4, 0x05);
  assert.deepEqual(rep, {
    buttons: 5,
    dx: 127,
    dy: -127,
    wheel: 4,
  });
  assert.equal(clampHidByte(-999), -127);
});

test('encodeKeyboardReport encodes modifiers and 6-key rollover array', () => {
  const mods = encodeKeyboardModifiers({ ctrl: true, shift: true });
  assert.equal(mods, 0x03);

  const rep = encodeKeyboardReport(mods, ['KeyC', 'KeyV', 'KeyC']);
  assert.equal(rep.modifiers, 3);
  assert.deepEqual(rep.keys, [0x06, 0x19, 0, 0, 0, 0]);
});

test('encodeGamepadReport scales normalized sticks to signed bytes and preserves bitmask', () => {
  const bitA = gamepadButtonToBitIndex('A');
  const bitRB = gamepadButtonToBitIndex('RB');
  assert.equal(bitA, 0);
  assert.equal(bitRB, 5);

  const mask = (1 << (bitA ?? 0)) | (1 << (bitRB ?? 0));
  const rep = encodeGamepadReport(mask, -1, 0.5, 1, -0.5);
  assert.deepEqual(rep, {
    buttonsMask: 33,
    lx: -127,
    ly: 64,
    rx: 127,
    ry: -63,
  });
});

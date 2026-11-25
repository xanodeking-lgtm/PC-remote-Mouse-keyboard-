import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyRadialDeadzone,
  applyReceiverEvent,
  computeTrackpadDelta,
  createInitialReceiverState,
  DEFAULT_PROFILES,
  formatPairingCode,
  generatePairingCode,
  normalizePairingCode,
  remapProfileButton,
  stickToDirectionalKeys,
} from './inputMath';

test('applyRadialDeadzone zeroes input inside deadzone and rescales outside', () => {
  const inside = applyRadialDeadzone(0.08, -0.05, 0.15, 1.0);
  assert.equal(inside.x, 0);
  assert.equal(inside.y, 0);
  assert.equal(inside.magnitude, 0);

  const edge = applyRadialDeadzone(1, 0, 0.2, 1.0);
  assert.equal(edge.x, 1);
  assert.equal(edge.y, 0);
  assert.equal(edge.magnitude, 1);

  const mid = applyRadialDeadzone(0.6, 0, 0.2, 1.0);
  assert.equal(mid.x, 0.5);
  assert.equal(mid.magnitude, 0.5);
});

test('stickToDirectionalKeys resolves cardinal and diagonal movement', () => {
  const diag = stickToDirectionalKeys(0.7, -0.7, 0.35);
  assert.deepEqual(diag, { up: true, down: false, left: false, right: true });

  const center = stickToDirectionalKeys(0.1, -0.2, 0.35);
  assert.deepEqual(center, { up: false, down: false, left: false, right: false });
});

test('computeTrackpadDelta applies sensitivity and optional acceleration', () => {
  const linear = computeTrackpadDelta(10, -5, 1.5, false);
  assert.equal(linear.dx, 15);
  assert.equal(linear.dy, -7.5);

  const accel = computeTrackpadDelta(20, 0, 1.0, true);
  assert.ok(accel.dx > 20);
});

test('pairing code helpers generate and normalize 6-char codes', () => {
  const code = generatePairingCode();
  assert.equal(code.length, 6);
  assert.equal(normalizePairingCode('k7m-49p!'), 'K7M49P');
  assert.equal(formatPairingCode('k7m49p'), 'K7M-49P');
});

test('remapProfileButton updates target immutably', () => {
  const fps = DEFAULT_PROFILES[0];
  const updated = remapProfileButton(fps, 'A', {
    type: 'key',
    code: 'KeyF',
    label: 'F',
  });
  assert.equal(updated.mappings.A.code, 'KeyF');
  assert.equal(fps.mappings.A.code, 'Space');
});

test('applyReceiverEvent handles cursor movement, clicks, typing, paste, and sticks', () => {
  let state = createInitialReceiverState();
  state = { ...state, textBuffer: '' };

  state = applyReceiverEvent(state, { kind: 'mouse:move', dx: 40, dy: -20 });
  assert.ok(state.cursorX > 50);
  assert.ok(state.cursorY < 50);

  state = applyReceiverEvent(state, {
    kind: 'mouse:button',
    button: 'left',
    action: 'click',
  });
  assert.equal(state.totalClicks, 1);
  assert.equal(state.ripples.length, 1);

  state = applyReceiverEvent(state, {
    kind: 'key:state',
    code: 'KeyH',
    label: 'h',
    pressed: true,
  });
  state = applyReceiverEvent(state, {
    kind: 'key:text',
    text: 'ello world',
  });
  assert.equal(state.textBuffer, 'hello world');

  state = applyReceiverEvent(state, {
    kind: 'key:tap',
    code: 'Backspace',
    label: 'BKSP',
  });
  assert.equal(state.textBuffer, 'hello worl');

  state = applyReceiverEvent(state, {
    kind: 'gamepad:stick',
    stick: 'left',
    x: -0.8,
    y: 0.4,
  });
  assert.deepEqual(state.leftStick, { x: -0.8, y: 0.4 });
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateStrength, clampLength, generatePassword, getActiveCharacterSets } from '../password.js';

function deterministicBytes() {
  let value = 0;
  return (length) => Uint8Array.from({ length }, () => value++ % 251);
}

test('clamps password length to supported range', () => {
  assert.equal(clampLength(4), 8);
  assert.equal(clampLength(16), 16);
  assert.equal(clampLength(128), 32);
});

test('generates password with requested length', () => {
  const password = generatePassword({ length: 24 }, deterministicBytes());
  assert.equal(password.length, 24);
});

test('uses only selected character set', () => {
  const password = generatePassword({ length: 12, uppercase: false, lowercase: false, numbers: true, symbols: false }, deterministicBytes());
  assert.match(password, /^[0-9]+$/);
});

test('includes at least one character from every selected type', () => {
  const password = generatePassword({ length: 16, uppercase: true, lowercase: true, numbers: true, symbols: true }, deterministicBytes());
  assert.match(password, /[A-Z]/);
  assert.match(password, /[a-z]/);
  assert.match(password, /[0-9]/);
  assert.match(password, /[!@#$%&*]/);
});

test('starts with a letter when letters are enabled', () => {
  const password = generatePassword({ length: 16, uppercase: true, lowercase: true, numbers: true, symbols: true }, deterministicBytes());
  assert.match(password[0], /[A-Za-z]/);
});

test('allows numeric first character when only numbers are enabled', () => {
  const password = generatePassword({ length: 12, uppercase: false, lowercase: false, numbers: true, symbols: false }, deterministicBytes());
  assert.match(password[0], /[0-9]/);
});

test('excludes ambiguous characters when configured', () => {
  const sets = getActiveCharacterSets({ uppercase: true, lowercase: true, numbers: true, symbols: false, excludeAmbiguous: true });
  const pool = sets.map((set) => set.value).join('');
  assert.doesNotMatch(pool, /[0Oo1lI]/);
});

test('throws when no character type is selected', () => {
  assert.throws(() => generatePassword({ uppercase: false, lowercase: false, numbers: false, symbols: false }), /至少选择一种/);
});

test('reports stronger score for longer mixed passwords', () => {
  const weak = calculateStrength({ length: 8, uppercase: false, lowercase: true, numbers: false, symbols: false });
  const strong = calculateStrength({ length: 32, uppercase: true, lowercase: true, numbers: true, symbols: true });
  assert.ok(strong.level > weak.level);
});

export const DEFAULT_CONFIG = Object.freeze({
  length: 16,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  excludeAmbiguous: false,
});

export const PASSWORD_LIMITS = Object.freeze({ min: 8, max: 32 });

export const CHARACTER_SETS = Object.freeze({
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%&*',
});

const AMBIGUOUS_CHARACTERS = new Set(['0', 'O', 'o', '1', 'l', 'I']);
const LEADING_CHARACTER_KEYS = ['uppercase', 'lowercase'];

export function clampLength(length) {
  const parsed = Number.parseInt(length, 10);
  if (Number.isNaN(parsed)) return DEFAULT_CONFIG.length;
  return Math.min(Math.max(parsed, PASSWORD_LIMITS.min), PASSWORD_LIMITS.max);
}

export function normalizeConfig(config = {}) {
  const merged = { ...DEFAULT_CONFIG, ...config };
  return {
    length: clampLength(merged.length),
    uppercase: Boolean(merged.uppercase),
    lowercase: Boolean(merged.lowercase),
    numbers: Boolean(merged.numbers),
    symbols: Boolean(merged.symbols),
    excludeAmbiguous: Boolean(merged.excludeAmbiguous),
  };
}

export function getActiveCharacterSets(config) {
  const normalized = normalizeConfig(config);
  return Object.entries(CHARACTER_SETS)
    .filter(([key]) => normalized[key])
    .map(([key, value]) => ({ key, value: filterAmbiguous(value, normalized.excludeAmbiguous) }))
    .filter((entry) => entry.value.length > 0);
}

export function calculateStrength(config) {
  const normalized = normalizeConfig(config);
  const activeTypeCount = getActiveCharacterSets(normalized).length;
  const score = normalized.length + activeTypeCount * 6 + (normalized.excludeAmbiguous ? 1 : 0);

  if (score >= 40) return { label: '很强', level: 4 };
  if (score >= 30) return { label: '强', level: 3 };
  if (score >= 20) return { label: '中等', level: 2 };
  return { label: '较弱', level: 1 };
}

export function generatePassword(config = {}, randomBytes = secureRandomBytes) {
  const normalized = normalizeConfig(config);
  const activeSets = getActiveCharacterSets(normalized);

  if (activeSets.length === 0) {
    throw new Error('请至少选择一种字符类型');
  }

  if (normalized.length < activeSets.length) {
    throw new Error('密码长度不能小于已选择的字符类型数量');
  }

  const requiredCharacters = activeSets.map((set) => pickRandomCharacter(set.value, randomBytes));
  const pool = activeSets.map((set) => set.value).join('');
  const remainingLength = normalized.length - requiredCharacters.length;
  const remainingCharacters = Array.from({ length: remainingLength }, () => pickRandomCharacter(pool, randomBytes));
  const shuffledCharacters = shuffleCharacters([...requiredCharacters, ...remainingCharacters], randomBytes);

  return moveAllowedLeadingCharacterToFront(shuffledCharacters, activeSets).join('');
}

function moveAllowedLeadingCharacterToFront(characters, activeSets) {
  const leadingCharacters = new Set(
    activeSets
      .filter((set) => LEADING_CHARACTER_KEYS.includes(set.key))
      .flatMap((set) => [...set.value]),
  );

  if (leadingCharacters.size === 0 || leadingCharacters.has(characters[0])) return characters;

  const leadingIndex = characters.findIndex((character) => leadingCharacters.has(character));
  if (leadingIndex <= 0) return characters;

  const adjusted = [...characters];
  [adjusted[0], adjusted[leadingIndex]] = [adjusted[leadingIndex], adjusted[0]];
  return adjusted;
}

function filterAmbiguous(value, shouldExclude) {
  if (!shouldExclude) return value;
  return [...value].filter((char) => !AMBIGUOUS_CHARACTERS.has(char)).join('');
}

function pickRandomCharacter(pool, randomBytes) {
  return pool[randomIndex(pool.length, randomBytes)];
}

function shuffleCharacters(characters, randomBytes) {
  const shuffled = [...characters];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = randomIndex(index + 1, randomBytes);
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function randomIndex(maxExclusive, randomBytes) {
  const limit = 256 - (256 % maxExclusive);
  let value;
  do {
    [value] = randomBytes(1);
  } while (value >= limit);
  return value % maxExclusive;
}

function secureRandomBytes(length) {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
}

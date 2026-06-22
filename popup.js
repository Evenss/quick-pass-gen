import { DEFAULT_CONFIG, PASSWORD_LIMITS, calculateStrength, clampLength, generatePassword, normalizeConfig } from './password.js';

const fields = {
  length: document.querySelector('#length'),
  lengthValue: document.querySelector('#lengthValue'),
  uppercase: document.querySelector('#uppercase'),
  lowercase: document.querySelector('#lowercase'),
  numbers: document.querySelector('#numbers'),
  symbols: document.querySelector('#symbols'),
  excludeAmbiguous: document.querySelector('#excludeAmbiguous'),
  password: document.querySelector('#password'),
  generate: document.querySelector('#generate'),
  copy: document.querySelector('#copy'),
  message: document.querySelector('#message'),
  copyHistory: document.querySelector('#copyHistory'),
  clearHistory: document.querySelector('#clearHistory'),
  strengthLabel: document.querySelector('#strengthLabel'),
  strengthBar: document.querySelector('#strengthBar'),
};

const STORAGE_KEY = 'quickPassGenConfig';
const HISTORY_STORAGE_KEY = 'quickPassGenCopyHistory';
const HISTORY_LIMIT = 10;
const SAVE_CONFIG_DELAY = 250;
let currentConfig = { ...DEFAULT_CONFIG };
let saveConfigTimer;
let hasUserEditedConfig = false;
let copyHistory = [];

init();

function init() {
  renderConfig(currentConfig);
  bindEvents();
  refreshPassword();
  loadStoredConfigAfterFirstPaint();
  loadStoredHistoryAfterFirstPaint();
}

function bindEvents() {
  fields.length.addEventListener('input', handleRangeLengthInput);
  fields.lengthValue.addEventListener('input', handleNumberLengthInput);
  fields.lengthValue.addEventListener('change', handleNumberLengthCommit);
  fields.lengthValue.addEventListener('blur', handleNumberLengthCommit);
  ['uppercase', 'lowercase', 'numbers', 'symbols', 'excludeAmbiguous'].forEach((name) => {
    fields[name].addEventListener('input', handleConfigChange);
  });
  fields.generate.addEventListener('click', handleGenerateClick);
  fields.copy.addEventListener('click', copyPassword);
  fields.clearHistory.addEventListener('click', clearCopyHistory);
  fields.password.addEventListener('focus', () => fields.password.select());
}

function handleRangeLengthInput() {
  fields.lengthValue.value = fields.length.value;
  handleConfigChange.call(fields.length);
}

function handleNumberLengthInput() {
  const value = Number.parseInt(fields.lengthValue.value, 10);
  if (Number.isNaN(value) || value < PASSWORD_LIMITS.min) return;
  if (value > PASSWORD_LIMITS.max) {
    fields.lengthValue.value = PASSWORD_LIMITS.max;
    fields.length.value = PASSWORD_LIMITS.max;
    handleConfigChange.call(fields.lengthValue);
    return;
  }
  fields.length.value = value;
  handleConfigChange.call(fields.lengthValue);
}

function handleNumberLengthCommit() {
  const previousLength = currentConfig.length;
  const committedLength = commitLengthInput();
  if (committedLength === previousLength) return;
  handleConfigChange.call(fields.lengthValue);
}

async function handleGenerateClick() {
  commitLengthInput();
  currentConfig = readConfigFromForm();
  refreshPassword();
  await saveConfig(currentConfig);
}

function commitLengthInput() {
  const length = clampLength(fields.lengthValue.value || fields.length.value);
  fields.length.value = length;
  fields.lengthValue.value = length;
  return length;
}

function handleConfigChange() {
  hasUserEditedConfig = true;
  currentConfig = readConfigFromForm();
  if (!hasActiveType(currentConfig)) {
    currentConfig[this.id] = true;
    renderConfig(currentConfig);
    showMessage('请至少保留一种字符类型');
    return;
  }

  renderConfig(currentConfig);
  refreshPassword();
  scheduleSaveConfig(currentConfig);
}

function refreshPassword() {
  try {
    const password = generatePassword(currentConfig);
    fields.password.value = password;
    updateStrength(currentConfig);
    showMessage('');
  } catch (error) {
    fields.password.value = '';
    showMessage(error.message);
  }
}

async function copyPassword() {
  const password = fields.password.value;
  if (!password) return;
  await navigator.clipboard.writeText(password);
  await addCopyHistoryItem(password);
  showMessage('已复制到剪贴板');
}


function renderCopyHistory() {
  fields.copyHistory.replaceChildren(
    ...copyHistory.map((item) => {
      const historyItem = document.createElement('li');
      const value = document.createElement('span');
      const time = document.createElement('time');

      value.className = 'history-value';
      value.textContent = item.value;
      time.className = 'history-time';
      time.dateTime = item.copiedAt;
      time.textContent = formatHistoryTime(item.copiedAt);

      historyItem.append(value, time);
      return historyItem;
    }),
  );
}

function formatHistoryTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '复制时间未知';
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function addCopyHistoryItem(value) {
  copyHistory = [{ value, copiedAt: new Date().toISOString() }, ...copyHistory].slice(0, HISTORY_LIMIT);
  renderCopyHistory();
  await saveCopyHistory(copyHistory);
}

async function clearCopyHistory() {
  copyHistory = [];
  renderCopyHistory();
  await saveCopyHistory(copyHistory);
  showMessage('复制历史已清空');
}

function loadStoredHistoryAfterFirstPaint() {
  requestAfterFirstPaint(async () => {
    copyHistory = await loadCopyHistory();
    renderCopyHistory();
  });
}

async function loadCopyHistory() {
  if (!globalThis.chrome?.storage?.local) return [];
  const result = await chrome.storage.local.get(HISTORY_STORAGE_KEY);
  return normalizeCopyHistory(result[HISTORY_STORAGE_KEY]);
}

function normalizeCopyHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((item) => item && typeof item.value === 'string' && typeof item.copiedAt === 'string')
    .slice(0, HISTORY_LIMIT);
}

async function saveCopyHistory(history) {
  if (!globalThis.chrome?.storage?.local) return;
  await chrome.storage.local.set({ [HISTORY_STORAGE_KEY]: normalizeCopyHistory(history) });
}

function readConfigFromForm() {
  return normalizeConfig({
    length: fields.lengthValue.value || fields.length.value,
    uppercase: fields.uppercase.checked,
    lowercase: fields.lowercase.checked,
    numbers: fields.numbers.checked,
    symbols: fields.symbols.checked,
    excludeAmbiguous: fields.excludeAmbiguous.checked,
  });
}

function renderConfig(config) {
  fields.length.value = config.length;
  fields.lengthValue.value = config.length;
  fields.uppercase.checked = config.uppercase;
  fields.lowercase.checked = config.lowercase;
  fields.numbers.checked = config.numbers;
  fields.symbols.checked = config.symbols;
  fields.excludeAmbiguous.checked = config.excludeAmbiguous;
  updateStrength(config);
}

function updateStrength(config) {
  const strength = calculateStrength(config);
  fields.strengthLabel.textContent = strength.label;
  fields.strengthBar.style.width = `${strength.level * 25}%`;
}

function showMessage(message) {
  fields.message.textContent = message;
}

function hasActiveType(config) {
  return config.uppercase || config.lowercase || config.numbers || config.symbols;
}

function loadStoredConfigAfterFirstPaint() {
  const loadStoredConfig = async () => {
    const storedConfig = await loadConfig();
    if (hasUserEditedConfig) return;
    currentConfig = storedConfig;
    renderConfig(storedConfig);
    refreshPassword();
  };

  requestAfterFirstPaint(loadStoredConfig);
}

function requestAfterFirstPaint(callback) {
  const afterNextFrame = globalThis.requestAnimationFrame ?? ((handler) => setTimeout(handler, 0));

  afterNextFrame(() => {
    const run = () => {
      callback().catch((error) => {
        console.error('Failed to load quick-pass-gen config:', error);
      });
    };

    if ('requestIdleCallback' in globalThis) {
      globalThis.requestIdleCallback(run, { timeout: 500 });
      return;
    }

    setTimeout(run, 0);
  });
}

async function loadConfig() {
  if (!globalThis.chrome?.storage?.local) return { ...DEFAULT_CONFIG };
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return normalizeConfig(result[STORAGE_KEY] ?? DEFAULT_CONFIG);
}

function scheduleSaveConfig(config) {
  clearTimeout(saveConfigTimer);
  const configToSave = normalizeConfig(config);
  saveConfigTimer = setTimeout(() => {
    saveConfig(configToSave).catch((error) => {
      console.error('Failed to save quick-pass-gen config:', error);
    });
  }, SAVE_CONFIG_DELAY);
}

async function saveConfig(config) {
  if (!globalThis.chrome?.storage?.local) return;
  await chrome.storage.local.set({ [STORAGE_KEY]: normalizeConfig(config) });
}

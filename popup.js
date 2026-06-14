import { DEFAULT_CONFIG, calculateStrength, generatePassword, normalizeConfig } from './password.js';

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
  strengthLabel: document.querySelector('#strengthLabel'),
  strengthBar: document.querySelector('#strengthBar'),
};

const STORAGE_KEY = 'quickPassGenConfig';
let currentConfig = { ...DEFAULT_CONFIG };

init();

async function init() {
  currentConfig = await loadConfig();
  renderConfig(currentConfig);
  bindEvents();
  refreshPassword();
}

function bindEvents() {
  ['length', 'uppercase', 'lowercase', 'numbers', 'symbols', 'excludeAmbiguous'].forEach((name) => {
    fields[name].addEventListener('input', handleConfigChange);
  });
  fields.generate.addEventListener('click', refreshPassword);
  fields.copy.addEventListener('click', copyPassword);
  fields.password.addEventListener('focus', () => fields.password.select());
}

async function handleConfigChange() {
  currentConfig = readConfigFromForm();
  if (!hasActiveType(currentConfig)) {
    currentConfig[this.id] = true;
    renderConfig(currentConfig);
    showMessage('请至少保留一种字符类型');
    return;
  }

  renderConfig(currentConfig);
  await saveConfig(currentConfig);
  refreshPassword();
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
  if (!fields.password.value) return;
  await navigator.clipboard.writeText(fields.password.value);
  showMessage('已复制到剪贴板');
}

function readConfigFromForm() {
  return normalizeConfig({
    length: fields.length.value,
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

async function loadConfig() {
  if (!globalThis.chrome?.storage?.local) return { ...DEFAULT_CONFIG };
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return normalizeConfig(result[STORAGE_KEY] ?? DEFAULT_CONFIG);
}

async function saveConfig(config) {
  if (!globalThis.chrome?.storage?.local) return;
  await chrome.storage.local.set({ [STORAGE_KEY]: normalizeConfig(config) });
}

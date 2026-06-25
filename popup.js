import { DEFAULT_CONFIG, PASSWORD_LIMITS, clampLength, generatePassword, normalizeConfig } from './password.js';

const fields = {
  app: document.querySelector('#app'),
  title: document.querySelector('#title'),
  languageToggle: document.querySelector('#languageToggle'),
  settings: document.querySelector('#settings'),
  lengthLabel: document.querySelector('#lengthLabel'),
  length: document.querySelector('#length'),
  lengthValue: document.querySelector('#lengthValue'),
  uppercase: document.querySelector('#uppercase'),
  uppercaseText: document.querySelector('#uppercaseText'),
  lowercase: document.querySelector('#lowercase'),
  lowercaseText: document.querySelector('#lowercaseText'),
  numbers: document.querySelector('#numbers'),
  numbersText: document.querySelector('#numbersText'),
  symbols: document.querySelector('#symbols'),
  symbolsText: document.querySelector('#symbolsText'),
  excludeAmbiguous: document.querySelector('#excludeAmbiguous'),
  excludeAmbiguousText: document.querySelector('#excludeAmbiguousText'),
  result: document.querySelector('#result'),
  passwordLabel: document.querySelector('#passwordLabel'),
  password: document.querySelector('#password'),
  generate: document.querySelector('#generate'),
  copy: document.querySelector('#copy'),
  fill: document.querySelector('#fill'),
  message: document.querySelector('#message'),
  history: document.querySelector('#history'),
  historyTitle: document.querySelector('#historyTitle'),
  copyHistory: document.querySelector('#copyHistory'),
  clearHistory: document.querySelector('#clearHistory'),
  historyEmpty: document.querySelector('#historyEmpty'),
};

const STORAGE_KEY = 'quickPassGenConfig';
const HISTORY_STORAGE_KEY = 'quickPassGenCopyHistory';
const LOCALE_STORAGE_KEY = 'quickPassGenLocale';
const HISTORY_LIMIT = 10;
const SAVE_CONFIG_DELAY = 250;
const LOCALES = ['zh-CN', 'en'];
const I18N = {
  'zh-CN': {
    appTitle: '快密生成器',
    switchLanguage: 'English',
    switchLanguageAria: 'Switch language to English',
    settingsLabel: '密码设置',
    lengthLabel: '密码长度',
    lengthValueAria: '密码长度数值',
    uppercase: '大写字母',
    lowercase: '小写字母',
    numbers: '数字',
    symbols: '特殊符号',
    excludeAmbiguous: '排除易混淆字符',
    resultLabel: '生成结果',
    passwordLabel: '生成的密码',
    generate: '重新生成',
    copy: '复制密码',
    historyLabel: '使用历史记录',
    historyTitle: '使用历史',
    clearHistory: '清空',
    historyEmpty: '暂无使用记录',
    keepOneType: '请至少保留一种字符类型',
    copied: '已复制到剪贴板',
    missingFillPage: '未找到可填充的页面',
    autofillFailed: '自动填充失败',
    autofillSuccess: '已自动填充到页面',
    autofillAccessFailed: '自动填充失败，请确认当前页面允许扩展访问',
    fillAction: '自动填充',
    copyAction: '复制',
    unknownFillSite: '填充网站未知',
    unknownTime: '使用时间未知',
    historyCleared: '使用历史已清空',
  },
  en: {
    appTitle: 'Quick Pass Gen',
    switchLanguage: '中文',
    switchLanguageAria: '切换语言为中文',
    settingsLabel: 'Password settings',
    lengthLabel: 'Password length',
    lengthValueAria: 'Password length value',
    uppercase: 'Uppercase letters',
    lowercase: 'Lowercase letters',
    numbers: 'Numbers',
    symbols: 'Symbols',
    excludeAmbiguous: 'Exclude ambiguous characters',
    resultLabel: 'Generated result',
    passwordLabel: 'Generated password',
    generate: 'Regenerate',
    copy: 'Copy password',
    historyLabel: 'Usage history',
    historyTitle: 'Usage history',
    clearHistory: 'Clear',
    historyEmpty: 'No usage history yet',
    keepOneType: 'Keep at least one character type enabled',
    copied: 'Copied to clipboard',
    missingFillPage: 'No fillable page found',
    autofillFailed: 'Autofill failed',
    autofillSuccess: 'Autofilled on the page',
    autofillAccessFailed: 'Autofill failed. Make sure this page allows extension access.',
    fillAction: 'Autofill',
    copyAction: 'Copy',
    unknownFillSite: 'Autofill site unknown',
    unknownTime: 'Usage time unknown',
    historyCleared: 'Usage history cleared',
  },
};
let currentConfig = { ...DEFAULT_CONFIG };
let currentLocale = getBrowserLocale();
let saveConfigTimer;
let hasUserEditedConfig = false;
let copyHistory = [];

init();

function init() {
  renderConfig(currentConfig);
  applyLocale(currentLocale);
  bindEvents();
  refreshPassword();
  loadStoredLocaleAfterFirstPaint();
  loadStoredConfigAfterFirstPaint();
  loadStoredHistoryAfterFirstPaint();
}

function bindEvents() {
  fields.languageToggle.addEventListener('click', toggleLanguage);
  fields.length.addEventListener('input', handleRangeLengthInput);
  fields.lengthValue.addEventListener('input', handleNumberLengthInput);
  fields.lengthValue.addEventListener('change', handleNumberLengthCommit);
  fields.lengthValue.addEventListener('blur', handleNumberLengthCommit);
  ['uppercase', 'lowercase', 'numbers', 'symbols', 'excludeAmbiguous'].forEach((name) => {
    fields[name].addEventListener('input', handleConfigChange);
  });
  fields.generate.addEventListener('click', handleGenerateClick);
  fields.copy.addEventListener('click', copyPassword);
  fields.fill?.addEventListener('click', fillPassword);
  fields.clearHistory.addEventListener('click', clearCopyHistory);
  fields.password.addEventListener('focus', () => fields.password.select());
}

function t(key) {
  return I18N[currentLocale][key];
}

function getBrowserLocale() {
  const browserLanguage = navigator.language || navigator.languages?.[0] || 'zh-CN';
  return browserLanguage.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en';
}

function normalizeLocale(locale) {
  return LOCALES.includes(locale) ? locale : getBrowserLocale();
}

function applyLocale(locale) {
  currentLocale = normalizeLocale(locale);
  document.documentElement.lang = currentLocale;
  document.title = t('appTitle');
  fields.app.setAttribute('aria-label', t('appTitle'));
  fields.title.textContent = t('appTitle');
  fields.languageToggle.textContent = t('switchLanguage');
  fields.languageToggle.setAttribute('aria-label', t('switchLanguageAria'));
  fields.settings.setAttribute('aria-label', t('settingsLabel'));
  fields.lengthLabel.textContent = t('lengthLabel');
  fields.lengthValue.setAttribute('aria-label', t('lengthValueAria'));
  fields.uppercaseText.textContent = t('uppercase');
  fields.lowercaseText.textContent = t('lowercase');
  fields.numbersText.textContent = t('numbers');
  fields.symbolsText.textContent = t('symbols');
  fields.excludeAmbiguousText.textContent = t('excludeAmbiguous');
  fields.result.setAttribute('aria-label', t('resultLabel'));
  fields.passwordLabel.textContent = t('passwordLabel');
  fields.generate.textContent = t('generate');
  fields.copy.textContent = t('copy');
  fields.history.setAttribute('aria-label', t('historyLabel'));
  fields.historyTitle.textContent = t('historyTitle');
  fields.clearHistory.textContent = t('clearHistory');
  fields.historyEmpty.textContent = t('historyEmpty');
  renderCopyHistory();
}

async function toggleLanguage() {
  const nextLocale = currentLocale === 'zh-CN' ? 'en' : 'zh-CN';
  applyLocale(nextLocale);
  await saveLocale(nextLocale);
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
    showMessage(t('keepOneType'));
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
  await addHistoryItem(password, 'copy');
  showMessage(t('copied'));
}

async function fillPassword() {
  const password = fields.password.value;
  if (!password) return;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      showMessage(t('missingFillPage'));
      return;
    }

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content-fill.js'],
    });

    const [{ result: fillResult } = {}] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: (value) => fillQuickPassGenPassword(value),
      args: [password],
    });

    if (!fillResult?.success) {
      showMessage(fillResult?.message ?? t('autofillFailed'));
      return;
    }

    await addHistoryItem(password, 'fill', getHistorySite(tab.url));
    showMessage(t('autofillSuccess'));
  } catch (error) {
    console.error('Failed to autofill quick-pass-gen password:', error);
    showMessage(t('autofillAccessFailed'));
  }
}

function renderCopyHistory() {
  fields.copyHistory.replaceChildren(
    ...copyHistory.map((item) => {
      const historyItem = document.createElement('li');
      const value = document.createElement('span');
      const details = document.createElement('div');
      const meta = document.createElement('div');
      const action = document.createElement('span');
      const time = document.createElement('time');
      const site = document.createElement('span');

      value.className = 'history-value';
      value.textContent = item.value;
      details.className = 'history-details';
      meta.className = 'history-meta';
      action.className = `history-action history-action-${item.action}`;
      action.textContent = formatHistoryAction(item.action);
      time.className = 'history-time';
      time.dateTime = item.copiedAt;
      time.textContent = formatHistoryTime(item.copiedAt);
      site.className = 'history-site';
      site.textContent = formatHistorySite(item);
      site.title = item.site || '';

      meta.append(action, time);
      details.append(value);
      if (site.textContent) {
        details.append(site);
      }
      historyItem.append(meta, details);
      return historyItem;
    }),
  );
}


function getHistorySite(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

function formatHistoryAction(action) {
  return action === 'fill' ? t('fillAction') : t('copyAction');
}

function formatHistorySite(item) {
  if (item.action !== 'fill') return '';
  return item.site || t('unknownFillSite');
}

function formatHistoryTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return t('unknownTime');
  return date.toLocaleString(currentLocale, {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function addHistoryItem(value, action = 'copy', site = '') {
  copyHistory = [
    { value, action, site, copiedAt: new Date().toISOString() },
    ...copyHistory,
  ].slice(0, HISTORY_LIMIT);

  renderCopyHistory();
  await saveCopyHistory(copyHistory);
}

async function clearCopyHistory() {
  copyHistory = [];
  renderCopyHistory();
  await saveCopyHistory(copyHistory);
  showMessage(t('historyCleared'));
}

function loadStoredLocaleAfterFirstPaint() {
  requestAfterFirstPaint(async () => {
    applyLocale(await loadLocale());
  });
}

async function loadLocale() {
  if (!globalThis.chrome?.storage?.local) return getBrowserLocale();
  const result = await chrome.storage.local.get(LOCALE_STORAGE_KEY);
  return normalizeLocale(result[LOCALE_STORAGE_KEY]);
}

async function saveLocale(locale) {
  if (!globalThis.chrome?.storage?.local) return;
  await chrome.storage.local.set({ [LOCALE_STORAGE_KEY]: normalizeLocale(locale) });
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
    .map((item) => ({
      value: item.value,
      copiedAt: item.copiedAt,
      action: item.action === 'fill' ? 'fill' : 'copy',
      site: typeof item.site === 'string' ? item.site.trim() : '',
    }))
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
        console.error('Failed to load quick-pass-gen data:', error);
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

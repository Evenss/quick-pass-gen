(() => {
  if (globalThis.quickPassGenContentReady) return;
  globalThis.quickPassGenContentReady = true;

  const FILLABLE_SELECTOR = 'input:not([type]), input[type="password"], input[type="text"], input[type="email"], input[type="search"], input[type="url"], input[type="tel"], textarea, [contenteditable="true"]';
  const PASSWORD_FIELD_SELECTOR = 'input[type="password"]';
  const STORAGE_KEY = 'quickPassGenConfig';
  const HISTORY_STORAGE_KEY = 'quickPassGenCopyHistory';
  const LOCALE_STORAGE_KEY = 'quickPassGenLocale';
  const HISTORY_LIMIT = 10;
  const LOCALES = ['zh-CN', 'en'];
  const I18N = {
    'zh-CN': {
      inlineFill: '快密填充',
      inlineFilled: '已填充',
      noFillableInput: '未找到可填充的输入框',
    },
    en: {
      inlineFill: 'Fill pass',
      inlineFilled: 'Filled',
      noFillableInput: 'No fillable input found',
    },
  };
  const DEFAULT_CONFIG = {
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    excludeAmbiguous: false,
  };
  const PASSWORD_LIMITS = { min: 8, max: 32 };
  const CHARSETS = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()-_=+[]{};:,.<>?',
  };
  const AMBIGUOUS_CHARS = new Set('O0oIl1|`\'"{}[]()/\\');

  let activeTarget = null;
  let currentLocale = getBrowserLocale();
  let hideTimer;

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
    const panel = document.querySelector('#quick-pass-gen-inline-panel');
    if (panel?.dataset.state !== 'filled') {
      panel.textContent = t('inlineFill');
    }
  }

  async function loadLocale() {
    if (!globalThis.chrome?.storage?.local) return getBrowserLocale();
    const result = await chrome.storage.local.get(LOCALE_STORAGE_KEY);
    return normalizeLocale(result[LOCALE_STORAGE_KEY]);
  }

  function watchLocaleChanges() {
    globalThis.chrome?.storage?.onChanged?.addListener((changes, areaName) => {
      if (areaName !== 'local' || !(LOCALE_STORAGE_KEY in changes)) return;
      applyLocale(changes[LOCALE_STORAGE_KEY].newValue);
    });
  }

  function isVisible(element) {
    const style = globalThis.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0;
  }

  function isFillable(element) {
    if (!(element instanceof HTMLElement)) return false;
    if (element.matches('[contenteditable="true"]')) return isVisible(element);
    if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)) return false;
    return !element.disabled && !element.readOnly && element.matches(FILLABLE_SELECTOR) && isVisible(element);
  }

  function findTargetField() {
    const activeElement = document.activeElement;
    if (isFillable(activeElement)) return activeElement;

    const passwordField = [...document.querySelectorAll(PASSWORD_FIELD_SELECTOR)].find(isFillable);
    if (passwordField) return passwordField;

    return [...document.querySelectorAll(FILLABLE_SELECTOR)].find(isFillable) ?? null;
  }

  function dispatchInputEvents(element) {
    element.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function fillElement(element, value) {
    element.focus();

    if (element.matches('[contenteditable="true"]')) {
      element.textContent = value;
    } else {
      element.value = value;
      element.setSelectionRange?.(value.length, value.length);
    }

    dispatchInputEvents(element);
  }

  function fillQuickPassGenPassword(value) {
    const target = findTargetField();
    if (!target) {
      return { success: false, message: t('noFillableInput') };
    }

    fillElement(target, value);
    return { success: true };
  }

  function clampLength(value) {
    const length = Number.parseInt(value, 10);
    if (Number.isNaN(length)) return DEFAULT_CONFIG.length;
    return Math.min(PASSWORD_LIMITS.max, Math.max(PASSWORD_LIMITS.min, length));
  }

  function normalizeConfig(config = {}) {
    const normalized = {
      length: clampLength(config.length),
      uppercase: config.uppercase !== false,
      lowercase: config.lowercase !== false,
      numbers: config.numbers !== false,
      symbols: config.symbols !== false,
      excludeAmbiguous: config.excludeAmbiguous === true,
    };

    if (!normalized.uppercase && !normalized.lowercase && !normalized.numbers && !normalized.symbols) {
      normalized.lowercase = true;
    }

    return normalized;
  }

  function removeAmbiguousCharacters(charset) {
    return [...charset].filter((char) => !AMBIGUOUS_CHARS.has(char)).join('');
  }

  function buildCharacterSets(config) {
    return Object.entries(CHARSETS)
      .filter(([key]) => config[key])
      .map(([key, value]) => ({ key, value: config.excludeAmbiguous ? removeAmbiguousCharacters(value) : value }))
      .filter(({ value }) => value.length > 0);
  }

  function randomIndex(max) {
    const randomValues = new Uint32Array(1);
    globalThis.crypto.getRandomValues(randomValues);
    return randomValues[0] % max;
  }

  function randomChar(charset) {
    return charset[randomIndex(charset.length)];
  }

  function shuffle(values) {
    const result = [...values];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swapIndex = randomIndex(index + 1);
      [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
  }

  async function loadConfig() {
    if (!globalThis.chrome?.storage?.local) return { ...DEFAULT_CONFIG };
    const result = await chrome.storage.local.get(STORAGE_KEY);
    return normalizeConfig(result[STORAGE_KEY] ?? DEFAULT_CONFIG);
  }

  function generatePassword(config) {
    const normalized = normalizeConfig(config);
    const sets = buildCharacterSets(normalized);
    const requiredChars = sets.map(({ value }) => randomChar(value));
    const combined = sets.map(({ value }) => value).join('');
    const remainingLength = Math.max(0, normalized.length - requiredChars.length);
    const remainingChars = Array.from({ length: remainingLength }, () => randomChar(combined));
    return shuffle([...requiredChars, ...remainingChars]).join('');
  }

  async function saveHistory(value) {
    if (!globalThis.chrome?.storage?.local) return;
    const result = await chrome.storage.local.get(HISTORY_STORAGE_KEY);
    const history = Array.isArray(result[HISTORY_STORAGE_KEY]) ? result[HISTORY_STORAGE_KEY] : [];
    const nextHistory = [
      { value, action: 'fill', url: globalThis.location.href, copiedAt: new Date().toISOString() },
      ...history,
    ].slice(0, HISTORY_LIMIT);
    await chrome.storage.local.set({ [HISTORY_STORAGE_KEY]: nextHistory });
  }

  function ensurePanel() {
    let panel = document.querySelector('#quick-pass-gen-inline-panel');
    if (panel) return panel;

    panel = document.createElement('button');
    panel.id = 'quick-pass-gen-inline-panel';
    panel.type = 'button';
    panel.textContent = t('inlineFill');
    panel.style.cssText = 'position:fixed;z-index:2147483647;display:none;padding:7px 10px;border:1px solid #fff;border-radius:999px;background:#050505;color:#fff;font:700 12px system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 6px 18px rgba(0,0,0,.28);cursor:pointer;';
    panel.addEventListener('mousedown', (event) => event.preventDefault());
    panel.addEventListener('click', handleInlineFillClick);
    document.documentElement.append(panel);
    return panel;
  }

  function positionPanel(target) {
    const panel = ensurePanel();
    const rect = target.getBoundingClientRect();
    panel.style.left = `${Math.min(globalThis.innerWidth - 90, Math.max(8, rect.right - 84))}px`;
    panel.style.top = `${Math.min(globalThis.innerHeight - 36, Math.max(8, rect.top - 34))}px`;
    panel.style.display = 'block';
  }

  function hidePanelSoon() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      const panel = ensurePanel();
      panel.style.display = 'none';
    }, 180);
  }

  function showPanelForTarget(target) {
    clearTimeout(hideTimer);
    activeTarget = target;
    positionPanel(target);
  }

  async function handleInlineFillClick() {
    const target = isFillable(activeTarget) ? activeTarget : findTargetField();
    if (!target) return;
    const password = generatePassword(await loadConfig());
    fillElement(target, password);
    await saveHistory(password);
    const panel = ensurePanel();
    panel.dataset.state = 'filled';
    panel.textContent = t('inlineFilled');
    setTimeout(() => {
      const resetPanel = ensurePanel();
      delete resetPanel.dataset.state;
      resetPanel.textContent = t('inlineFill');
      resetPanel.style.display = 'none';
    }, 700);
  }

  loadLocale().then(applyLocale);
  watchLocaleChanges();

  document.addEventListener('focusin', (event) => {
    if (event.target instanceof HTMLElement && event.target.matches(PASSWORD_FIELD_SELECTOR) && isFillable(event.target)) {
      showPanelForTarget(event.target);
    }
  });

  document.addEventListener('focusout', hidePanelSoon);
  globalThis.addEventListener('scroll', () => activeTarget && positionPanel(activeTarget), true);
  globalThis.addEventListener('resize', () => activeTarget && positionPanel(activeTarget));

  globalThis.fillQuickPassGenPassword = fillQuickPassGenPassword;
})();

(() => {
  const FILLABLE_SELECTOR = 'input:not([type]), input[type="password"], input[type="text"], input[type="email"], input[type="search"], input[type="url"], input[type="tel"], textarea, [contenteditable="true"]';

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

    const passwordField = [...document.querySelectorAll('input[type="password"]')].find(isFillable);
    if (passwordField) return passwordField;

    return [...document.querySelectorAll(FILLABLE_SELECTOR)].find(isFillable) ?? null;
  }

  function dispatchInputEvents(element) {
    element.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText' }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  function fillQuickPassGenPassword(value) {
    const target = findTargetField();
    if (!target) {
      return { success: false, message: '未找到可填充的输入框' };
    }

    target.focus();

    if (target.matches('[contenteditable="true"]')) {
      target.textContent = value;
    } else {
      target.value = value;
      target.setSelectionRange?.(value.length, value.length);
    }

    dispatchInputEvents(target);
    return { success: true };
  }

  globalThis.fillQuickPassGenPassword = fillQuickPassGenPassword;
})();

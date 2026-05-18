export function sanitizeText(value, maxLength = 500) {
  const safeMaxLength = Number.isFinite(Number(maxLength))
    ? Math.max(0, Number(maxLength))
    : 500;

  return String(value ?? '')
    .replace(/[\u0000-\u001F\u007F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, safeMaxLength);
}

export function normalizePhone(value) {
  return String(value ?? '')
    .replace(/\D/g, '')
    .slice(0, 10);
}

export function isValidEmail(email) {
  const normalizedEmail = sanitizeText(email, 120).toLowerCase();

  if (!normalizedEmail) return false;

  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(normalizedEmail);
}

export function scrollToSelector(selector) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }

  if (!selector || typeof selector !== 'string') {
    return false;
  }

  try {
    const element = document.querySelector(selector);

    if (!element) {
      return false;
    }

    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });

    return true;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Invalid selector passed to scrollToSelector:', selector, error);
    }

    return false;
  }
}
const REMEMBERED_NAMES_KEY = "vsr-remembered-account-names-v1";
const LAST_ACCOUNT_EMAIL_KEY = "vsr-last-account-email-v1";

function normalizeEmail(email) {
  return typeof email === "string" ? email.trim().toLowerCase() : "";
}

function readRememberedNames() {
  try {
    const value = JSON.parse(window.sessionStorage.getItem(REMEMBERED_NAMES_KEY) || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch {
    return {};
  }
}

export function getRememberedAccountName(email) {
  const normalizedEmail = normalizeEmail(email);
  return normalizedEmail ? readRememberedNames()[normalizedEmail] || "" : "";
}

export function getLastRememberedAccountEmail() {
  try {
    return normalizeEmail(window.sessionStorage.getItem(LAST_ACCOUNT_EMAIL_KEY));
  } catch {
    return "";
  }
}

export function rememberAccountName(email, name) {
  const normalizedEmail = normalizeEmail(email);
  const trimmedName = typeof name === "string" ? name.trim() : "";
  if (!normalizedEmail || !trimmedName) return;

  try {
    const rememberedNames = readRememberedNames();
    rememberedNames[normalizedEmail] = trimmedName;
    window.sessionStorage.setItem(REMEMBERED_NAMES_KEY, JSON.stringify(rememberedNames));
    window.sessionStorage.setItem(LAST_ACCOUNT_EMAIL_KEY, normalizedEmail);
  } catch {
    // Personalize the sign-in screen only when this browser session allows storage.
  }
}

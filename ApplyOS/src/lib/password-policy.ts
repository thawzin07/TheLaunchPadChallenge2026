export const PASSWORD_POLICY_HINT = "Use 10+ characters with uppercase, lowercase, and a number or symbol.";

const COMMON_PASSWORDS = new Set([
  "12345678",
  "123456789",
  "1234567890",
  "password",
  "password1",
  "password12",
  "password123",
  "qwerty123",
  "admin123",
  "letmein123",
  "welcome123",
  "applyos123",
  "applyos2026",
]);

function containsPersonalInfo(password: string, value?: string) {
  if (!value) return false;

  const normalizedPassword = password.toLowerCase();
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((part) => part.length >= 4)
    .some((part) => normalizedPassword.includes(part));
}

export function getPasswordPolicyError(
  password: string,
  context: {
    email?: string;
    name?: string;
  } = {},
) {
  if (password.length < 10) {
    return "Use at least 10 characters.";
  }

  if (password.length > 128) {
    return "Use 128 characters or fewer.";
  }

  if (password.trim() !== password) {
    return "Remove spaces from the start or end of the password.";
  }

  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    return "Use a less common password.";
  }

  if (/(.)\1{4,}/.test(password)) {
    return "Avoid repeating the same character many times.";
  }

  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasNumberOrSymbol = /[\d\W_]/.test(password);

  if (!hasLowercase || !hasUppercase || !hasNumberOrSymbol) {
    return "Use uppercase, lowercase, and a number or symbol.";
  }

  const emailLocalPart = context.email?.split("@")[0];
  if (containsPersonalInfo(password, emailLocalPart) || containsPersonalInfo(password, context.name)) {
    return "Avoid using your name or email in the password.";
  }

  return null;
}

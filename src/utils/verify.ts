export const EmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const PasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export function isEmail(str: string) {
  return EmailRegex.test(str);
}

export function isStrongPassword(str: string) {
  return PasswordRegex.test(str);
}


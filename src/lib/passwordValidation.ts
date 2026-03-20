/**
 * Password validation rules for account security.
 * Used by both Signup and Change Password flows.
 */

export function validatePassword(password: string): string | null {
  if (password.length < 10) {
    return 'Password must be at least 10 characters';
  }
  if (!/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }
  if (!/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return 'Password must contain at least one special character';
  }
  return null; // valid
}

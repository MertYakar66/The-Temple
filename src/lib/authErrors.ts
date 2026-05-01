/**
 * Maps Firebase Auth error codes to user-friendly messages.
 * Avoids revealing account existence for security.
 */
export function getAuthErrorMessage(code: string | undefined): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'Invalid email address';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Invalid email or password';
    case 'auth/email-already-in-use':
      return 'Unable to create account. Please try a different email or sign in.';
    case 'auth/weak-password':
      return 'Password is too weak';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed. Please try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/requires-recent-login':
      return 'Please sign out and sign in again before retrying.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

/** Extract a Firebase error code from an unknown error */
export function getFirebaseErrorCode(err: unknown): string | undefined {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    return (err as { code: string }).code;
  }
  return undefined;
}

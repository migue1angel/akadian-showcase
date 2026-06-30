import { DomainError } from "../../../shared/errors/domain.error";

export class AuthError extends DomainError {
  static InvalidCredentials() {
    return new AuthError('Invalid credentials', 'INVALID_CREDENTIALS', 401);
  }

  static InvalidToken() {
    return new AuthError('Invalid token', 'INVALID_TOKEN', 401);
  }

  static NoTokenProvided() {
    return new AuthError('No token provided', 'MISSING_TOKEN', 401);
  }

  static TokenExpired() {
    return new AuthError('Token expired', 'TOKEN_EXPIRED', 401);
  }

  static AccountLocked() {
    return new AuthError('Too many login attempts. Please wait before trying again.', 'ACCOUNT_LOCKED', 429);
  }
}

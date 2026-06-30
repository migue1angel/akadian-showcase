import { User } from '@core/models/user.model';

export interface AuthResponse {
  user: User;
}

export interface LoginResponse {
  requires2FA?: boolean;
  tempToken?: string;
  message?: string;
}

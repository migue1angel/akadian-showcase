import { DomainError } from "../../../shared/errors/domain.error";

export class UserError extends DomainError {
  static Inactive() {
    return new UserError('User is inactive or suspended', 'USER_INACTIVE', 403);
  }
  static Deleted() {
    return new UserError('User account has been deleted', 'USER_DELETED', 410);
  }
  static AlreadyExists() {
    return new UserError('User already exists', 'USER_ALREADY_EXISTS', 409);
  }
  static RoleNotFound() {
    return new UserError('Role not found', 'ROLE_NOT_FOUND', 404);
  }
  static UserNotFound() {
    return new UserError('User not found', 'USER_NOT_FOUND', 404);
  }

  static InvalidCurrentPassword() {
    return new UserError('Current password is invalid', 'INVALID_CURRENT_PASSWORD', 400);
  }
}

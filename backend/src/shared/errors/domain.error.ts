export abstract class DomainError extends Error {
  constructor(public readonly message: string, public readonly code: string, public readonly status: number = 400) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

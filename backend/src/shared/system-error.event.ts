export class SystemErrorEvent {
  constructor(
    public readonly message: string,
    public readonly stackTrace?: string,
    public readonly contextData?: any,
    public readonly timestamp: Date = new Date(),
  ) {}
}
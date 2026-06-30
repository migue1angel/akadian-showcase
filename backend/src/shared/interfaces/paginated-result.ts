export class PaginatedResult<T> {
  constructor(
    public readonly data: T[],
    public readonly total: number,
    public readonly page: number,
    public readonly limit: number,
  ) {}

  get meta() {
    return {
      total: this.total,
      page: this.page,
      limit: this.limit,
      totalPages: Math.ceil(this.total / this.limit),
    };
  }
}
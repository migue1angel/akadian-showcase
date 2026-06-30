export interface Pagination {
  pages: number;
  count: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}
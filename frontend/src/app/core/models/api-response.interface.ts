import { Pagination } from './pagination.interface';

export interface ApiResponse<T> {
  data: T;
  pagination?: Pagination;
  error?: string;
  message: string;
  status?: number;
}

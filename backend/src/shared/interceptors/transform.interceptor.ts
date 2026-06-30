import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { map, Observable } from "rxjs";
import { PaginatedResult } from "../interfaces/paginated-result";

export interface StandardResponse<T> {
    success: boolean;
    data: T;
    meta?: any;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, StandardResponse<T>> {
    intercept(context: ExecutionContext, next: CallHandler<T>): Observable<StandardResponse<T>> | Promise<Observable<StandardResponse<T>>> {
        return next.handle().pipe(
            map(result => {
                if (result instanceof PaginatedResult) {
                    return {
                        success: true,
                        data: result.data as unknown as T,
                        meta: result.meta
                    };
                }

                return {
                    success: true,
                    data: (result ?? null) as T
                }
            })
        )
    }
}
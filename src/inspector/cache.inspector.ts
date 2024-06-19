import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Observable, of, tap } from "rxjs";
import { CACHE_TTL_KEY } from "src/decarotors/cache.decorator";
import { CacheService } from "src/services/cache.service";

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(
    private readonly cacheService: CacheService,
    private readonly reflector: Reflector,
  ) { }

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;

    if (method !== 'GET') {
      return next.handle();
    }

    const cacheKey = this.generateCacheKey(request);
    const cachedResponse = await this.cacheService.get(cacheKey);

    if (cachedResponse) {
      return of(cachedResponse);
    }

    const ttl = this.reflector.get<number>(CACHE_TTL_KEY, context.getHandler()) || 30;

    return next.handle().pipe(
      tap((data) => {
        this.cacheService.set(cacheKey, data, ttl);
      }),
    );
  }

  private generateCacheKey(request: Request): string {
    return request.url;
  }
}
import { SetMetadata } from '@nestjs/common';

export const CACHE_TTL_KEY = 'cacheTTL';
export const CacheTTL = (ttl: number) => SetMetadata(CACHE_TTL_KEY, ttl);
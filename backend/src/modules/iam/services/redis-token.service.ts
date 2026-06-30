import { Inject, Injectable } from '@nestjs/common';
import { createHash } from 'crypto';
import Redis from 'ioredis';
import { REDIS_CLIENT, RedisTTL } from 'src/shared/consts/redis';

@Injectable()
export class RedisTokenService {
  constructor(
    @Inject(REDIS_CLIENT)
    private readonly redisClient: Redis,
  ) {}

  async storeRefreshToken(userId: string, token: string): Promise<void> {
    await this.redisClient.set(
      this.getRefreshTokenKey(userId),
      this.hashToken(token),
      'EX',
      RedisTTL.SEVEN_DAYS,
    );
  }

  async validateRefreshToken(userId: string, token: string): Promise<boolean> {
    const storedHash = await this.redisClient.get(this.getRefreshTokenKey(userId));

    if (!storedHash) {
      return false;
    }

    return storedHash === this.hashToken(token);
  }

  async invalidateRefreshToken(userId: string): Promise<void> {
    await this.redisClient.del(this.getRefreshTokenKey(userId));
  }

  async isLoginLocked(email: string): Promise<boolean> {
    return (await this.redisClient.exists(this.getLoginLockKey(email))) === 1;
  }

  async incrementLoginFailures(email: string): Promise<number> {
    const key = this.getLoginFailuresKey(email);
    const failures = await this.redisClient.incr(key);

    if (failures === 1) {
      await this.redisClient.expire(key, RedisTTL.FIFTEEN_MINUTES);
    }

    if (failures >= 5) {
      await this.redisClient.set(this.getLoginLockKey(email), '1', 'EX', RedisTTL.FIFTEEN_MINUTES);
    }

    return failures;
  }

  async resetLoginFailures(email: string): Promise<void> {
    await this.redisClient.del(this.getLoginFailuresKey(email));
    await this.redisClient.del(this.getLoginLockKey(email));
  }

  private getRefreshTokenKey(userId: string): string {
    return `auth:refresh_token:${userId}`;
  }

  private getLoginFailuresKey(email: string): string {
    return `auth:login_failures:${email.toLowerCase()}`;
  }

  private getLoginLockKey(email: string): string {
    return `auth:login_lock:${email.toLowerCase()}`;
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}

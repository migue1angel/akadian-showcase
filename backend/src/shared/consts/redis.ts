export const REDIS_CLIENT = 'REDIS_CLIENT';
export enum RedisTTL {
    SEVEN_DAYS = 7 * 24 * 60 * 60,
    ONE_DAY = 24 * 60 * 60,
    ONE_HOUR = 60 * 60,
    ONE_MINUTE = 60,
    FIFTEEN_MINUTES = 15 * 60,
}
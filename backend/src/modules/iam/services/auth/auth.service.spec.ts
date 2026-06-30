// Set environment variables BEFORE any imports — envs.ts runs Joi validation at import time
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
process.env.NODE_ENV = 'test';
process.env.FRONTEND_URL = 'http://localhost:3000';
process.env.PORT = '3000';
process.env.DATABASE_PORT = '5432';
process.env.DATABASE_HOST = 'localhost';
process.env.DATABASE_PASSWORD = 'password';
process.env.DATABASE_NAME = 'test';
process.env.DATABASE_USER = 'user';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.REDIS_TTL = '3600';
process.env.STRIPE_SECRET_KEY = 'sk_test_...';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_...';
process.env.STRIPE_PRICE_ID = 'price_...';
process.env.STRIPE_CHECKOUT_SUCCESS_URL = 'http://localhost:3000/success';
process.env.STRIPE_CHECKOUT_CANCEL_URL = 'http://localhost:3000/cancel';
process.env.DISCORD_WEBHOOK_URL = 'http://discord.webhook';
process.env.ADMIN_EMAIL = 'admin@test.com';
process.env.ADMIN_PASSWORD = 'password';

import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users.service';
import { JwtService } from '@nestjs/jwt';
import { RedisTokenService } from '../redis-token.service';
import { UserError } from '../../errors/user.errors';
import { LoginDto } from '../../dto/login.dto';
import { Response } from 'express';

describe('AuthService', () => {
  let service: AuthService;
  let mockUsersService: jest.Mocked<Partial<UsersService>>;
  let mockJwtService: jest.Mocked<Partial<JwtService>>;
  let mockRedisTokenService: jest.Mocked<Partial<RedisTokenService>>;
  let mockResponse: Response;

  const dto: LoginDto = { email: 'test@example.com', password: 'test123' };
  const userId = 'user-id-1';

  const safeUser = {
    id: userId,
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    isActive: true,
    emailVerified: true,
    roles: ['user'],
  };

  const mockUser = {
    id: userId,
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    isActive: true,
    emailVerified: true,
    passwordHash: 'hashed-password',
    roles: [{ name: 'user' }],
    deletedAt: null,
    verifyIsActive: jest.fn(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPayload = { sub: userId, email: 'test@example.com', roles: ['user'] };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockUsersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      validatePassword: jest.fn(),
      toSafeUser: jest.fn(),
    } as unknown as jest.Mocked<Partial<UsersService>>;

    mockJwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    } as unknown as jest.Mocked<Partial<JwtService>>;

    mockRedisTokenService = {
      isLoginLocked: jest.fn(),
      incrementLoginFailures: jest.fn(),
      resetLoginFailures: jest.fn(),
      storeRefreshToken: jest.fn(),
      validateRefreshToken: jest.fn(),
      invalidateRefreshToken: jest.fn(),
    } as unknown as jest.Mocked<Partial<RedisTokenService>>;

    mockResponse = {
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    } as unknown as Response;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: RedisTokenService, useValue: mockRedisTokenService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('login()', () => {
    it('should throw AccountLocked when the account is locked by Redis', async () => {
      mockRedisTokenService.isLoginLocked = jest.fn().mockResolvedValue(true);

      await expect(service.login(dto, mockResponse)).rejects.toMatchObject({
        code: 'ACCOUNT_LOCKED',
        status: 429,
      });

      expect(mockUsersService.findByEmail).not.toHaveBeenCalled();
    });

    it('should throw InvalidCredentials and increment failures when user is not found', async () => {
      mockRedisTokenService.isLoginLocked = jest.fn().mockResolvedValue(false);
      mockUsersService.findByEmail = jest.fn().mockResolvedValue(null);

      await expect(service.login(dto, mockResponse)).rejects.toMatchObject({
        code: 'INVALID_CREDENTIALS',
        status: 401,
      });

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(mockRedisTokenService.incrementLoginFailures).toHaveBeenCalledWith(dto.email);
    });

    it('should propagate UserError when the user is inactive', async () => {
      const inactiveUser = {
        ...mockUser,
        isActive: false,
        verifyIsActive: jest.fn().mockImplementation(() => {
          throw UserError.Inactive();
        }),
      };

      mockRedisTokenService.isLoginLocked = jest.fn().mockResolvedValue(false);
      mockUsersService.findByEmail = jest.fn().mockResolvedValue(inactiveUser);

      await expect(service.login(dto, mockResponse)).rejects.toMatchObject({
        code: 'USER_INACTIVE',
        status: 403,
      });
    });

    it('should throw InvalidCredentials and increment failures when password is invalid', async () => {
      mockRedisTokenService.isLoginLocked = jest.fn().mockResolvedValue(false);
      mockUsersService.findByEmail = jest.fn().mockResolvedValue(mockUser);
      mockUsersService.validatePassword = jest.fn().mockResolvedValue(false);

      await expect(service.login(dto, mockResponse)).rejects.toMatchObject({
        code: 'INVALID_CREDENTIALS',
        status: 401,
      });

      expect(mockRedisTokenService.incrementLoginFailures).toHaveBeenCalledWith(dto.email);
    });

    it('should succeed, set cookies, store refresh token, and return safe user', async () => {
      mockRedisTokenService.isLoginLocked = jest.fn().mockResolvedValue(false);
      mockUsersService.findByEmail = jest.fn().mockResolvedValue(mockUser);
      mockUsersService.validatePassword = jest.fn().mockResolvedValue(true);
      mockUsersService.toSafeUser = jest.fn().mockReturnValue(safeUser);
      (mockJwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce('test-access-token')
        .mockResolvedValueOnce('test-refresh-token');

      const result = await service.login(dto, mockResponse);

      expect(mockRedisTokenService.resetLoginFailures).toHaveBeenCalledWith(dto.email);
      expect(mockRedisTokenService.storeRefreshToken).toHaveBeenCalledWith(userId, 'test-refresh-token');
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
      expect(mockResponse.cookie).toHaveBeenCalledWith('accessToken', 'test-access-token', expect.any(Object));
      expect(mockResponse.cookie).toHaveBeenCalledWith('refreshToken', 'test-refresh-token', expect.any(Object));
      expect(result).toEqual(safeUser);
    });
  });

  describe('refresh()', () => {
    it('should throw NoTokenProvided when refreshToken is empty', async () => {
      await expect(service.refresh('', mockResponse)).rejects.toMatchObject({
        code: 'MISSING_TOKEN',
        status: 401,
      });

      expect(mockJwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('should throw InvalidToken when JWT verification fails', async () => {
      (mockJwtService.verifyAsync as jest.Mock).mockRejectedValue(new Error('jwt error'));

      await expect(service.refresh('some-invalid-token', mockResponse)).rejects.toMatchObject({
        code: 'INVALID_TOKEN',
        status: 401,
      });
    });

    it('should throw InvalidToken when Redis token validation fails', async () => {
      (mockJwtService.verifyAsync as jest.Mock).mockResolvedValue(mockPayload);
      mockRedisTokenService.validateRefreshToken = jest.fn().mockResolvedValue(false);

      await expect(service.refresh('some-token', mockResponse)).rejects.toMatchObject({
        code: 'INVALID_TOKEN',
        status: 401,
      });
    });

    it('should succeed, set cookies, store refresh token, and return refreshed object', async () => {
      (mockJwtService.verifyAsync as jest.Mock).mockResolvedValue(mockPayload);
      mockRedisTokenService.validateRefreshToken = jest.fn().mockResolvedValue(true);
      mockUsersService.findById = jest.fn().mockResolvedValue(safeUser);
      (mockJwtService.signAsync as jest.Mock)
        .mockResolvedValueOnce('test-access-token')
        .mockResolvedValueOnce('test-refresh-token');

      const result = await service.refresh('valid-refresh-token', mockResponse);

      expect(mockRedisTokenService.storeRefreshToken).toHaveBeenCalledWith(userId, 'test-refresh-token');
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
      expect(mockResponse.cookie).toHaveBeenCalledWith('accessToken', 'test-access-token', expect.any(Object));
      expect(mockResponse.cookie).toHaveBeenCalledWith('refreshToken', 'test-refresh-token', expect.any(Object));
      expect(result).toEqual({ refreshed: true });
    });
  });

  describe('logout()', () => {
    it('should invalidate refresh token and clear auth cookies', async () => {
      await service.logout(userId, mockResponse);

      expect(mockRedisTokenService.invalidateRefreshToken).toHaveBeenCalledWith(userId);
      expect(mockResponse.clearCookie).toHaveBeenCalledTimes(2);
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('accessToken', expect.any(Object));
      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refreshToken', expect.any(Object));
    });
  });
});

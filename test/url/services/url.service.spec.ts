import { Test, TestingModule } from '@nestjs/testing';
import { UrlService } from '../../../src/url/services/url.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Url } from '../../../src/entities/url.entity';
import { EntityManager, MikroORM } from '@mikro-orm/core';
import { CreateUrlDto } from '../../../src/url/dto/create-url.dto';
import { User } from '../../../src/entities/user.entity';
import { UnauthorizedException } from '@nestjs/common';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

describe('UrlService', () => {
  let service: UrlService;
  let em: EntityManager;
  let module: TestingModule;
  let orm: MikroORM;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        MikroOrmModule.forRoot({
          driver: PostgreSqlDriver,
          clientUrl: `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/test_db`,
          entities: [Url, User],
          debug: false,
        }),
        MikroOrmModule.forFeature([Url]),
      ],
      providers: [UrlService],
    }).compile();

    service = module.get<UrlService>(UrlService);
    em = module.get<EntityManager>(EntityManager);
    orm = module.get<MikroORM>(MikroORM);
    const generator = orm.getSchemaGenerator();
    await generator.createSchema();
  });

  afterAll(async () => {
    await orm.close();
    await module.close();
  });

  beforeEach(async () => {
    await em.nativeDelete(Url, {});
  });

  describe('createShortUrl', () => {
    it('should create a short URL with random slug when no custom slug provided', async () => {
      const dto: CreateUrlDto = {
        originalUrl: 'https://example.com',
      };

      const result = await service.createShortUrl(dto);
      expect(result).toBeDefined();
      expect(result.slug).toHaveLength(8);
      expect(result.originalUrl).toBe(dto.originalUrl);
    });

    it('should create a short URL with custom slug when provided', async () => {
      const dto: CreateUrlDto = {
        originalUrl: 'https://example.com',
        customSlug: 'custom-slug',
      };

      const result = await service.createShortUrl(dto);
      expect(result.slug).toBe('custom-slug');
    });

    it('should append suffix when custom slug already exists', async () => {
      const existing = new Url('custom-slug', 'https://existing.com');
      await em.persistAndFlush(existing);

      const dto: CreateUrlDto = {
        originalUrl: 'https://example.com',
        customSlug: 'custom-slug',
      };

      const result = await service.createShortUrl(dto);
      expect(result.slug).toBe('custom-slug-1');
    });

    it('should associate URL with user when provided', async () => {
      const user = new User('test@example.com', 'Test User', 'password');
      await em.persistAndFlush(user);
    
      const dto: CreateUrlDto = {
        originalUrl: 'https://example.com',
      };
    
      const result = await service.createShortUrl(dto, user);
      
      expect(result.user).toBeDefined();
      expect(result.user?.id).toBe(user.id); // Optional chaining
      
      expect((result.user as User).id).toBe(user.id);
    });
  });

  describe('findBySlug', () => {
    it('should return URL when found', async () => {
      const url = new Url('test-slug', 'https://example.com');
      await em.persistAndFlush(url);

      const result = await service.findBySlug('test-slug');
      expect(result).toBeDefined();
      expect(result?.id).toBe(url.id);
    });

    it('should return null when not found', async () => {
      const result = await service.findBySlug('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('incrementClickCount', () => {
    it('should increment click count', async () => {
      const url = new Url('test-slug', 'https://example.com');
      await em.persistAndFlush(url);

      await service.incrementClickCount(url.id);
      await em.refresh(url);

      expect(url.clickCount).toBe(1);
    });
  });

  describe('deleteBySlug', () => {
    it('should delete URL when found', async () => {
      const url = new Url('test-slug', 'https://example.com');
      await em.persistAndFlush(url);

      const result = await service.deleteBySlug('test-slug');
      expect(result).toBe(true);

      const deleted = await service.findBySlug('test-slug');
      expect(deleted).toBeNull();
    });

    it('should return false when URL not found', async () => {
      const result = await service.deleteBySlug('non-existent');
      expect(result).toBe(false);
    });

    it('should throw when user tries to delete URL they dont own', async () => {
      const owner = new User('owner@example.com', 'Owner', 'password');
      const otherUser = new User('other@example.com', 'Other', 'password');
      await em.persistAndFlush([owner, otherUser]);

      const url = new Url('test-slug', 'https://example.com');
      url.user = owner;
      await em.persistAndFlush(url);

      await expect(service.deleteBySlug('test-slug', otherUser)).rejects.toThrow(UnauthorizedException);
    });
  });
});
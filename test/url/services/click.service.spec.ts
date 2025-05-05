import { Test, TestingModule } from '@nestjs/testing';
import { ClickService } from '../../../src/url/services/click.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { EntityManager, MikroORM } from '@mikro-orm/core';
import { Click } from 'src/entities/click.entity';
import { Url } from 'src/entities/url.entity';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

describe('ClickService', () => {
  let service: ClickService;
  let em: EntityManager;
  let module: TestingModule;
  let orm: MikroORM;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        MikroOrmModule.forRoot({
          driver: PostgreSqlDriver,
          clientUrl: `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/test_db`,
          entities: [Click, Url],
          debug: false,
        }),
        MikroOrmModule.forFeature([Click]),
      ],
      providers: [ClickService],
    }).compile();

    service = module.get<ClickService>(ClickService);
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
    await em.nativeDelete(Click, {});
    await em.nativeDelete(Url, {});
  });

  describe('trackClick', () => {
    it('should create a click record', async () => {
      const url = new Url('test-slug', 'https://example.com');
      await em.persistAndFlush(url);

      const click = await service.trackClick(url, '127.0.0.1', 'Test Agent', 'https://referrer.com');
      expect(click).toBeDefined();
      expect(click.url.id).toBe(url.id);
      expect(click.ipAddress).toBe('127.0.0.1');
    });
  });

  describe('getClickStats', () => {
    it('should return click stats for URL', async () => {
      const url = new Url('test-slug', 'https://example.com');
      await em.persistAndFlush(url);

      const click1 = new Click(url, '127.0.0.1', 'Agent 1');
      const click2 = new Click(url, '127.0.0.2', 'Agent 2');
      await em.persistAndFlush([click1, click2]);

      const stats = await service.getClickStats(url.id);
      expect(stats).toHaveLength(2);
      expect(stats[0].ip).toBe('127.0.0.2'); // Should be ordered by clickedAt DESC
    });
  });
});
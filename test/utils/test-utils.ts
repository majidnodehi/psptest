// test/utils/test-utils.ts
import { MikroORM } from '@mikro-orm/core';
import { Test, TestingModule } from '@nestjs/testing';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { UrlModule } from '../../src/url/url.module';
import { Url } from '../../src/entities/url.entity';
import { Click } from '../../src/entities/click.entity';
import { User } from '../../src/entities/user.entity';

export const createTestingModule = async () => {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [
      MikroOrmModule.forRoot({
        type: 'postgres',
        dbName: ':memory:',
        entities: [Url, Click, User],
        debug: false,
      }),
      UrlModule,
    ],
  }).compile();

  return moduleFixture;
};

export const initTestDatabase = async (module: TestingModule) => {
  const orm = module.get<MikroORM>(MikroORM);
  const generator = orm.getSchemaGenerator();
  await generator.createSchema();
  return orm;
};
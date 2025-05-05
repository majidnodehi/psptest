import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { UrlController } from '../../../src/url/controllers/url.controller';
import { UrlService } from '../../../src/url/services/url.service';
import { ClickService } from '../../../src/url/services/click.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Click } from '../../../src/entities/click.entity';
import { Url } from '../../../src/entities/url.entity';
import { User } from '../../../src/entities/user.entity';
import { EntityManager, MikroORM } from '@mikro-orm/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '../../../src/auth/jwt.strategy';
import { CreateUrlDto } from '../../../src/url/dto/create-url.dto';
import { PostgreSqlDriver } from '@mikro-orm/postgresql';

describe('UrlController (e2e)', () => {
    let app: INestApplication;
    let em: EntityManager;
    let orm: MikroORM;
    let jwtService: JwtService;
    let user: User;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                MikroOrmModule.forRoot({
                    driver: PostgreSqlDriver,
                    clientUrl: `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/test_db`,
                    entities: [Url, Click, User],
                    debug: false,
                }),
                MikroOrmModule.forFeature([Url, Click, User]),
                PassportModule,
                JwtModule.registerAsync({
                    imports: [ConfigModule],
                    useFactory: async () => ({
                        secret: 'test-secret',
                        signOptions: { expiresIn: '1h' },
                    }),
                    inject: [ConfigService],
                }),
                ConfigModule.forRoot(),
            ],
            controllers: [UrlController],
            providers: [
                UrlService,
                ClickService,
                JwtStrategy,
                ConfigService,
            ],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        em = moduleFixture.get<EntityManager>(EntityManager);
        orm = moduleFixture.get<MikroORM>(MikroORM);
        jwtService = moduleFixture.get<JwtService>(JwtService);

        const generator = orm.getSchemaGenerator();
        await generator.createSchema();

        // Create test user
        user = new User('test@example.com', 'Test User', 'password');
        await em.persistAndFlush(user);
    });

    afterAll(async () => {
        await orm.close();
        await app.close();
    });

    beforeEach(async () => {
        await em.nativeDelete(Click, {});
        await em.nativeDelete(Url, {});
    });

    const getAuthToken = () => {
        return jwtService.sign({ userId: user.id, email: user.email });
    };

    describe('POST /links', () => {
        it('should create short URL (authenticated)', async () => {
            const dto: CreateUrlDto = {
                originalUrl: 'https://example.com',
            };

            const response = await request(app.getHttpServer())
                .post('/links')
                .set('Authorization', `Bearer ${getAuthToken()}`)
                .send(dto)
                .expect(201);

            expect(response.body).toHaveProperty('slug');
            expect(response.body).toHaveProperty('shortUrl');
        });

        it('should reject invalid URLs', async () => {
            const dto: CreateUrlDto = {
                originalUrl: 'invalid-url',
            };

            await request(app.getHttpServer())
                .post('/links')
                .set('Authorization', `Bearer ${getAuthToken()}`)
                .send(dto)
                .expect(400);
        });

        it('should reject duplicate custom slugs', async () => {
            const url = new Url('custom-slug', 'https://existing.com');
            await em.persistAndFlush(url);

            const dto: CreateUrlDto = {
                originalUrl: 'https://example.com',
                customSlug: 'custom-slug',
            };

            await request(app.getHttpServer())
                .post('/links')
                .set('Authorization', `Bearer ${getAuthToken()}`)
                .send(dto)
                .expect(400);
        });
    });

    describe('GET /r/:slug', () => {
        it('should redirect to original URL', async () => {
            const url = new Url('test-slug', 'https://example.com');
            await em.persistAndFlush(url);

            await request(app.getHttpServer())
                .get('/r/test-slug')
                .expect(301)
                .expect('Location', 'https://example.com');
        });

        it('should return 404 for non-existent slug', async () => {
            await request(app.getHttpServer())
                .get('/r/non-existent')
                .expect(404);
        });
    });

    describe('GET /links/:slug/stats', () => {
        it('should return URL stats', async () => {
            const url = new Url('test-slug', 'https://example.com');
            await em.persistAndFlush(url);

            const click = new Click(url, '127.0.0.1', 'Test Agent');
            await em.persistAndFlush(click);

            const response = await request(app.getHttpServer())
                .get('/links/test-slug/stats')
                .expect(200);

            expect(response.body).toHaveProperty('totalClicks', 1);
            expect(response.body.detailedStats).toHaveLength(1);
        });

        it('should return 404 for non-existent slug', async () => {
            await request(app.getHttpServer())
                .get('/links/non-existent/stats')
                .expect(404);
        });
    });

    describe('DELETE /links/:slug', () => {
        it('should delete URL (owner)', async () => {
            const url = new Url('test-slug', 'https://example.com');
            url.user = user;
            await em.persistAndFlush(url);

            await request(app.getHttpServer())
                .delete('/links/test-slug')
                .set('Authorization', `Bearer ${getAuthToken()}`)
                .expect(200);
        });

        it('should prevent deletion by non-owner', async () => {
            const otherUser = new User('other@example.com', 'Other User', 'password');
            await em.persistAndFlush(otherUser);

            const url = new Url('test-slug', 'https://example.com');
            url.user = otherUser;
            await em.persistAndFlush(url);

            await request(app.getHttpServer())
                .delete('/links/test-slug')
                .set('Authorization', `Bearer ${getAuthToken()}`)
                .expect(401);
        });
    });
});
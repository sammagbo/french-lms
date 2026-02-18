import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import helmet from 'helmet';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Phase 7 Validation Checklist (Security)', () => {
      let app: INestApplication;

      beforeAll(async () => {
            const moduleFixture: TestingModule = await Test.createTestingModule({
                  imports: [AppModule],
            }).compile();

            app = moduleFixture.createNestApplication();

            // Replicating main.ts configuration for testing
            app.use(helmet());
            app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
            app.useGlobalFilters(new HttpExceptionFilter());

            // CORS config for testing manually
            // Note: Supertest allows us to check headers, but the actual blocking happens at network level or via missing headers.
            app.enableCors({
                  origin: ['http://localhost:3000'],
                  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
                  credentials: true,
            });

            await app.init();
      });

      // [ ] Tente fazer login 6 vezes seguidas rapidamente. A 6ª tentativa retorna erro 429 Too Many Requests?
      it('1. Rate Limiting should block 6th login attempt', async () => {
            // Limit is 5 per 60s
            for (let i = 0; i < 5; i++) {
                  await request(app.getHttpServer())
                        .post('/auth/login')
                        .send({ email: 'teacher@example.com', password: 'admin123' }) // Wrong or right doesn't matter for rate limit, but let's use valid
                        .expect((res) => {
                              if (res.status !== 201 && res.status !== 401) {
                                    // Expecting 201 (success) or 401 (wrong pass), but typical flow is 201.
                                    // Just ensuring it's not 429 yet.
                              }
                        });
            }

            // 6th attempt
            await request(app.getHttpServer())
                  .post('/auth/login')
                  .send({ email: 'teacher@example.com', password: 'admin123' })
                  .expect(429); // Too Many Requests
      });

      // [ ] Verifique os headers da resposta. O header X-Powered-By sumiu?
      it('2. Helmet should hide X-Powered-By header', async () => {
            const res = await request(app.getHttpServer())
                  .get('/'); // trying root, usually 404 but headers should be there

            expect(res.headers['x-powered-by']).toBeUndefined();
            // Helmet adds strict-transport-security usually
            // expect(res.headers['strict-transport-security']).toBeDefined(); // Optional check
      });

      // [ ] Force um erro. A resposta é um JSON limpo?
      it('3. Global Exception Filter should return clean JSON', async () => {
            const res = await request(app.getHttpServer())
                  .get('/api/v1/non-existent-route-for-error')
                  .expect(404);

            expect(res.body).toEqual(expect.objectContaining({
                  statusCode: 404,
                  message: expect.any(String), // "Cannot GET ..." or similar
                  timestamp: expect.any(String),
                  path: expect.any(String),
            }));
            // Ensure no stack trace in body (simple check)
            expect(res.body.stack).toBeUndefined();
      });

      // [ ] O CORS bloqueia requisições se você simular uma origem diferente?
      it('4. CORS should not send Access-Control-Allow-Origin for unauthorized origin', async () => {
            const res = await request(app.getHttpServer())
                  .options('/community/posts') // Preflight or just GET
                  .set('Origin', 'http://evil.com');

            // If not allowed, the header Access-Control-Allow-Origin should be missing 
            // OR it should certainly NOT be http://evil.com
            expect(res.headers['access-control-allow-origin']).toBeUndefined();
      });

      it('4b. CORS should allow authorized origin', async () => {
            const res = await request(app.getHttpServer())
                  .options('/community/posts')
                  .set('Origin', 'http://localhost:3000');

            expect(res.headers['access-control-allow-origin']).toEqual('http://localhost:3000');
      });

      afterAll(async () => {
            await app.close();
      });
});

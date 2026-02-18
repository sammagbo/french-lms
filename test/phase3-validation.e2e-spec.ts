import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Phase 3 Validation Checklist (E2E)', () => {
      let app: INestApplication;
      let token: string;
      let userId: string;

      beforeAll(async () => {
            const moduleFixture: TestingModule = await Test.createTestingModule({
                  imports: [AppModule],
            }).compile();

            app = moduleFixture.createNestApplication();
            app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
            await app.init();
      });

      // [ ] O login na rota /auth/login retorna um token ey...?
      it('1. Login should return a JWT token', async () => {
            const response = await request(app.getHttpServer())
                  .post('/auth/login')
                  .send({ email: 'student@example.com', password: 'password123' })
                  .expect(201);

            expect(response.body.access_token).toBeDefined();
            expect(response.body.access_token).toMatch(/^ey/);
            token = response.body.access_token;
      });

      // [ ] Se você copiar esse token... você vê o role e o sub (id) corretos no payload?
      it('2. Token payload should contain sub and role', async () => {
            const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());

            expect(payload.sub).toBeDefined();
            expect(payload.role).toBe('STUDENT');
            userId = payload.sub;
      });

      // [ ] Tentar acessar /users/me SEM token retorna 401 Unauthorized?
      it('3. /users/me WITHOUT token should return 401', async () => {
            await request(app.getHttpServer())
                  .get('/users/me')
                  .expect(401);
      });

      // [ ] Tentar acessar /users/me COM token retorna os dados do seu usuário?
      it('4. /users/me WITH token should return user profile', async () => {
            const response = await request(app.getHttpServer())
                  .get('/users/me')
                  .set('Authorization', `Bearer ${token}`)
                  .expect(200);

            expect(response.body.id).toBe(userId);
            expect(response.body.email).toBe('student@example.com');
      });

      // [ ] Crie um usuário com role STUDENT. Tente acessar /users (que protegemos para ADMIN). O sistema retorna 403 Forbidden?
      it('5. Role STUDENT should be Forbidden (403) from /users', async () => {
            // We are already logged in as STUDENT
            await request(app.getHttpServer())
                  .get('/users')
                  .set('Authorization', `Bearer ${token}`)
                  .expect(403);
      });

      afterAll(async () => {
            await app.close();
      });
});

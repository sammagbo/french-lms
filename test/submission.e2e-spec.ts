import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Submission Flow (E2E)', () => {
      let app: INestApplication;
      let studentToken: string;
      let activityId: string;

      beforeAll(async () => {
            const moduleFixture: TestingModule = await Test.createTestingModule({
                  imports: [AppModule],
            }).compile();

            app = moduleFixture.createNestApplication();
            app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
            await app.init();

            // 1. Login as Student
            const loginResponse = await request(app.getHttpServer())
                  .post('/auth/login')
                  .send({ email: 'student@example.com', password: 'password123' })
                  .expect(201);

            studentToken = loginResponse.body.access_token;
            console.log('Got Student Token');
      });

      it('1. Should list pending activities', async () => {
            const response = await request(app.getHttpServer())
                  .get('/classroom/activities/pending')
                  .set('Authorization', `Bearer ${studentToken}`)
                  .expect(200);

            // Expect at least one pending activity (from seed)
            expect(response.body.length).toBeGreaterThan(0);
            activityId = response.body[0].activityId;
            console.log('Found Pending Activity ID:', activityId);
      });

      it('2. Should submit the activity', async () => {
            await request(app.getHttpServer())
                  .post('/classroom/submissions')
                  .set('Authorization', `Bearer ${studentToken}`)
                  .send({
                        activityId: activityId,
                        textContent: 'My homework submission!',
                  })
                  .expect(201);

            console.log('Submission Created');
      });

      it('3. Should NOT show the activity in pending list anymore', async () => {
            const response = await request(app.getHttpServer())
                  .get('/classroom/activities/pending')
                  .set('Authorization', `Bearer ${studentToken}`)
                  .expect(200);

            const found = response.body.find((a) => a.activityId === activityId);
            expect(found).toBeUndefined();
            console.log('Activity removed from pending list');
      });

      afterAll(async () => {
            await app.close();
      });
});

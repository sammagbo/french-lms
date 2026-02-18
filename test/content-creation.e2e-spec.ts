import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Content Creation Flow (E2E)', () => {
      let app: INestApplication;
      let teacherToken: string;
      let courseId: string;
      let moduleId: string;

      beforeAll(async () => {
            const moduleFixture: TestingModule = await Test.createTestingModule({
                  imports: [AppModule],
            }).compile();

            app = moduleFixture.createNestApplication();
            app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
            await app.init();

            // 1. Login as Teacher
            const loginResponse = await request(app.getHttpServer())
                  .post('/auth/login')
                  .send({ email: 'teacher@example.com', password: 'admin123' })
                  .expect(201);

            teacherToken = loginResponse.body.access_token;
      });

      it('1. Should create a new Course', async () => {
            const response = await request(app.getHttpServer())
                  .post('/academy/courses')
                  .set('Authorization', `Bearer ${teacherToken}`)
                  .send({
                        title: 'Advanced French 101',
                        description: 'Master French grammar',
                        price: 49.99,
                        slug: 'advanced-french-101',
                  })
                  .expect(201);

            courseId = response.body.id;
            expect(courseId).toBeDefined();
            expect(response.body.slug).toBe('advanced-french-101');
      });

      it('2. Should create a Module in the Course', async () => {
            const response = await request(app.getHttpServer())
                  .post(`/academy/courses/${courseId}/modules`)
                  .set('Authorization', `Bearer ${teacherToken}`)
                  .send({
                        title: 'Module 1: Subjunctive',
                  })
                  .expect(201);

            moduleId = response.body.id;
            expect(moduleId).toBeDefined();
            expect(response.body.courseId).toBe(courseId);
      });

      it('3. Should create a Lesson in the Module', async () => {
            const response = await request(app.getHttpServer())
                  .post(`/academy/modules/${moduleId}/lessons`)
                  .set('Authorization', `Bearer ${teacherToken}`)
                  .send({
                        title: 'The Subjunctive Mood',
                        videoUrl: 'https://vimeo.com/123456',
                        content: 'This is the written content.',
                  })
                  .expect(201);

            expect(response.body.id).toBeDefined();
            expect(response.body.videoUrl).toBe('https://vimeo.com/123456');
            expect(response.body.moduleId).toBe(moduleId);
      });

      afterAll(async () => {
            await app.close();
      });
});

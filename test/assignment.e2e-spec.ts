import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { Role } from '@prisma/client';

describe('Assignment Flow (E2E)', () => {
      let app: INestApplication;
      let prisma: PrismaService;
      let teacherToken: string;
      let studentToken: string;
      let studentId: string;
      let teacherId: string;
      let activityId: string;

      beforeAll(async () => {
            const moduleFixture: TestingModule = await Test.createTestingModule({
                  imports: [AppModule],
            }).compile();

            app = moduleFixture.createNestApplication();
            app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
            await app.init();

            prisma = app.get(PrismaService);

            // 1. Get IDs from DB
            const teacherUser = await prisma.user.findUnique({ where: { email: 'teacher@example.com' } });
            teacherId = teacherUser.id;

            const studentUser = await prisma.user.findUnique({ where: { email: 'student@example.com' } });
            studentId = studentUser.id;

            // 2. Login as Teacher
            const teacherLogin = await request(app.getHttpServer())
                  .post('/auth/login')
                  .send({ email: 'teacher@example.com', password: 'admin123' })
                  .expect(201);
            teacherToken = teacherLogin.body.access_token;

            // 3. Login as Student
            const studentLogin = await request(app.getHttpServer())
                  .post('/auth/login')
                  .send({ email: 'student@example.com', password: 'password123' })
                  .expect(201);
            studentToken = studentLogin.body.access_token;

            // 4. Create a Dummy Activity directly in DB (to assign later)
            // We need a connected lesson/course for context, or just use author
            const activity = await prisma.activity.create({
                  data: {
                        title: 'Extra Credit Activity',
                        description: 'Do this for extra points',
                        authorId: teacherId,
                  },
            });
            activityId = activity.id;
      });

      it('1. Should assign activity to student', async () => {
            const dueDate = new Date();
            dueDate.setDate(dueDate.getDate() + 5); // 5 days from now

            await request(app.getHttpServer())
                  .post('/classroom/assignments')
                  .set('Authorization', `Bearer ${teacherToken}`)
                  .send({
                        studentId: studentId,
                        activityId: activityId,
                        dueDate: dueDate.toISOString(),
                  })
                  .expect(201);
      });

      it('2. Student should see the new assignment in pending list', async () => {
            const response = await request(app.getHttpServer())
                  .get('/classroom/activities/pending')
                  .set('Authorization', `Bearer ${studentToken}`)
                  .expect(200);

            const assigned = response.body.find((a) => a.activityId === activityId);
            expect(assigned).toBeDefined();
            expect(assigned.status).toBe('PENDING');
      });

      it('3. Should fail to assign same activity again', async () => {
            await request(app.getHttpServer())
                  .post('/classroom/assignments')
                  .set('Authorization', `Bearer ${teacherToken}`)
                  .send({
                        studentId: studentId,
                        activityId: activityId,
                        dueDate: new Date().toISOString(),
                  })
                  .expect(400); // Expect BadRequest
      });

      afterAll(async () => {
            // Cleanup
            if (activityId) {
                  await prisma.studentActivity.deleteMany({ where: { activityId } });
                  await prisma.activity.delete({ where: { id: activityId } });
            }
            await app.close();
      });
});

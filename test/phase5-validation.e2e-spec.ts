import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { Role, SubmissionStatus } from '@prisma/client';

describe('Phase 5 Validation Checklist (E2E)', () => {
      let app: INestApplication;
      let prisma: PrismaService;
      let teacherToken: string;
      let studentToken: string;
      let teacherId: string;
      let studentId: string;

      // Test Data
      let courseId: string;
      let moduleId: string;
      let lessonId: string;
      let activityId: string;
      let studentActivityId: string;
      let submissionId: string;

      beforeAll(async () => {
            const moduleFixture: TestingModule = await Test.createTestingModule({
                  imports: [AppModule],
            }).compile();

            app = moduleFixture.createNestApplication();
            app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
            await app.init();
            prisma = app.get(PrismaService);

            // Get Users from DB (seeded)
            const teacherUser = await prisma.user.findUnique({ where: { email: 'teacher@example.com' } });
            const studentUser = await prisma.user.findUnique({ where: { email: 'student@example.com' } });
            teacherId = teacherUser.id;
            studentId = studentUser.id;

            // Login Teacher
            const tLogin = await request(app.getHttpServer())
                  .post('/auth/login')
                  .send({ email: 'teacher@example.com', password: 'admin123' });
            teacherToken = tLogin.body.access_token;

            // Login Student
            const sLogin = await request(app.getHttpServer())
                  .post('/auth/login')
                  .send({ email: 'student@example.com', password: 'password123' });
            studentToken = sLogin.body.access_token;
      });

      // [ ] Um usuário TEACHER consegue criar um curso e uma aula?
      it('1. Teacher should create Course, Module, and Lesson', async () => {
            // Create Course
            const courseRes = await request(app.getHttpServer())
                  .post('/academy/courses')
                  .set('Authorization', `Bearer ${teacherToken}`)
                  .send({
                        title: 'Phase 5 Validation Course',
                        description: 'Testing permissions',
                        price: 0,
                        slug: 'phase-5-validation-' + Date.now(),
                  })
                  .expect(201);
            courseId = courseRes.body.id;

            // Create Module
            const moduleRes = await request(app.getHttpServer())
                  .post(`/academy/courses/${courseId}/modules`)
                  .set('Authorization', `Bearer ${teacherToken}`)
                  .send({ title: 'Module 1' })
                  .expect(201);
            moduleId = moduleRes.body.id;

            // Create Lesson
            const lessonRes = await request(app.getHttpServer())
                  .post(`/academy/modules/${moduleId}/lessons`)
                  .set('Authorization', `Bearer ${teacherToken}`)
                  .send({ title: 'Lesson 1', content: 'Content' })
                  .expect(201);
            lessonId = lessonRes.body.id;

            expect(courseId).toBeDefined();
            expect(moduleId).toBeDefined();
            expect(lessonId).toBeDefined();
      });

      // [ ] Um usuário STUDENT é impedido de criar cursos (Erro 403)?
      it('2. Student should be FORBIDDEN (403) from creating content', async () => {
            await request(app.getHttpServer())
                  .post('/academy/courses')
                  .set('Authorization', `Bearer ${studentToken}`)
                  .send({
                        title: 'Hacker Course',
                        description: 'Should fail',
                        slug: 'hacker-course',
                  })
                  .expect(403);
      });

      // [ ] O professor consegue atribuir uma atividade para o aluno X?
      it('3. Teacher should assign activity to student', async () => {
            // Prerequisite: Create an Activity manually (since no endpoint exists yet)
            const activity = await prisma.activity.create({
                  data: {
                        title: 'Validation Activity',
                        authorId: teacherId,
                        lessonId: lessonId,
                  }
            });
            activityId = activity.id;

            // Assign
            await request(app.getHttpServer())
                  .post('/classroom/assignments')
                  .set('Authorization', `Bearer ${teacherToken}`)
                  .send({
                        studentId: studentId,
                        activityId: activityId,
                        dueDate: new Date(Date.now() + 86400000).toISOString(),
                  })
                  .expect(201);

            // Check DB
            const sa = await prisma.studentActivity.findFirst({
                  where: { studentId, activityId }
            });
            expect(sa).toBeDefined();
            studentActivityId = sa.id;
      });

      // [ ] O professor consegue ver a submissão... na rota /classroom/teacher/inbox?
      it('4. Teacher should see submitted work in Inbox', async () => {
            // First, Student submits
            await request(app.getHttpServer())
                  .post('/classroom/submissions')
                  .set('Authorization', `Bearer ${studentToken}`)
                  .send({
                        activityId: activityId,
                        textContent: 'Here is my work.',
                  })
                  .expect(201);

            // Now check Inbox
            const res = await request(app.getHttpServer())
                  .get('/classroom/teacher/inbox')
                  .set('Authorization', `Bearer ${teacherToken}`)
                  .expect(200);

            // Should find our submission
            // Note: findPendingSubmissions returns Submissions array
            const found = res.body.find(sub => sub.studentActivityId === studentActivityId);
            expect(found).toBeDefined();
            submissionId = found.id;
      });

      // [ ] Ao enviar a correção (Grade), o status da submissão muda no banco de dados?
      it('5. Grade should change status to GRADED', async () => {
            const gradeDto = {
                  submissionId: submissionId,
                  grade: 9.5,
                  feedbackText: 'Excellent job!',
                  status: SubmissionStatus.GRADED
            };

            await request(app.getHttpServer())
                  .post('/classroom/grade')
                  .set('Authorization', `Bearer ${teacherToken}`)
                  .send(gradeDto)
                  .expect(201);

            // Verify DB update
            const updatedSA = await prisma.studentActivity.findUnique({
                  where: { id: studentActivityId }
            });
            expect(updatedSA.status).toBe(SubmissionStatus.GRADED);

            const feedback = await prisma.feedback.findUnique({
                  where: { submissionId: submissionId }
            });
            expect(feedback).toBeDefined();
            expect(feedback.grade).toBe(9.5);
      });

      afterAll(async () => {
            // Cleanup
            if (courseId) await prisma.course.delete({ where: { id: courseId } });
            // Activity deletion cascades or manual? Activity is linked to Lesson?
            // If activity linked to lesson, deleting course->module->lesson deletes activity if cascade.
            // Schema says:
            // Lesson -> Activity: No relation field on Lesson side in schema provided earlier?
            // checking schema...
            // Activity has lessonId (optional).
            // Lesson has activities Activity[]
            // Relation logic depends on updates.
            // Just in case, clean up activity if not filtered
            if (activityId) {
                  try { await prisma.activity.delete({ where: { id: activityId } }); } catch { }
            }
            await app.close();
      });
});

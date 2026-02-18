import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { SubmissionStatus } from '@prisma/client';

describe('Phase 4 Validation Checklist (E2E)', () => {
      let app: INestApplication;
      let prisma: PrismaService;
      let studentToken: string;
      let studentId: string;
      let teacherId: string;

      // Test Data
      let courseId: string;
      let activityId: string;
      let studentActivityId: string;

      beforeAll(async () => {
            const moduleFixture: TestingModule = await Test.createTestingModule({
                  imports: [AppModule],
            }).compile();

            app = moduleFixture.createNestApplication();
            app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
            await app.init();
            prisma = app.get(PrismaService);

            // Get Users
            const studentUser = await prisma.user.findUnique({ where: { email: 'student@example.com' } });
            const teacherUser = await prisma.user.findUnique({ where: { email: 'teacher@example.com' } });
            studentId = studentUser.id;
            teacherId = teacherUser.id;

            // Login Student
            const loginRes = await request(app.getHttpServer())
                  .post('/auth/login')
                  .send({ email: 'student@example.com', password: 'password123' });
            studentToken = loginRes.body.access_token;

            // Setup Data: Course -> Module -> Lesson -> Activity -> StudentActivity
            const course = await prisma.course.create({
                  data: {
                        title: 'Phase 4 Course',
                        description: 'Test Course',
                        slug: 'phase-4-course-' + Date.now(),
                        authorId: teacherId,
                        modules: {
                              create: {
                                    title: 'Module 1',
                                    lessons: {
                                          create: {
                                                title: 'Lesson 1',
                                                content: 'Content',
                                                activities: {
                                                      create: {
                                                            title: 'Phase 4 Activity',
                                                            description: 'Submit this',
                                                            authorId: teacherId
                                                      }
                                                }
                                          }
                                    }
                              }
                        }
                  },
                  include: {
                        modules: {
                              include: {
                                    lessons: {
                                          include: {
                                                activities: true
                                          }
                                    }
                              }
                        }
                  }
            });

            courseId = course.id;
            const lesson = course.modules[0].lessons[0];
            const activity = lesson.activities[0];
            activityId = activity.id;

            // Assign to Student (Pending)
            const sa = await prisma.studentActivity.create({
                  data: {
                        studentId: studentId,
                        activityId: activityId,
                        status: SubmissionStatus.PENDING
                  }
            });
            studentActivityId = sa.id;
      });

      // [ ] Consigo listar os cursos na rota /academy/courses?
      it('1. Should list courses', async () => {
            const res = await request(app.getHttpServer())
                  .get('/academy/courses')
                  .set('Authorization', `Bearer ${studentToken}`)
                  .expect(200);

            expect(Array.isArray(res.body)).toBe(true);
            const found = res.body.find(c => c.id === courseId);
            expect(found).toBeDefined();
            expect(found.title).toBe('Phase 4 Course');
      });

      // [ ] Ao acessar /academy/courses/:id, vejo a árvore aninhada (Módulos -> Aulas)?
      it('2. Should return course details with nested modules and lessons', async () => {
            const res = await request(app.getHttpServer())
                  .get(`/academy/courses/${courseId}`)
                  .set('Authorization', `Bearer ${studentToken}`)
                  .expect(200);

            expect(res.body.modules).toBeDefined();
            expect(res.body.modules.length).toBeGreaterThan(0);
            expect(res.body.modules[0].lessons).toBeDefined();
            expect(res.body.modules[0].lessons.length).toBeGreaterThan(0);
      });

      // [ ] A rota de "Pendentes" mostra apenas as atividades não feitas?
      it('3. Pending activities should show the new assignment', async () => {
            const res = await request(app.getHttpServer())
                  .get('/classroom/activities/pending')
                  .set('Authorization', `Bearer ${studentToken}`)
                  .expect(200);

            const found = res.body.find(a => a.id === studentActivityId);
            expect(found).toBeDefined();
            expect(found.activity.title).toBe('Phase 4 Activity');
      });

      // [ ] Consigo enviar uma submissão via POST /classroom/submissions?
      it('4. Should submit activity successfully', async () => {
            await request(app.getHttpServer())
                  .post('/classroom/submissions')
                  .set('Authorization', `Bearer ${studentToken}`)
                  .send({
                        activityId: activityId,
                        textContent: 'Phase 4 Submission Content'
                  })
                  .expect(201);
      });

      // [ ] A submissão aparece no banco de dados com o userId correto?
      it('5. Submission should appear in DB linked to student', async () => {
            const submission = await prisma.submission.findFirst({
                  where: {
                        studentActivityId: studentActivityId,
                        studentId: studentId
                  }
            });

            expect(submission).toBeDefined();
            expect(submission.textContent).toBe('Phase 4 Submission Content');
      });

      // [ ] A rota de "Pendentes" mostra apenas as atividades não feitas? (Re-check)
      it('6. Pending activities should NOT show the submitted activity anymore', async () => {
            const res = await request(app.getHttpServer())
                  .get('/classroom/activities/pending')
                  .set('Authorization', `Bearer ${studentToken}`)
                  .expect(200);

            const found = res.body.find(a => a.id === studentActivityId);
            expect(found).toBeUndefined();
      });

      afterAll(async () => {
            // Cleanup
            if (courseId) await prisma.course.delete({ where: { id: courseId } });
            if (activityId) {
                  try { await prisma.activity.delete({ where: { id: activityId } }); } catch { }
            }
            await app.close();
      });
});

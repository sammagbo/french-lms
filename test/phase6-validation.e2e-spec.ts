import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Phase 6 Validation Checklist (E2E)', () => {
      let app: INestApplication;
      let prisma: PrismaService;
      let studentToken: string;
      let teacherToken: string;
      let postId: string;
      let commentId: string;

      beforeAll(async () => {
            const moduleFixture: TestingModule = await Test.createTestingModule({
                  imports: [AppModule],
            }).compile();

            app = moduleFixture.createNestApplication();
            app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
            await app.init();
            prisma = app.get(PrismaService);

            // Login Teacher
            const teacherLogin = await request(app.getHttpServer())
                  .post('/auth/login')
                  .send({ email: 'teacher@example.com', password: 'admin123' })
                  .expect(201);
            teacherToken = teacherLogin.body.access_token;

            // Login Student
            const studentLogin = await request(app.getHttpServer())
                  .post('/auth/login')
                  .send({ email: 'student@example.com', password: 'password123' })
                  .expect(201);
            studentToken = studentLogin.body.access_token;
      });

      // [ ] Um Professor consegue criar um Post sobre "Dicas de Verbos"?
      it('1. Teacher should create a Post', async () => {
            const res = await request(app.getHttpServer())
                  .post('/community/posts')
                  .set('Authorization', `Bearer ${teacherToken}`)
                  .send({
                        title: 'Dicas de Verbos',
                        content: 'Aqui estão algumas dicas sobre verbos irregulares...',
                        published: true
                  })
                  .expect(201);

            expect(res.body.id).toBeDefined();
            postId = res.body.id;
      });

      // [ ] Um Aluno consegue ver esse post na listagem?
      it('2. Student should see the post in the list', async () => {
            const res = await request(app.getHttpServer())
                  .get('/community/posts')
                  .set('Authorization', `Bearer ${studentToken}`)
                  .expect(200);

            const found = res.body.find(p => p.id === postId);
            expect(found).toBeDefined();
            expect(found.title).toBe('Dicas de Verbos');
            expect(found.author).toBeDefined(); // Check include
      });

      // [ ] Um Aluno consegue comentar "Merci beaucoup!" no post?
      it('3. Student should comment on the post', async () => {
            const res = await request(app.getHttpServer())
                  .post('/community/comments')
                  .set('Authorization', `Bearer ${studentToken}`)
                  .send({
                        postId: postId,
                        content: 'Merci beaucoup!'
                  })
                  .expect(201);

            expect(res.body.id).toBeDefined();
            commentId = res.body.id;
      });

      // [ ] O Aluno consegue deletar o post do professor? (Deve ser proibido/403).
      it('4. Student should be FORBIDDEN from deleting Teacher post', async () => {
            await request(app.getHttpServer())
                  .delete(`/community/posts/${postId}`)
                  .set('Authorization', `Bearer ${studentToken}`)
                  .expect(403);
      });

      // [ ] O Professor consegue deletar um comentário ofensivo de um aluno em seu post?
      it('5. Teacher should delete Student comment on their post', async () => {
            await request(app.getHttpServer())
                  .delete(`/community/comments/${commentId}`)
                  .set('Authorization', `Bearer ${teacherToken}`)
                  .expect(200);

            // Verify deletion
            const comment = await prisma.comment.findUnique({ where: { id: commentId } });
            expect(comment).toBeNull();
      });

      afterAll(async () => {
            if (postId) {
                  await prisma.post.delete({ where: { id: postId } }).catch(() => { });
            }
            await app.close();
      });
});

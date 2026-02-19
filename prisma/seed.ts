import { PrismaClient, Role, SubmissionStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
      console.log('🌱 Seeding database...');

      // 0. Use the provided hash for '123456'
      const passwordHash = '$2b$10$EpRnTzVlqHNP0zQx.JfLFO/doDGp91eoCIzceDb5LF.vHw8H8K6i6';

      // 1. Create Teacher
      // Note: User model does not have fullName, only email/passwordHash/role/profile
      const teacher = await prisma.user.upsert({
            where: { email: 'prof@escola.com' },
            update: {},
            create: {
                  email: 'prof@escola.com',
                  passwordHash,
                  role: Role.TEACHER,
                  profile: {
                        create: {
                              bio: 'Professor de Francês experiente.',
                        }
                  }
            },
      });
      console.log('User created:', teacher.email);

      // 2. Create Student
      const student = await prisma.user.upsert({
            where: { email: 'aluno@escola.com' },
            update: {},
            create: {
                  email: 'aluno@escola.com',
                  passwordHash,
                  role: Role.STUDENT,
                  profile: {
                        create: {
                              bio: 'Aluno dedicado.',
                        }
                  }
            },
      });
      console.log('User created:', student.email);

      // 3. Create Course -> Module -> Lesson
      const course = await prisma.course.upsert({
            where: { slug: 'frances-basico' },
            update: {},
            create: {
                  title: 'Francês Básico',
                  description: 'Curso introdutório de Francês.',
                  slug: 'frances-basico',
                  price: 0,
                  authorId: teacher.id,
                  modules: {
                        create: {
                              title: 'Módulo 1: Introdução',
                              // Schema does not have order on Module? Let's check schema.
                              // Schema: Module { id, title, courseId, createdAt, updatedAt } - NO ORDER
                              lessons: {
                                    create: {
                                          title: 'Aula 1: Saudações',
                                          // Schema: Lesson { id, title, videoUrl, content, moduleId } - NO ORDER, NO isPublished
                                          videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                                          content: '<p>Bienvenue! Nesta aula vamos aprender a dizer <strong>Bonjour</strong>.</p>',
                                    },
                              },
                        },
                  },
            },
            include: {
                  modules: {
                        include: {
                              lessons: true,
                        },
                  },
            },
      });
      console.log('Course created:', course.title);

      // Get the Created Lesson
      const lesson = course.modules[0].lessons[0];

      // 4. Create Activity (Homework)
      const activity = await prisma.activity.create({
            data: {
                  title: 'Gravar áudio de apresentação',
                  description: 'Grave um áudio dizendo seu nome e "Bonjour".',
                  lessonId: lesson.id,
                  authorId: teacher.id,
            },
      });
      console.log('Activity created:', activity.title);

      // 5. Create StudentActivity (The Assignment)
      // Schema: StudentActivity { id, status, dueDate, studentId, activityId } - NO COMPOUND UNIQUE KEY in current schema?
      // Schema defines @map("student_activities") but no @@unique([studentId, activityId]) ?
      // Let's check schema again. Relationships: student, activity.
      // If no unique constraint, we might create duplicates. Ideally should findFirst.

      const existingAssignment = await prisma.studentActivity.findFirst({
            where: {
                  studentId: student.id,
                  activityId: activity.id
            }
      });

      if (!existingAssignment) {
            const assignment = await prisma.studentActivity.create({
                  data: {
                        studentId: student.id,
                        activityId: activity.id,
                        status: SubmissionStatus.PENDING,
                        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 days
                  },
            });
            console.log('Assignment created for:', student.email);
      } else {
            console.log('Assignment already exists.');
            // Update status if needed
            await prisma.studentActivity.update({
                  where: { id: existingAssignment.id },
                  data: { status: SubmissionStatus.PENDING }
            });
      }

      console.log('✅ Seeding finished.');
}

main()
      .catch((e) => {
            console.error(e);
            process.exit(1);
      })
      .finally(async () => {
            await prisma.$disconnect();
      });

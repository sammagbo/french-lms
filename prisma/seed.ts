import { PrismaClient, Role, SubmissionStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
      console.log('Seeding database...');

      // 1. Create Users
      const studentPassword = await bcrypt.hash('password123', 10);
      const student = await prisma.user.upsert({
            where: { email: 'student@example.com' },
            update: {},
            create: {
                  email: 'student@example.com',
                  passwordHash: studentPassword,
                  role: Role.STUDENT,
            },
      });

      const teacherPassword = await bcrypt.hash('admin123', 10);
      const teacher = await prisma.user.upsert({
            where: { email: 'teacher@example.com' },
            update: {},
            create: {
                  email: 'teacher@example.com',
                  passwordHash: teacherPassword,
                  role: Role.TEACHER,
            },
      });

      console.log({ student, teacher });

      // 2. Create Course -> Module -> Lesson
      let course = await prisma.course.findUnique({
            where: { slug: 'french-for-beginners' },
            include: {
                  modules: {
                        include: {
                              lessons: true,
                        },
                  },
            },
      });

      if (!course) {
            course = await prisma.course.create({
                  data: {
                        title: 'French for Beginners',
                        description: 'A complete guide to French basics.',
                        // @ts-ignore
                        slug: 'french-for-beginners',
                        authorId: teacher.id,
                        modules: {
                              create: {
                                    title: 'Module 1: Introduction',
                                    lessons: {
                                          create: {
                                                title: 'Lesson 1: Greetings',
                                                content: 'Bonjour! Comment ça va?',
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
      }

      const lesson = course.modules?.[0]?.lessons?.[0];
      console.log({ course, lesson });

      // 3. Create Activity
      const activity = await prisma.activity.create({
            data: {
                  title: 'Practice Greetings',
                  description: 'Record yourself saying "Bonjour"',
                  authorId: teacher.id,
                  lessonId: lesson.id,
            },
      });

      console.log({ activity });

      // 4. Create StudentActivity (Assign activity to student)
      const studentActivity = await prisma.studentActivity.create({
            data: {
                  studentId: student.id,
                  activityId: activity.id,
                  status: SubmissionStatus.PENDING,
                  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days
            },
      });

      console.log({ studentActivity });
      console.log('Seeding finished.');
}

main()
      .catch((e) => {
            console.error(e);
            process.exit(1);
      })
      .finally(async () => {
            await prisma.$disconnect();
      });

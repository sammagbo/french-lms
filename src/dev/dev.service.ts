import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, SubmissionStatus } from '@prisma/client';

@Injectable()
export class DevService {
      constructor(private prisma: PrismaService) { }

      async seed() {
            console.log('🌱 Seeding database via API...');

            // 0. Password "123456"
            const passwordHash = '$2b$10$EpRnTzVlqHNP0zQx.JfLFO/doDGp91eoCIzceDb5LF.vHw8H8K6i6';

            // 1. Create Teacher
            const teacher = await this.prisma.user.upsert({
                  where: { email: 'prof@escola.com' },
                  update: {},
                  create: {
                        email: 'prof@escola.com',
                        passwordHash,
                        role: Role.TEACHER,
                        profile: {
                              create: {
                                    bio: 'Professor de Francês experiente.',
                              },
                        },
                  },
            });

            // 2. Create Student
            const student = await this.prisma.user.upsert({
                  where: { email: 'aluno@escola.com' },
                  update: {},
                  create: {
                        email: 'aluno@escola.com',
                        passwordHash,
                        role: Role.STUDENT,
                        profile: {
                              create: {
                                    bio: 'Aluno dedicado.',
                              },
                        },
                  },
            });

            return {
                  message: 'Database Seeded Successfully!',
                  users: [teacher.email, student.email],
            };
      }
}

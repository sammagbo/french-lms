import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';

@Injectable()
export class AcademyService {
      constructor(private prisma: PrismaService) { }

      async createCourse(authorId: string, dto: CreateCourseDto) {
            return this.prisma.course.create({
                  data: {
                        ...dto,
                        authorId,
                  },
            });
      }

      async createModule(courseId: string, dto: CreateModuleDto) {
            const course = await this.prisma.course.findUnique({ where: { id: courseId } });
            if (!course) throw new NotFoundException('Course not found');

            return this.prisma.module.create({
                  data: {
                        title: dto.title,
                        courseId,
                  },
            });
      }

      async createLesson(moduleId: string, dto: CreateLessonDto) {
            const module = await this.prisma.module.findUnique({ where: { id: moduleId } });
            if (!module) throw new NotFoundException('Module not found');

            return this.prisma.lesson.create({
                  data: {
                        title: dto.title,
                        videoUrl: dto.videoUrl,
                        content: dto.content,
                        moduleId,
                  },
            });
      }

      async findAllCourses() {
            // Note: The schema 'Course' model currently does not have a 'status' or 'published' field.
            // Returning all courses for now. In a real scenario, we would filter by { published: true }.
            return this.prisma.course.findMany({
                  include: {
                        author: {
                              select: { email: true },
                        },
                  },
                  orderBy: { createdAt: 'desc' },
            });
      }

      async findCourseById(id: string) {
            const course = await this.prisma.course.findUnique({
                  where: { id },
                  include: {
                        author: {
                              select: { email: true },
                        },
                        modules: {
                              orderBy: { createdAt: 'asc' }, // Assuming order by creation since 'order' field is missing
                              include: {
                                    lessons: {
                                          orderBy: { createdAt: 'asc' }, // Assuming order by creation
                                    },
                              },
                        },
                  },
            });

            if (!course) {
                  throw new NotFoundException(`Course with ID ${id} not found`);
            }

            return course;
      }
}

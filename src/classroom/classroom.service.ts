import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { AssignActivityDto } from './dto/assign-activity.dto';
import { GradeSubmissionDto } from './dto/grade-submission.dto';
import { SubmissionStatus, Role } from '@prisma/client';

@Injectable()
export class ClassroomService {
      constructor(private prisma: PrismaService) { }

      async gradeSubmission(teacherId: string, dto: GradeSubmissionDto) {
            // 1. Check if submission exists
            const submission = await this.prisma.submission.findUnique({
                  where: { id: dto.submissionId },
                  include: { studentActivity: true }
            });

            if (!submission) {
                  throw new NotFoundException('Submission not found');
            }

            // 2. Transaction: Create Feedback, Update Submission, Update StudentActivity
            return this.prisma.$transaction(async (tx) => {
                  // Create Feedback
                  const feedback = await tx.feedback.create({
                        data: {
                              submissionId: dto.submissionId,
                              authorId: teacherId,
                              grade: dto.grade,
                              comment: dto.feedbackText,
                              audioFeedbackUrl: dto.audioFeedbackUrl,
                        }
                  });

                  // Update Submission status
                  // Note: Submission doesn't have a status field in the schema yet?
                  // Let's check schema again. Wait, StudentActivity has status, Submission doesn't.
                  // The user prompt says "Update status of Submission".
                  // But looking at schema lines 159-175, Submission only has textContent, attachmentUrl.
                  // StudentActivity (lines 137-156) has 'status'.
                  // I will update StudentActivity status.

                  const updatedActivity = await tx.studentActivity.update({
                        where: { id: submission.studentActivityId },
                        data: {
                              status: dto.status,
                        }
                  });

                  return { feedback, updatedActivity };
            });
      }

      async findPendingSubmissions(teacherId?: string) {
            // Find StudentActivities with status SUBMITTED
            // We want to return the actual submissions to grade.

            // Strategy: Find Submissions where related StudentActivity is SUBMITTED
            // and optionally where the Activity author is the teacher.
            return this.prisma.submission.findMany({
                  where: {
                        studentActivity: {
                              status: SubmissionStatus.SUBMITTED,
                              // If we want to filter by teacher (author of the activity):
                              ...(teacherId ? {
                                    activity: {
                                          authorId: teacherId
                                    }
                              } : {})
                        }
                  },
                  include: {
                        student: {
                              select: {
                                    id: true,
                                    email: true,
                                    // fullName: true, // Not in schema currently
                              }
                        },
                        studentActivity: {
                              include: {
                                    activity: true
                              }
                        }
                  },
                  orderBy: {
                        createdAt: 'desc'
                  }
            });
      }

      async assignActivityToStudent(dto: AssignActivityDto) {
            // 1. Verify existence of student and activity
            const student = await this.prisma.user.findUnique({
                  where: { id: dto.studentId },
            });

            // Optional: Check if user is actually a student
            if (!student || student.role !== Role.STUDENT) {
                  throw new BadRequestException('Invalid student ID or user is not a student');
            }

            const activity = await this.prisma.activity.findUnique({
                  where: { id: dto.activityId },
            });

            if (!activity) {
                  throw new NotFoundException('Activity not found');
            }

            // 2. Create StudentActivity
            // Check if already assigned?
            const existing = await this.prisma.studentActivity.findFirst({
                  where: {
                        studentId: dto.studentId,
                        activityId: dto.activityId
                  }
            });

            if (existing) {
                  throw new BadRequestException('Activity already assigned to this student');
            }

            return this.prisma.studentActivity.create({
                  data: {
                        studentId: dto.studentId,
                        activityId: dto.activityId,
                        dueDate: new Date(dto.dueDate),
                        status: SubmissionStatus.PENDING,
                  },
            });
      }

      async submitActivity(userId: string, dto: CreateSubmissionDto) {
            // 1. Verificar se existe a StudentActivity vinculada
            // Precisamos achar a studentActivity que liga este User à Activity
            const studentActivity = await this.prisma.studentActivity.findFirst({
                  where: {
                        studentId: userId,
                        activityId: dto.activityId,
                  },
            });

            if (!studentActivity) {
                  throw new NotFoundException('Activity not found for this student');
            }

            // 2. Criar a Submission
            const submission = await this.prisma.submission.create({
                  data: {
                        textContent: dto.textContent,
                        attachmentUrl: dto.attachmentUrl,
                        studentActivityId: studentActivity.id,
                        studentId: userId,
                  },
            });

            // 3. Atualizar status da StudentActivity
            await this.prisma.studentActivity.update({
                  where: { id: studentActivity.id },
                  data: { status: SubmissionStatus.SUBMITTED },
            });

            return submission;
      }

      async findPendingActivities(userId: string) {
            return this.prisma.studentActivity.findMany({
                  where: {
                        studentId: userId,
                        status: SubmissionStatus.PENDING,
                  },
                  include: {
                        activity: true, // Inclui detalhes da atividade
                  },
            });
      }
}

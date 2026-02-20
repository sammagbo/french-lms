import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role, SubmissionStatus } from '@prisma/client';

@Injectable()
export class AnalyticsService {
      constructor(private readonly prisma: PrismaService) { }

      /**
       * KPIs Gerais — Números rápidos para o dashboard
       */
      async getGeneralKPIs() {
            const [totalStudents, pendingSubmissions, totalCourses, totalActivities, gradedSubmissions] =
                  await this.prisma.$transaction([
                        // a) Total de alunos registados
                        this.prisma.user.count({
                              where: { role: Role.STUDENT },
                        }),

                        // b) Submissões pendentes de correção (SUBMITTED — enviadas pelo aluno, aguardando professor)
                        this.prisma.submission.count({
                              where: {
                                    studentActivity: {
                                          status: {
                                                in: [SubmissionStatus.PENDING, SubmissionStatus.SUBMITTED],
                                          },
                                    },
                              },
                        }),

                        // c) Total de cursos criados
                        this.prisma.course.count(),

                        // d) Total de atividades criadas
                        this.prisma.activity.count(),

                        // e) Submissões corrigidas (para calcular taxa de correção)
                        this.prisma.submission.count({
                              where: {
                                    studentActivity: {
                                          status: SubmissionStatus.GRADED,
                                    },
                              },
                        }),
                  ]);

            const totalSubmissions = pendingSubmissions + gradedSubmissions;
            const gradingRate = totalSubmissions > 0
                  ? Math.round((gradedSubmissions / totalSubmissions) * 100)
                  : 0;

            return {
                  totalStudents,
                  pendingSubmissions,
                  totalCourses,
                  totalActivities,
                  gradedSubmissions,
                  gradingRate, // Percentagem de correção (ex: 75%)
            };
      }

      /**
       * Submissões agrupadas por dia — últimos 7 dias
       * Usa raw query para GROUP BY date_trunc (mais eficiente que trazer N registos para agrupar em memória)
       */
      async getSubmissionsByDay(days: number = 7): Promise<{ date: string; count: number }[]> {
            // Prisma queryRaw does not support parameterizing INTERVAL directly safely if we just use template literal for INTERVAL '${days} days' avoiding sql injection if it was string, but days is number, we can use Prisma.sql.
            // Better to use mathematical interval interpolation: NOW() - (INTERVAL '1 day' * $1)
            const result = await this.prisma.$queryRaw<
                  { date: Date; count: bigint }[]
            >`
                  SELECT
                        DATE_TRUNC('day', "createdAt") AS date,
                        COUNT(*)::int AS count
                  FROM submissions
                  WHERE "createdAt" >= NOW() - (INTERVAL '1 day' * ${days})
                  GROUP BY DATE_TRUNC('day', "createdAt")
                  ORDER BY date ASC
            `;

            // Preencher dias sem submissões com 0
            const lastXDays = this.getLastXDays(days);
            const resultMap = new Map(
                  result.map((r) => [
                        new Date(r.date).toISOString().split('T')[0],
                        Number(r.count),
                  ]),
            );

            return lastXDays.map((day) => ({
                  date: day,
                  count: resultMap.get(day) || 0,
            }));
      }

      /**
       * Novos alunos por dia — últimos 7 dias
       */
      async getNewStudentsByDay(days: number = 7): Promise<{ date: string; count: number }[]> {
            const result = await this.prisma.$queryRaw<
                  { date: Date; count: bigint }[]
            >`
                  SELECT
                        DATE_TRUNC('day', "createdAt") AS date,
                        COUNT(*)::int AS count
                  FROM users
                  WHERE "createdAt" >= NOW() - (INTERVAL '1 day' * ${days})
                        AND role = 'STUDENT'
                  GROUP BY DATE_TRUNC('day', "createdAt")
                  ORDER BY date ASC
            `;

            const lastXDays = this.getLastXDays(days);
            const resultMap = new Map(
                  result.map((r) => [
                        new Date(r.date).toISOString().split('T')[0],
                        Number(r.count),
                  ]),
            );

            return lastXDays.map((day) => ({
                  date: day,
                  count: resultMap.get(day) || 0,
            }));
      }

      /**
       * Utilitário — retorna array com as datas dos últimos X dias em formato YYYY-MM-DD
       */
      private getLastXDays(daysCount: number): string[] {
            const days: string[] = [];
            // e.g. se daysCount = 7, iterar de 6 até 0 (7 dias incluindo hoje)
            for (let i = daysCount - 1; i >= 0; i--) {
                  const d = new Date();
                  d.setDate(d.getDate() - i);
                  days.push(d.toISOString().split('T')[0]);
            }
            return days;
      }
}

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
      async getSubmissionsByDay(): Promise<{ date: string; count: number }[]> {
            const result = await this.prisma.$queryRaw<
                  { date: Date; count: bigint }[]
            >`
                  SELECT
                        DATE_TRUNC('day', "createdAt") AS date,
                        COUNT(*)::int AS count
                  FROM submissions
                  WHERE "createdAt" >= NOW() - INTERVAL '7 days'
                  GROUP BY DATE_TRUNC('day', "createdAt")
                  ORDER BY date ASC
            `;

            // Preencher dias sem submissões com 0
            const last7Days = this.getLast7Days();
            const resultMap = new Map(
                  result.map((r) => [
                        new Date(r.date).toISOString().split('T')[0],
                        Number(r.count),
                  ]),
            );

            return last7Days.map((day) => ({
                  date: day,
                  count: resultMap.get(day) || 0,
            }));
      }

      /**
       * Novos alunos por dia — últimos 7 dias
       */
      async getNewStudentsByDay(): Promise<{ date: string; count: number }[]> {
            const result = await this.prisma.$queryRaw<
                  { date: Date; count: bigint }[]
            >`
                  SELECT
                        DATE_TRUNC('day', "createdAt") AS date,
                        COUNT(*)::int AS count
                  FROM users
                  WHERE "createdAt" >= NOW() - INTERVAL '7 days'
                        AND role = 'STUDENT'
                  GROUP BY DATE_TRUNC('day', "createdAt")
                  ORDER BY date ASC
            `;

            const last7Days = this.getLast7Days();
            const resultMap = new Map(
                  result.map((r) => [
                        new Date(r.date).toISOString().split('T')[0],
                        Number(r.count),
                  ]),
            );

            return last7Days.map((day) => ({
                  date: day,
                  count: resultMap.get(day) || 0,
            }));
      }

      /**
       * Utilitário — retorna array com as datas dos últimos 7 dias em formato YYYY-MM-DD
       */
      private getLast7Days(): string[] {
            const days: string[] = [];
            for (let i = 6; i >= 0; i--) {
                  const d = new Date();
                  d.setDate(d.getDate() - i);
                  days.push(d.toISOString().split('T')[0]);
            }
            return days;
      }
}

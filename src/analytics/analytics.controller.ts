import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
      constructor(private readonly analyticsService: AnalyticsService) { }

      @Get('kpis')
      @Roles(Role.TEACHER, Role.ADMIN)
      @ApiOperation({ summary: 'Buscar KPIs gerais da plataforma (Total Alunos, Pendentes, Cursos, etc.)' })
      @ApiResponse({ status: 200, description: 'KPIs retornados com sucesso.' })
      getKPIs() {
            return this.analyticsService.getGeneralKPIs();
      }

      @Get('submissions-by-day')
      @Roles(Role.TEACHER, Role.ADMIN)
      @ApiOperation({ summary: 'Submissões agrupadas por dia — últimos 7 dias' })
      @ApiResponse({ status: 200, description: 'Array com 7 entradas {date, count}.' })
      getSubmissionsByDay() {
            return this.analyticsService.getSubmissionsByDay();
      }

      @Get('new-students-by-day')
      @Roles(Role.TEACHER, Role.ADMIN)
      @ApiOperation({ summary: 'Novos alunos registados por dia — últimos 7 dias' })
      @ApiResponse({ status: 200, description: 'Array com 7 entradas {date, count}.' })
      getNewStudentsByDay() {
            return this.analyticsService.getNewStudentsByDay();
      }
}

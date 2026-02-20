import { Controller, Get, UseGuards, UseInterceptors, Query } from '@nestjs/common';
import { CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@UseInterceptors(CacheInterceptor)
@Controller('analytics')
export class AnalyticsController {
      constructor(private readonly analyticsService: AnalyticsService) { }

      @Get('kpis')
      @Roles(Role.TEACHER, Role.ADMIN)
      @CacheKey('general-kpis')
      @CacheTTL(5 * 60 * 1000) // 5 minutes overriding global TTL as example (though global is 5m)
      @ApiOperation({ summary: 'Buscar KPIs gerais da plataforma (Total Alunos, Pendentes, Cursos, etc.)' })
      @ApiResponse({ status: 200, description: 'KPIs retornados com sucesso.' })
      getKPIs() {
            return this.analyticsService.getGeneralKPIs();
      }

      @Get('submissions-by-day')
      @Roles(Role.TEACHER, Role.ADMIN)
      @CacheKey('submissions-by-day')
      @CacheTTL(5 * 60 * 1000)
      @ApiOperation({ summary: 'Submissões agrupadas por dia' })
      @ApiResponse({ status: 200, description: 'Array com entradas {date, count}.' })
      getSubmissionsByDay(@Query('days') days?: string) {
            const parsedDays = days ? parseInt(days, 10) : 7;
            return this.analyticsService.getSubmissionsByDay(parsedDays);
      }

      @Get('new-students-by-day')
      @Roles(Role.TEACHER, Role.ADMIN)
      @CacheKey('new-students-by-day')
      @CacheTTL(5 * 60 * 1000)
      @ApiOperation({ summary: 'Novos alunos registados por dia' })
      @ApiResponse({ status: 200, description: 'Array com entradas {date, count}.' })
      getNewStudentsByDay(@Query('days') days?: string) {
            const parsedDays = days ? parseInt(days, 10) : 7;
            return this.analyticsService.getNewStudentsByDay(parsedDays);
      }
}

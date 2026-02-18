import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { AcademyService } from './academy.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateCourseDto } from './dto/create-course.dto';
import { CreateModuleDto } from './dto/create-module.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';

@ApiTags('academy')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('academy')
export class AcademyController {
      constructor(private readonly academyService: AcademyService) { }

      @Post('courses')
      @Roles(Role.TEACHER, Role.ADMIN)
      @ApiOperation({ summary: 'Create a new course' })
      @ApiResponse({ status: 201, description: 'Course created.' })
      createCourse(@CurrentUser() user: any, @Body() dto: CreateCourseDto) {
            return this.academyService.createCourse(user.id, dto);
      }

      @Post('courses/:id/modules')
      @Roles(Role.TEACHER, Role.ADMIN)
      @ApiOperation({ summary: 'Add a module to a course' })
      createModule(@Param('id') courseId: string, @Body() dto: CreateModuleDto) {
            return this.academyService.createModule(courseId, dto);
      }

      @Post('modules/:id/lessons')
      @Roles(Role.TEACHER, Role.ADMIN)
      @ApiOperation({ summary: 'Add a lesson to a module' })
      createLesson(@Param('id') moduleId: string, @Body() dto: CreateLessonDto) {
            return this.academyService.createLesson(moduleId, dto);
      }

      @Get('courses')
      @ApiOperation({ summary: 'List all published courses' })
      @ApiResponse({ status: 200, description: 'Return all courses.' })
      findAll() {
            return this.academyService.findAllCourses();
      }

      @Get('courses/:id')
      @ApiOperation({ summary: 'Get course details by ID' })
      @ApiResponse({ status: 200, description: 'Return course with modules and lessons.' })
      @ApiResponse({ status: 404, description: 'Course not found.' })
      findOne(@Param('id') id: string) {
            return this.academyService.findCourseById(id);
      }
}

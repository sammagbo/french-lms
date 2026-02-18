import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ClassroomService } from './classroom.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { AssignActivityDto } from './dto/assign-activity.dto';
import { GradeSubmissionDto } from './dto/grade-submission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('classroom')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('classroom')
export class ClassroomController {
      constructor(private readonly classroomService: ClassroomService) { }

      @Post('grade')
      @Roles(Role.TEACHER, Role.ADMIN)
      @ApiOperation({ summary: 'Grade a submission' })
      @ApiResponse({ status: 201, description: 'Submission graded.' })
      gradeSubmission(@CurrentUser() user: any, @Body() dto: GradeSubmissionDto) {
            return this.classroomService.gradeSubmission(user.id, dto);
      }

      @Get('teacher/inbox')
      @Roles(Role.TEACHER, Role.ADMIN)
      @ApiOperation({ summary: 'Get pending submissions for grading' })
      @ApiResponse({ status: 200, description: 'List of pending submissions.' })
      getInbox(@CurrentUser() user: any) {
            return this.classroomService.findPendingSubmissions(user.id);
      }

      @Post('assignments')
      @Roles(Role.TEACHER, Role.ADMIN)
      @ApiOperation({ summary: 'Assign an activity to a student' })
      @ApiResponse({ status: 201, description: 'Activity assigned.' })
      assignActivity(@Body() dto: AssignActivityDto) {
            return this.classroomService.assignActivityToStudent(dto);
      }

      @Post('submissions')
      @Roles(Role.STUDENT)
      @ApiOperation({ summary: 'Submit an activity' })
      @ApiResponse({ status: 201, description: 'Submission created.' })
      submit(@CurrentUser() user: any, @Body() createSubmissionDto: CreateSubmissionDto) {
            return this.classroomService.submitActivity(user.id, createSubmissionDto);
      }

      @Get('activities/pending')
      @Roles(Role.STUDENT)
      @ApiOperation({ summary: 'Get pending activities for current student' })
      findPending(@CurrentUser() user: any) {
            return this.classroomService.findPendingActivities(user.id);
      }
}

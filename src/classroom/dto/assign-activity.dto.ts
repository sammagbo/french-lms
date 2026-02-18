import { IsDateString, IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignActivityDto {
      @ApiProperty({ example: 'uuid-of-student' })
      @IsNotEmpty()
      @IsUUID()
      studentId: string;

      @ApiProperty({ example: 'uuid-of-activity' })
      @IsNotEmpty()
      @IsUUID()
      activityId: string;

      @ApiProperty({ example: '2026-12-31T23:59:59Z' })
      @IsNotEmpty()
      @IsDateString()
      dueDate: string; // ISO 8601 date string
}

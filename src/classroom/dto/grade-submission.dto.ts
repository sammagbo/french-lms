import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, IsUrl, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SubmissionStatus } from '@prisma/client';

export class GradeSubmissionDto {
      @ApiProperty({ example: 'uuid-of-submission' })
      @IsNotEmpty()
      @IsUUID()
      submissionId: string;

      @ApiProperty({ example: 8.5, required: false })
      @IsOptional()
      @IsNumber()
      @Min(0)
      @Max(10)
      grade?: number;

      @ApiProperty({ example: 'Great work, but pay attention to...', required: false })
      @IsOptional()
      @IsString()
      feedbackText?: string;

      @ApiProperty({ example: 'https://cdn.example.com/audio/feedback.mp3', required: false })
      @IsOptional()
      @IsUrl()
      audioFeedbackUrl?: string;

      @ApiProperty({ enum: SubmissionStatus, example: SubmissionStatus.GRADED })
      @IsNotEmpty()
      @IsEnum(SubmissionStatus)
      status: SubmissionStatus;
}

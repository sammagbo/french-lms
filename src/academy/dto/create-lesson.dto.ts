import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLessonDto {
      @ApiProperty({ example: 'Lesson 1: Introduction to Subjunctive' })
      @IsNotEmpty()
      @IsString()
      title: string;

      @ApiProperty({ example: 'https://vimeo.com/123456', required: false })
      @IsOptional()
      @IsUrl()
      videoUrl?: string;

      @ApiProperty({ example: '## Notes\n\nThis is the content...', required: false })
      @IsOptional()
      @IsString()
      content?: string;
}

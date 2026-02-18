import { IsNotEmpty, IsOptional, IsString, IsUrl, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// TODO: Implement custom validation to ensure at least one of textContent or attachmentUrl is present.
export class CreateSubmissionDto {
      @ApiProperty({ example: 'uuid-of-activity' })
      @IsNotEmpty()
      @IsUUID()
      activityId: string;

      @ApiProperty({ example: 'Minha resposta em texto...', required: false })
      @IsOptional()
      @IsString()
      textContent?: string;

      @ApiProperty({ example: 'https://mysite.com/homework.pdf', required: false })
      @IsOptional()
      @IsUrl()
      attachmentUrl?: string;
}

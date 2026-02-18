import { IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCourseDto {
      @ApiProperty({ example: 'Advanced French' })
      @IsNotEmpty()
      @IsString()
      title: string;

      @ApiProperty({ example: 'A deep dive into French grammar.', required: false })
      @IsOptional()
      @IsString()
      description?: string;

      @ApiProperty({ example: 99.90, required: false, default: 0 })
      @IsOptional()
      @IsNumber()
      @Min(0)
      price?: number;

      @ApiProperty({ example: 'advanced-french' })
      @IsNotEmpty()
      @IsString()
      slug: string;
}

import { IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePostDto {
      @ApiProperty({ example: 'My first post' })
      @IsNotEmpty()
      @IsString()
      title: string;

      @ApiProperty({ example: 'This is the content of the post.' })
      @IsNotEmpty()
      @IsString()
      content: string;

      @ApiProperty({ example: true, required: false })
      @IsOptional()
      @IsBoolean()
      published?: boolean;
}

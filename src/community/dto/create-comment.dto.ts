import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCommentDto {
      @ApiProperty({ example: 'uuid-of-post' })
      @IsNotEmpty()
      @IsUUID()
      postId: string;

      @ApiProperty({ example: 'Great post!' })
      @IsNotEmpty()
      @IsString()
      content: string;
}

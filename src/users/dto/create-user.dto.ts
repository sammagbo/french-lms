import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
      @ApiProperty({ example: 'johndoe@example.com' })
      @IsEmail()
      email: string;

      @ApiProperty({ example: 'password123', minLength: 6 })
      @IsString()
      @MinLength(6)
      password: string;

      @ApiProperty({ example: 'John Doe' })
      @IsString()
      @IsNotEmpty()
      fullName: string;
}

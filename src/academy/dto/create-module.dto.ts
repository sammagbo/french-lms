import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateModuleDto {
      @ApiProperty({ example: 'Module 1: Subjunctive Mode' })
      @IsNotEmpty()
      @IsString()
      title: string;
}

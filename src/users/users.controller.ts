import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
      constructor(private readonly usersService: UsersService) { }

      @Post()
      @ApiOperation({ summary: 'Create user' })
      @ApiResponse({ status: 201, description: 'The user has been successfully created.' })
      create(@Body() createUserDto: CreateUserDto) {
            return this.usersService.create(createUserDto);
      }

      @Get('me')
      @UseGuards(JwtAuthGuard)
      @ApiOperation({ summary: 'Get current user profile' })
      getProfile(@CurrentUser() user: any) {
            return user;
      }

      @Get()
      @UseGuards(JwtAuthGuard, RolesGuard)
      @Roles(Role.ADMIN)
      @ApiOperation({ summary: 'Get all users (Admin only)' })
      findAll() {
            return this.usersService.findAll();
      }

      @Get(':id')
      @UseGuards(JwtAuthGuard)
      @ApiOperation({ summary: 'Get user by id' })
      @ApiResponse({ status: 200, description: 'Return the user.' })
      findOne(@Param('id') id: string) {
            return this.usersService.findOne(id);
      }
}

import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { Throttle } from '@nestjs/throttler';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
      constructor(private authService: AuthService) { }

      @Throttle({ default: { limit: 5, ttl: 60000 } })
      @Post('login')
      @ApiOperation({ summary: 'User login' })
      @ApiResponse({ status: 200, description: 'Return access token.' })
      @ApiResponse({ status: 401, description: 'Unauthorized.' })
      async login(@Body() loginDto: LoginDto) {
            const user = await this.authService.validateUser(loginDto.email, loginDto.password);
            if (!user) {
                  throw new UnauthorizedException('Invalid credentials');
            }
            return this.authService.login(user);
      }
}

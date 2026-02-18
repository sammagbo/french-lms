import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthController } from './auth.controller';

@Module({
      imports: [
            UsersModule,
            PassportModule,
            JwtModule.register({
                  secret: 'SUPER_SECRET_KEY', // TODO: Use environment variable aka process.env.JWT_SECRET
                  signOptions: { expiresIn: '1d' },
            }),
      ],
      controllers: [AuthController],
      providers: [AuthService, JwtStrategy],
      exports: [AuthService],
})
export class AuthModule { }

import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AcademyModule } from './academy/academy.module';
import { ClassroomModule } from './classroom/classroom.module';
import { CommunityModule } from './community/community.module';

@Module({
      imports: [
            ConfigModule.forRoot({ isGlobal: true }),
            ThrottlerModule.forRootAsync({
                  imports: [ConfigModule],
                  inject: [ConfigService],
                  useFactory: (config: ConfigService) => ({
                        throttlers: [{
                              ttl: 60000,
                              limit: 10,
                        }],
                        // storage: new ThrottlerStorageRedisService(config.get('REDIS_URL')),
                  }),
            }),
            PrismaModule,
            UsersModule,
            AuthModule,
            AcademyModule,
            ClassroomModule,
            CommunityModule
      ],
      providers: [
            {
                  provide: APP_GUARD,
                  useClass: ThrottlerGuard,
            },
      ],
})
export class AppModule { }

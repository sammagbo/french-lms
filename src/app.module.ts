import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AcademyModule } from './academy/academy.module';
import { ClassroomModule } from './classroom/classroom.module';
import { CommunityModule } from './community/community.module';
import { DevModule } from './dev/dev.module';
import { CacheModule } from '@nestjs/cache-manager';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
      imports: [
            // ─── Validação Rigorosa do Ambiente ───
            ConfigModule.forRoot({
                  isGlobal: true,
                  validationSchema: Joi.object({
                        // Obrigatórias — servidor NÃO inicia sem elas
                        DATABASE_URL: Joi.string().required().description('URL de conexão do PostgreSQL'),
                        JWT_SECRET: Joi.string().required().min(16).description('Chave secreta do JWT (mín. 16 caracteres)'),
                        FRONTEND_URL: Joi.string().required().description('URL do frontend para CORS (aceita valores separados por vírgula)'),

                        // Opcionais com defaults seguros
                        PORT: Joi.number().default(3000).description('Porta do servidor'),
                        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
                  }),
                  validationOptions: {
                        abortEarly: false, // Mostra TODOS os erros de uma vez
                        allowUnknown: true, // Permite variáveis extras no .env
                  },
            }),
            ThrottlerModule.forRootAsync({
                  imports: [ConfigModule],
                  useFactory: (config: ConfigService) => ({
                        throttlers: [{
                              ttl: 60000,
                              limit: 10,
                        }],
                  }),
            }),
            CacheModule.register({
                  isGlobal: true, // Make CacheModule globally available
                  ttl: 5 * 60 * 1000, // Default TTL 5 minutes in milliseconds
                  max: 100, // Maximum number of items in cache
            }),
            PrismaModule,
            UsersModule,
            AuthModule,
            AcademyModule,
            ClassroomModule,
            CommunityModule,
            DevModule,
            AnalyticsModule,
      ],
      providers: [
            {
                  provide: APP_GUARD,
                  useClass: ThrottlerGuard,
            },
      ],
})
export class AppModule { }


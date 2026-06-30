import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as Joi from 'joi';
import { getTypeOrmOptions } from './database/typeorm.options';
import { BracketModule } from './bracket/bracket.module';
import { FixturesModule } from './fixtures/fixtures.module';
import { HealthModule } from './health/health.module';
import { MatchSummaryModule } from './match-summary/match-summary.module';
import { NotificationsModule } from './notifications/notifications.module';
import { StandingsModule } from './standings/standings.module';
import { TeamsModule } from './teams/teams.module';
import { UserModule } from './users/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        DATABASE_URL: Joi.string().required(),
        DATABASE_SSL: Joi.boolean().default(false),
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3000),
        CORS_ORIGIN: Joi.string().default('http://localhost:5173'),
        VAPID_PUBLIC_KEY: Joi.string().optional(),
        VAPID_PRIVATE_KEY: Joi.string().optional(),
        VAPID_SUBJECT: Joi.string().optional(),
        CRON_SECRET: Joi.string().optional(),
        ESPN_WC_DATE_RANGE: Joi.string().optional(),
        ESPN_LEAGUE_SLUG: Joi.string().optional(),
        ESPN_FETCH_LIMIT: Joi.number().integer().min(1).optional(),
        CRON_SLACK_MINUTES: Joi.number().integer().min(1).optional(),
        APP_BASE_URL: Joi.string().uri().optional(),
      }),
      validationOptions: { allowUnknown: true, abortEarly: false },
    }),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 30 }]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        getTypeOrmOptions(configService.get<string>('DATABASE_URL')),
    }),
    FixturesModule,
    BracketModule,
    HealthModule,
    MatchSummaryModule,
    TeamsModule,
    UserModule,
    NotificationsModule,
    StandingsModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}

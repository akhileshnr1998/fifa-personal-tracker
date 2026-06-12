import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

@Injectable()
export class CronSecretGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const expectedSecret = this.configService.get<string>('CRON_SECRET');
    const providedSecret = request.headers['x-cron-secret'];

    if (!expectedSecret || providedSecret !== expectedSecret) {
      throw new UnauthorizedException('Invalid cron secret.');
    }

    return true;
  }
}

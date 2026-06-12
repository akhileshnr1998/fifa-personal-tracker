import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import webpush, { WebPushError } from 'web-push';
import { PushSubscriptionJson } from '../users/entities/user.entity';

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/**
 * Thrown by sendPush() when the push endpoint returns 410 Gone or 404 Not Found.
 * Callers must catch this and clear the stored subscription for that user so dead
 * endpoints do not accumulate in the DB.
 */
export class ExpiredSubscriptionError extends Error {
  constructor() {
    super('Push subscription has expired or is no longer valid');
    this.name = 'ExpiredSubscriptionError';
  }
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private vapidConfigured = false;

  constructor(private readonly configService: ConfigService) {
    const publicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');
    const subject =
      this.configService.get<string>('VAPID_SUBJECT') ??
      'mailto:wc2026@example.com';

    if (publicKey && privateKey) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.vapidConfigured = true;
    } else {
      this.logger.warn(
        'VAPID keys not configured — push notifications are disabled.',
      );
    }
  }

  isConfigured(): boolean {
    return this.vapidConfigured;
  }

  async sendPush(
    subscription: PushSubscriptionJson,
    payload: PushPayload,
  ): Promise<void> {
    if (!this.vapidConfigured) {
      return;
    }

    try {
      await webpush.sendNotification(subscription, JSON.stringify(payload));
    } catch (error) {
      if (
        error instanceof WebPushError &&
        (error.statusCode === 410 || error.statusCode === 404)
      ) {
        throw new ExpiredSubscriptionError();
      }
      throw error;
    }
  }
}

export interface PushSubscriptionDto {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export class SaveSettingsDto {
  userName!: string;
  teams!: string[];
  pushNotificationsEnabled!: boolean;
  reminderMinutesBefore?: number;
  subscription?: PushSubscriptionDto | null;
}

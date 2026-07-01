export type NotificationKind = 'bid' | 'auction' | 'system' | 'asset';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  kind: NotificationKind;
}

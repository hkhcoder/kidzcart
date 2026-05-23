export interface AppNotification {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  meta?: Record<string, unknown>;
  createdAt: string;
}

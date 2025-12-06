import { httpClient } from './httpclient';
import type {
  Notification,
  NotificationsResponse,
  DeleteResponse,
} from '../types/interfaces';

const ENDPOINTS = {
  base: '/notifications',
  me: '/notifications/me',
  byId: (id: string) => `/notifications/${id}`,
  read: (id: string) => `/notifications/${id}/read`,
  readAll: '/notifications/read-all',
  stats: '/notifications/stats',
};

class NotificationsService {
  async getMyNotifications(options?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }): Promise<NotificationsResponse> {
    const params = new URLSearchParams();

    if (options) {
      if (options.limit) params.append('limit', String(options.limit));
      if (options.offset) params.append('offset', String(options.offset));
      if (options.unreadOnly) params.append('unreadOnly', 'true');
    }

    const queryString = params.toString();
    const url = queryString ? `${ENDPOINTS.me}?${queryString}` : ENDPOINTS.me;

    return httpClient.get<NotificationsResponse>(url);
  }

  async getById(id: string): Promise<Notification> {
    return httpClient.get<Notification>(ENDPOINTS.byId(id));
  }

  async markAsRead(id: string): Promise<Notification> {
    return httpClient.patch<Notification>(ENDPOINTS.read(id));
  }

  async markAllAsRead(): Promise<{ count: number }> {
    return httpClient.patch<{ count: number }>(ENDPOINTS.readAll);
  }

  async delete(id: string): Promise<DeleteResponse> {
    return httpClient.delete<DeleteResponse>(ENDPOINTS.byId(id));
  }

  async getStats(): Promise<{
    total: number;
    unread: number;
    byType: Record<string, number>;
    byChannel: Record<string, number>;
    byStatus: Record<string, number>;
  }> {
    return httpClient.get(ENDPOINTS.stats);
  }

  // Get unread count only
  async getUnreadCount(): Promise<number> {
    const response = await this.getMyNotifications({ limit: 1 });
    return response.unread;
  }
}

export const notificationsService = new NotificationsService();
export default notificationsService;

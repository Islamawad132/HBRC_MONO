import { io, Socket } from 'socket.io-client';
import type { Notification } from '../types/interfaces';

type NotificationCallback = (notification: Notification) => void;
type UnreadCountCallback = (count: number) => void;
type ConnectionCallback = (data: { userId: string; userType: string }) => void;

class SocketService {
  private socket: Socket | null = null;
  private notificationCallbacks: NotificationCallback[] = [];
  private unreadCountCallbacks: UnreadCountCallback[] = [];
  private connectionCallbacks: ConnectionCallback[] = [];
  private isConnecting = false;

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.socket?.connected || this.isConnecting) {
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) {
      console.warn('No access token found, cannot connect to WebSocket');
      return;
    }

    this.isConnecting = true;

    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    this.socket = io(`${baseUrl}/notifications`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.isConnecting = false;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      this.isConnecting = false;
    });

    // Custom events
    this.socket.on('connected', (data: { userId: string; userType: string }) => {
      console.log('Authenticated to notifications:', data);
      this.connectionCallbacks.forEach((cb) => cb(data));
    });

    this.socket.on('notification', (notification: Notification) => {
      console.log('New notification received:', notification);
      this.notificationCallbacks.forEach((cb) => cb(notification));
    });

    this.socket.on('unreadCount', (data: { count: number }) => {
      console.log('Unread count updated:', data.count);
      this.unreadCountCallbacks.forEach((cb) => cb(data.count));
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
  }

  /**
   * Reconnect with new token
   */
  reconnect(): void {
    this.disconnect();
    this.connect();
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Subscribe to new notifications
   */
  onNotification(callback: NotificationCallback): () => void {
    this.notificationCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      this.notificationCallbacks = this.notificationCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  /**
   * Subscribe to unread count updates
   */
  onUnreadCount(callback: UnreadCountCallback): () => void {
    this.unreadCountCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      this.unreadCountCallbacks = this.unreadCountCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  /**
   * Subscribe to connection events
   */
  onConnection(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.push(callback);

    // Return unsubscribe function
    return () => {
      this.connectionCallbacks = this.connectionCallbacks.filter(
        (cb) => cb !== callback
      );
    };
  }

  /**
   * Notify server that notification was read (for logging)
   */
  markAsRead(notificationId: string): void {
    if (this.socket?.connected) {
      this.socket.emit('markAsRead', { notificationId });
    }
  }

  /**
   * Ping server (for keep-alive)
   */
  ping(): Promise<{ event: string; timestamp: string }> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('ping', (response: { event: string; timestamp: string }) => {
        resolve(response);
      });
    });
  }
}

export const socketService = new SocketService();
export default socketService;

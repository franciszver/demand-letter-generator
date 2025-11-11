import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL;

export class WebSocketService {
  private socket: Socket | null = null;
  private token: string | null = null;

  connect(token: string): void {
    // Only connect if WebSocket URL is configured
    if (!WS_URL) {
      console.warn('WebSocket URL not configured. Real-time collaboration disabled.');
      return;
    }

    this.token = token;
    try {
      this.socket = io(WS_URL, {
        auth: { token },
        transports: ['websocket'],
      });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

      this.socket.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    } catch (error) {
      console.warn('Failed to connect WebSocket:', error);
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinDraft(draftLetterId: string): void {
    if (this.socket && this.isConnected()) {
      this.socket.emit('join-draft', draftLetterId);
    }
  }

  onUserJoined(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('user-joined', callback);
    }
  }

  onUserLeft(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('user-left', callback);
    }
  }

  onUsersList(callback: (users: any[]) => void): void {
    if (this.socket) {
      this.socket.on('users-list', callback);
    }
  }

  onContentUpdated(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('content-updated', callback);
    }
  }

  onUserCursor(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('user-cursor', callback);
    }
  }

  sendContentChange(draftLetterId: string, content: string, change: any): void {
    if (this.socket && this.isConnected()) {
      this.socket.emit('content-change', { draftLetterId, content, change });
    }
  }

  sendCursorPosition(draftLetterId: string, position: any): void {
    if (this.socket && this.isConnected()) {
      this.socket.emit('cursor-position', { draftLetterId, position });
    }
  }

  off(event: string, callback?: (...args: any[]) => void): void {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }
}

export const wsService = new WebSocketService();


import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { SessionModel } from '../models/Session';
import { UserModel } from '../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface CollaborationUser {
  id: string;
  email: string;
  name: string;
  role: string;
}

export interface CollaborationSession {
  draftLetterId: string;
  users: Map<string, CollaborationUser>;
}

export class CollaborationService {
  private io: SocketIOServer;
  private sessions: Map<string, CollaborationSession> = new Map();

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware(): void {
    // Authenticate socket connections
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication error: No token'));
        }

        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
        const user = await UserModel.findById(decoded.userId);

        if (!user) {
          return next(new Error('Authentication error: User not found'));
        }

        socket.data.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };

        next();
      } catch (error) {
        next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket) => {
      const user = socket.data.user as CollaborationUser;
      console.log(`User connected: ${user.email}`);

      // Join draft letter session
      socket.on('join-draft', async (draftLetterId: string) => {
        try {
          socket.join(`draft:${draftLetterId}`);

          // Get or create session
          let session = this.sessions.get(draftLetterId);
          if (!session) {
            session = {
              draftLetterId,
              users: new Map(),
            };
            this.sessions.set(draftLetterId, session);
          }

          // Add user to session
          session.users.set(user.id, user);

          // Create or update database session
          await SessionModel.create({
            draftLetterId,
            userId: user.id,
            isActive: true,
            lastActivity: new Date().toISOString(),
          });

          // Notify others in the room
          socket.to(`draft:${draftLetterId}`).emit('user-joined', {
            userId: user.id,
            name: user.name,
            email: user.email,
          });

          // Send current users to the new user
          socket.emit('users-list', Array.from(session.users.values()));

          console.log(`User ${user.email} joined draft ${draftLetterId}`);
        } catch (error) {
          console.error('Join draft error:', error);
          socket.emit('error', { message: 'Failed to join draft' });
        }
      });

      // Handle content changes
      socket.on('content-change', async (data: { draftLetterId: string; content: string; change: any }) => {
        try {
          const { draftLetterId, content, change } = data;

          // Update activity
          const sessions = await SessionModel.findByDraftLetterId(draftLetterId);
          const userSession = sessions.find(s => s.userId === user.id);
          if (userSession) {
            await SessionModel.updateActivity(userSession.id);
          }

          // Broadcast to others in the room
          socket.to(`draft:${draftLetterId}`).emit('content-updated', {
            userId: user.id,
            userName: user.name,
            content,
            change,
            timestamp: new Date().toISOString(),
          });
        } catch (error) {
          console.error('Content change error:', error);
          socket.emit('error', { message: 'Failed to broadcast change' });
        }
      });

      // Handle cursor position
      socket.on('cursor-position', (data: { draftLetterId: string; position: any }) => {
        const { draftLetterId, position } = data;
        socket.to(`draft:${draftLetterId}`).emit('user-cursor', {
          userId: user.id,
          userName: user.name,
          position,
        });
      });

      // Handle disconnect
      socket.on('disconnect', async () => {
        console.log(`User disconnected: ${user.email}`);

        // Find and remove user from sessions
        for (const [draftLetterId, session] of this.sessions.entries()) {
          if (session.users.has(user.id)) {
            session.users.delete(user.id);

            // Deactivate database session
            const sessions = await SessionModel.findByDraftLetterId(draftLetterId);
            const userSession = sessions.find(s => s.userId === user.id);
            if (userSession) {
              await SessionModel.deactivate(userSession.id);
            }

            // Notify others
            socket.to(`draft:${draftLetterId}`).emit('user-left', {
              userId: user.id,
              name: user.name,
            });

            // Clean up empty sessions
            if (session.users.size === 0) {
              this.sessions.delete(draftLetterId);
            }
          }
        }
      });
    });
  }

  public getIO(): SocketIOServer {
    return this.io;
  }
}


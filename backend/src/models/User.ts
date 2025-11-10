import { db } from '../config/database';
import { User } from '../../../shared/types';

export class UserModel {
  static async create(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { passwordHash: string }): Promise<User> {
    const [user] = await db('users')
      .insert({
        email: userData.email,
        password_hash: userData.passwordHash,
        name: userData.name,
        role: userData.role,
      })
      .returning('*');
    
    return this.mapToUser(user);
  }

  static async findByEmail(email: string): Promise<User & { passwordHash: string } | null> {
    const user = await db('users').where({ email }).first();
    if (!user) return null;
    
    return {
      ...this.mapToUser(user),
      passwordHash: user.password_hash,
    };
  }

  static async findById(id: string): Promise<User | null> {
    const user = await db('users').where({ id }).first();
    if (!user) return null;
    
    return this.mapToUser(user);
  }

  static async update(id: string, updates: Partial<User>): Promise<User | null> {
    const [user] = await db('users')
      .where({ id })
      .update({
        ...(updates.email && { email: updates.email }),
        ...(updates.name && { name: updates.name }),
        ...(updates.role && { role: updates.role }),
        updated_at: new Date(),
      })
      .returning('*');
    
    if (!user) return null;
    return this.mapToUser(user);
  }

  private static mapToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }
}


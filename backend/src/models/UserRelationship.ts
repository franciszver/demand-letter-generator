import { db } from '../config/database';
import { UserRelationship } from '../../../shared/types';

export class UserRelationshipModel {
  static async create(relationshipData: Omit<UserRelationship, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserRelationship> {
    const [relationship] = await db('user_relationships')
      .insert({
        primary_user_id: relationshipData.primaryUserId,
        secondary_user_id: relationshipData.secondaryUserId,
        status: relationshipData.status,
      })
      .returning('*');
    
    return this.mapToUserRelationship(relationship);
  }

  static async findByPrimaryUserId(primaryUserId: string): Promise<UserRelationship[]> {
    const relationships = await db('user_relationships')
      .where({ primary_user_id: primaryUserId, status: 'active' })
      .orderBy('created_at', 'desc');
    
    return relationships.map(this.mapToUserRelationship);
  }

  static async findBySecondaryUserId(secondaryUserId: string): Promise<UserRelationship[]> {
    const relationships = await db('user_relationships')
      .where({ secondary_user_id: secondaryUserId, status: 'active' })
      .orderBy('created_at', 'desc');
    
    return relationships.map(this.mapToUserRelationship);
  }

  static async findRelationship(primaryUserId: string, secondaryUserId: string): Promise<UserRelationship | null> {
    const relationship = await db('user_relationships')
      .where({ primary_user_id: primaryUserId, secondary_user_id: secondaryUserId })
      .first();
    
    if (!relationship) return null;
    return this.mapToUserRelationship(relationship);
  }

  static async update(id: string, updates: Partial<UserRelationship>): Promise<UserRelationship | null> {
    const [relationship] = await db('user_relationships')
      .where({ id })
      .update({
        ...(updates.status && { status: updates.status }),
        updated_at: new Date(),
      })
      .returning('*');
    
    if (!relationship) return null;
    return this.mapToUserRelationship(relationship);
  }

  static async deactivate(primaryUserId: string, secondaryUserId: string): Promise<UserRelationship | null> {
    const relationship = await this.findRelationship(primaryUserId, secondaryUserId);
    if (!relationship) return null;
    return this.update(relationship.id, { status: 'inactive' });
  }

  private static mapToUserRelationship(row: any): UserRelationship {
    return {
      id: row.id,
      primaryUserId: row.primary_user_id,
      secondaryUserId: row.secondary_user_id,
      status: row.status,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }
}


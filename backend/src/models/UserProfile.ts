import { db } from '../config/database';
import { UserProfile } from '../../../shared/types';

export class UserProfileModel {
  static async create(profileData: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserProfile> {
    const [profile] = await db('user_profiles')
      .insert({
        user_id: profileData.userId,
        communication_style: profileData.communicationStyle,
        preferred_tone: profileData.preferredTone,
        formality_level: profileData.formalityLevel,
        urgency_tendency: profileData.urgencyTendency,
        empathy_preference: profileData.empathyPreference,
        notes: profileData.notes,
      })
      .returning('*');
    
    return this.mapToUserProfile(profile);
  }

  static async findByUserId(userId: string): Promise<UserProfile | null> {
    const profile = await db('user_profiles').where({ user_id: userId }).first();
    if (!profile) return null;
    return this.mapToUserProfile(profile);
  }

  static async update(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
    const [profile] = await db('user_profiles')
      .where({ user_id: userId })
      .update({
        ...(updates.communicationStyle !== undefined && { communication_style: updates.communicationStyle }),
        ...(updates.preferredTone !== undefined && { preferred_tone: updates.preferredTone }),
        ...(updates.formalityLevel !== undefined && { formality_level: updates.formalityLevel }),
        ...(updates.urgencyTendency !== undefined && { urgency_tendency: updates.urgencyTendency }),
        ...(updates.empathyPreference !== undefined && { empathy_preference: updates.empathyPreference }),
        ...(updates.notes !== undefined && { notes: updates.notes }),
        updated_at: new Date(),
      })
      .returning('*');
    
    if (!profile) return null;
    return this.mapToUserProfile(profile);
  }

  static async upsert(profileData: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserProfile> {
    const existing = await this.findByUserId(profileData.userId);
    if (existing) {
      const updated = await this.update(profileData.userId, profileData);
      return updated || existing;
    }
    return this.create(profileData);
  }

  private static mapToUserProfile(row: any): UserProfile {
    return {
      id: row.id,
      userId: row.user_id,
      communicationStyle: row.communication_style,
      preferredTone: row.preferred_tone,
      formalityLevel: row.formality_level,
      urgencyTendency: row.urgency_tendency,
      empathyPreference: row.empathy_preference,
      notes: row.notes,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }
}


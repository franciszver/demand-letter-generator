import { db } from '../config/database';
import { CaseContext } from '../../../shared/types';

export class CaseContextModel {
  static async create(contextData: Omit<CaseContext, 'id' | 'createdAt' | 'updatedAt'>): Promise<CaseContext> {
    const [context] = await db('case_context')
      .insert({
        draft_letter_id: contextData.draftLetterId,
        user_id: contextData.userId,
        relationship_dynamics: contextData.relationshipDynamics,
        urgency_level: contextData.urgencyLevel,
        previous_interactions: contextData.previousInteractions,
        case_sensitivity: contextData.caseSensitivity,
        target_recipient_role: contextData.targetRecipientRole,
        target_recipient_org: contextData.targetRecipientOrg,
        target_relationship: contextData.targetRelationship,
      })
      .returning('*');
    
    return this.mapToCaseContext(context);
  }

  static async findByDraftLetterId(draftLetterId: string): Promise<CaseContext | null> {
    const context = await db('case_context')
      .where({ draft_letter_id: draftLetterId })
      .first();
    
    if (!context) return null;
    return this.mapToCaseContext(context);
  }

  static async update(draftLetterId: string, updates: Partial<CaseContext>): Promise<CaseContext | null> {
    const [context] = await db('case_context')
      .where({ draft_letter_id: draftLetterId })
      .update({
        ...(updates.relationshipDynamics !== undefined && { relationship_dynamics: updates.relationshipDynamics }),
        ...(updates.urgencyLevel !== undefined && { urgency_level: updates.urgencyLevel }),
        ...(updates.previousInteractions !== undefined && { previous_interactions: updates.previousInteractions }),
        ...(updates.caseSensitivity !== undefined && { case_sensitivity: updates.caseSensitivity }),
        ...(updates.targetRecipientRole !== undefined && { target_recipient_role: updates.targetRecipientRole }),
        ...(updates.targetRecipientOrg !== undefined && { target_recipient_org: updates.targetRecipientOrg }),
        ...(updates.targetRelationship !== undefined && { target_relationship: updates.targetRelationship }),
        updated_at: new Date(),
      })
      .returning('*');
    
    if (!context) return null;
    return this.mapToCaseContext(context);
  }

  private static mapToCaseContext(row: any): CaseContext {
    return {
      id: row.id,
      draftLetterId: row.draft_letter_id,
      userId: row.user_id,
      relationshipDynamics: row.relationship_dynamics,
      urgencyLevel: row.urgency_level,
      previousInteractions: row.previous_interactions,
      caseSensitivity: row.case_sensitivity,
      targetRecipientRole: row.target_recipient_role,
      targetRecipientOrg: row.target_recipient_org,
      targetRelationship: row.target_relationship,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }
}


import { db } from '../config/database';
import { DraftLetter } from '../../../shared/types';

export class DraftLetterModel {
  static async create(draftData: Omit<DraftLetter, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<DraftLetter> {
    const [draft] = await db('draft_letters')
      .insert({
        user_id: draftData.userId,
        document_id: draftData.documentId || null,
        template_id: draftData.templateId || null,
        title: draftData.title,
        content_summary: draftData.content.substring(0, 500),
        s3_key: draftData.s3Key,
        version: 1,
        status: draftData.status,
      })
      .returning('*');
    
    return this.mapToDraftLetter(draft);
  }

  static async findById(id: string): Promise<DraftLetter | null> {
    const draft = await db('draft_letters').where({ id }).first();
    if (!draft) return null;
    return this.mapToDraftLetter(draft);
  }

  static async findByUserId(userId: string): Promise<DraftLetter[]> {
    const drafts = await db('draft_letters')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc');
    return drafts.map(this.mapToDraftLetter);
  }

  static async update(id: string, updates: Partial<DraftLetter>): Promise<DraftLetter | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const [draft] = await db('draft_letters')
      .where({ id })
      .update({
        ...(updates.title && { title: updates.title }),
        ...(updates.content && { content_summary: updates.content.substring(0, 500) }),
        ...(updates.s3Key && { s3_key: updates.s3Key }),
        ...(updates.status && { status: updates.status }),
        version: existing.version + 1,
        updated_at: new Date(),
      })
      .returning('*');
    
    if (!draft) return null;
    return this.mapToDraftLetter(draft);
  }

  private static mapToDraftLetter(row: any): DraftLetter {
    return {
      id: row.id,
      userId: row.user_id,
      documentId: row.document_id,
      templateId: row.template_id,
      title: row.title,
      content: row.content_summary || '', // Full content from S3
      s3Key: row.s3_key,
      version: row.version,
      status: row.status,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }
}


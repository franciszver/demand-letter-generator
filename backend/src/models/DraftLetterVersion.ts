import { db } from '../config/database';

export interface DraftLetterVersion {
  id: string;
  draftLetterId: string;
  versionNumber: number;
  content: string;
  s3Key: string | null;
  createdBy: string | null;
  changeSummary: string | null;
  createdAt: string;
  updatedAt: string;
}

export class DraftLetterVersionModel {
  static async create(versionData: Omit<DraftLetterVersion, 'id' | 'createdAt' | 'updatedAt'>): Promise<DraftLetterVersion> {
    const [version] = await db('draft_letter_versions')
      .insert({
        draft_letter_id: versionData.draftLetterId,
        version_number: versionData.versionNumber,
        content: versionData.content,
        s3_key: versionData.s3Key,
        created_by: versionData.createdBy,
        change_summary: versionData.changeSummary,
      })
      .returning('*');
    
    return this.mapToVersion(version);
  }

  static async findByDraftLetterId(draftLetterId: string): Promise<DraftLetterVersion[]> {
    const versions = await db('draft_letter_versions')
      .where({ draft_letter_id: draftLetterId })
      .orderBy('version_number', 'desc');
    return versions.map(this.mapToVersion);
  }

  static async findByVersion(draftLetterId: string, versionNumber: number): Promise<DraftLetterVersion | null> {
    const version = await db('draft_letter_versions')
      .where({ draft_letter_id: draftLetterId, version_number: versionNumber })
      .first();
    if (!version) return null;
    return this.mapToVersion(version);
  }

  static async getLatestVersion(draftLetterId: string): Promise<DraftLetterVersion | null> {
    const version = await db('draft_letter_versions')
      .where({ draft_letter_id: draftLetterId })
      .orderBy('version_number', 'desc')
      .first();
    if (!version) return null;
    return this.mapToVersion(version);
  }

  private static mapToVersion(row: any): DraftLetterVersion {
    return {
      id: row.id,
      draftLetterId: row.draft_letter_id,
      versionNumber: row.version_number,
      content: row.content,
      s3Key: row.s3_key,
      createdBy: row.created_by,
      changeSummary: row.change_summary,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }
}


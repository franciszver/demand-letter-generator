import { db } from '../config/database';
import { DraftLetterModel } from '../models/DraftLetter';
import { uploadToS3 } from '../config/s3';

const PROCESSED_BUCKET = process.env.S3_BUCKET_PROCESSED || 'demand-letter-generator-dev-processed';

export interface ConflictCheckResult {
  success: boolean;
  newVersion: number;
  conflict?: boolean;
  currentVersion?: number;
  serverContent?: string;
  draft?: any;
}

export class ConflictResolver {
  /**
   * Save draft with version-based conflict checking
   * Returns conflict information if versions don't match
   */
  static async saveWithConflictCheck(
    draftId: string,
    content: string,
    userId: string,
    expectedVersion: number
  ): Promise<ConflictCheckResult> {
    // Get current draft from database
    const currentDraft = await db('draft_letters').where({ id: draftId }).first();
    
    if (!currentDraft) {
      throw new Error('Draft not found');
    }

    // Check if version matches
    if (currentDraft.version !== expectedVersion) {
      // Conflict detected - get server content from S3
      let serverContent = '';
      if (currentDraft.s3_key) {
        try {
          const { DocumentProcessor } = await import('./document-processor');
          serverContent = await DocumentProcessor.getProcessedText(currentDraft.s3_key);
        } catch (error) {
          console.warn('Failed to fetch server content from S3:', error);
          serverContent = currentDraft.content_summary || '';
        }
      } else {
        serverContent = currentDraft.content_summary || '';
      }
      
      // If server content is still empty or too short, try to get from database
      if (!serverContent || serverContent.length < 10) {
        serverContent = currentDraft.content_summary || 'Content not available';
      }

      return {
        success: false,
        conflict: true,
        currentVersion: currentDraft.version,
        serverContent,
        newVersion: currentDraft.version,
      };
    }

    // Version matches - proceed with update
    // Store content in S3
    const letterS3Key = `letters/${userId}/${Date.now()}-${draftId}.txt`;
    await uploadToS3(PROCESSED_BUCKET, letterS3Key, content, 'text/plain');

    // Update draft with version check in WHERE clause
    const [updated] = await db('draft_letters')
      .where({ id: draftId, version: expectedVersion })
      .update({
        content_summary: content.substring(0, 500),
        s3_key: letterS3Key,
        version: expectedVersion + 1,
        last_modified_by: userId,
        last_modified_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');

    if (!updated) {
      // Another update happened between our check and update
      // Get latest version
      const latestDraft = await db('draft_letters').where({ id: draftId }).first();
      let serverContent = '';
      if (latestDraft.s3_key) {
        try {
          const { DocumentProcessor } = await import('./document-processor');
          serverContent = await DocumentProcessor.getProcessedText(latestDraft.s3_key);
        } catch (error) {
          serverContent = latestDraft.content_summary || '';
        }
      } else {
        serverContent = latestDraft.content_summary || '';
      }
      
      // If server content is still empty or too short, try to get from database
      if (!serverContent || serverContent.length < 10) {
        serverContent = latestDraft.content_summary || 'Content not available';
      }

      return {
        success: false,
        conflict: true,
        currentVersion: latestDraft.version,
        serverContent,
        newVersion: latestDraft.version,
      };
    }

    // Success - return updated draft
    const draft = await DraftLetterModel.findById(draftId);
    return {
      success: true,
      newVersion: updated.version,
      conflict: false,
      draft,
    };
  }

  /**
   * Simple merge detection: check if edits are in different sections
   * Returns true if edits can be auto-merged (different sections)
   */
  static canAutoMerge(localContent: string, serverContent: string, localEditRange?: { start: number; end: number }): boolean {
    // Simple heuristic: if content lengths are similar and most content matches,
    // edits are likely in different sections
    const lengthDiff = Math.abs(localContent.length - serverContent.length);
    const avgLength = (localContent.length + serverContent.length) / 2;
    
    // If length difference is less than 10% of average, likely non-overlapping edits
    if (lengthDiff / avgLength < 0.1) {
      return true;
    }

    // If we have edit range info, check if edits are far apart
    // For now, use simple length-based heuristic
    // More sophisticated diff algorithm can be added later
    return lengthDiff < 100; // Small changes likely non-conflicting
  }
}


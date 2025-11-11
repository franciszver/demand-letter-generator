import { db } from '../config/database';
import { RefinementHistory } from '../../../shared/types';

export class RefinementHistoryModel {
  static async create(historyData: Omit<RefinementHistory, 'id' | 'createdAt' | 'updatedAt'>): Promise<RefinementHistory> {
    const [history] = await db('refinement_history')
      .insert({
        draft_letter_id: historyData.draftLetterId,
        user_id: historyData.userId,
        prompt_text: historyData.promptText,
        response_text: historyData.responseText,
        version: historyData.version,
        metrics_before: historyData.metricsBefore ? JSON.stringify(historyData.metricsBefore) : null,
        metrics_after: historyData.metricsAfter ? JSON.stringify(historyData.metricsAfter) : null,
      })
      .returning('*');
    
    return this.mapToRefinementHistory(history);
  }

  static async findByDraftLetterId(draftLetterId: string): Promise<RefinementHistory[]> {
    const histories = await db('refinement_history')
      .where({ draft_letter_id: draftLetterId })
      .orderBy('version', 'asc');
    
    return histories.map(this.mapToRefinementHistory);
  }

  static async findById(id: string): Promise<RefinementHistory | null> {
    const history = await db('refinement_history').where({ id }).first();
    if (!history) return null;
    return this.mapToRefinementHistory(history);
  }

  private static mapToRefinementHistory(row: any): RefinementHistory {
    return {
      id: row.id,
      draftLetterId: row.draft_letter_id,
      userId: row.user_id,
      promptText: row.prompt_text,
      responseText: row.response_text,
      version: row.version,
      metricsBefore: row.metrics_before ? JSON.parse(row.metrics_before) : undefined,
      metricsAfter: row.metrics_after ? JSON.parse(row.metrics_after) : undefined,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }
}


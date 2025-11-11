import { db } from '../config/database';
import { LetterMetrics } from '../../../shared/types';

export class LetterMetricsModel {
  static async create(metricsData: Omit<LetterMetrics, 'id' | 'createdAt' | 'updatedAt' | 'calculatedAt'>): Promise<LetterMetrics> {
    const [metrics] = await db('letter_metrics')
      .insert({
        draft_letter_id: metricsData.draftLetterId,
        intensity: metricsData.intensity,
        seriousness: metricsData.seriousness,
        formality: metricsData.formality,
        clarity: metricsData.clarity,
        persuasiveness: metricsData.persuasiveness,
        empathy: metricsData.empathy,
        structure_quality: metricsData.structureQuality,
        legal_precision: metricsData.legalPrecision,
        calculated_at: new Date(),
      })
      .returning('*');
    
    return this.mapToLetterMetrics(metrics);
  }

  static async findByDraftLetterId(draftLetterId: string): Promise<LetterMetrics | null> {
    const metrics = await db('letter_metrics')
      .where({ draft_letter_id: draftLetterId })
      .orderBy('calculated_at', 'desc')
      .first();
    
    if (!metrics) return null;
    return this.mapToLetterMetrics(metrics);
  }

  static async findLatestByDraftLetterId(draftLetterId: string): Promise<LetterMetrics | null> {
    return this.findByDraftLetterId(draftLetterId);
  }

  static async update(draftLetterId: string, metricsData: Partial<LetterMetrics>): Promise<LetterMetrics | null> {
    const [metrics] = await db('letter_metrics')
      .where({ draft_letter_id: draftLetterId })
      .update({
        ...(metricsData.intensity !== undefined && { intensity: metricsData.intensity }),
        ...(metricsData.seriousness !== undefined && { seriousness: metricsData.seriousness }),
        ...(metricsData.formality !== undefined && { formality: metricsData.formality }),
        ...(metricsData.clarity !== undefined && { clarity: metricsData.clarity }),
        ...(metricsData.persuasiveness !== undefined && { persuasiveness: metricsData.persuasiveness }),
        ...(metricsData.empathy !== undefined && { empathy: metricsData.empathy }),
        ...(metricsData.structureQuality !== undefined && { structure_quality: metricsData.structureQuality }),
        ...(metricsData.legalPrecision !== undefined && { legal_precision: metricsData.legalPrecision }),
        calculated_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*');
    
    if (!metrics) return null;
    return this.mapToLetterMetrics(metrics);
  }

  private static mapToLetterMetrics(row: any): LetterMetrics {
    return {
      id: row.id,
      draftLetterId: row.draft_letter_id,
      intensity: row.intensity,
      seriousness: row.seriousness,
      formality: row.formality,
      clarity: row.clarity,
      persuasiveness: row.persuasiveness,
      empathy: row.empathy,
      structureQuality: row.structure_quality,
      legalPrecision: row.legal_precision,
      calculatedAt: row.calculated_at.toISOString(),
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }
}


import axios from 'axios';
import { LetterMetrics } from '../../../shared/types';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'gpt-4o';

export interface MetricsAnalysis {
  intensity: number; // 1-10
  seriousness: number; // 1-10
  formality: number; // 1-10
  clarity: number; // 1-10
  persuasiveness: number; // 1-10
  empathy: number; // 1-10
  structureQuality: number; // 1-10
  legalPrecision: number; // 1-10
}

export class MetricsCalculator {
  /**
   * Calculate all 8 metrics for a letter using AI analysis
   */
  static async calculateMetrics(letterContent: string): Promise<MetricsAnalysis> {
    if (!OPENROUTER_API_KEY) {
      // Fallback to basic heuristics if API key not available
      return this.calculateBasicMetrics(letterContent);
    }

    const prompt = `Analyze the following legal demand letter and provide a JSON object with scores (1-10) for each metric:

{
  "intensity": <1-10>, // Strength/forcefulness of language
  "seriousness": <1-10>, // Gravity/severity of tone
  "formality": <1-10>, // Professional/casual level (10 = very formal)
  "clarity": <1-10>, // Readability and comprehension
  "persuasiveness": <1-10>, // Argument strength
  "empathy": <1-10>, // Emotional intelligence in communication
  "structureQuality": <1-10>, // Organization and flow
  "legalPrecision": <1-10> // Accuracy of legal language
}

Letter content:
${letterContent.substring(0, 6000)}

Return only valid JSON, no additional text.`;

    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: OPENROUTER_MODEL,
          messages: [
            {
              role: 'system',
              content: 'You are a legal document analyst. Analyze legal letters and provide accurate metric scores.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          response_format: { type: 'json_object' },
          max_tokens: 500,
          temperature: 0.3,
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://github.com/steno/demand-letter-generator',
            'X-Title': 'Demand Letter Generator',
          },
        }
      );

      const content = response.data.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No response from AI');
      }

      const metrics = JSON.parse(content) as MetricsAnalysis;
      
      // Validate and clamp values to 1-10
      return {
        intensity: this.clamp(metrics.intensity || 5, 1, 10),
        seriousness: this.clamp(metrics.seriousness || 5, 1, 10),
        formality: this.clamp(metrics.formality || 7, 1, 10),
        clarity: this.clamp(metrics.clarity || 5, 1, 10),
        persuasiveness: this.clamp(metrics.persuasiveness || 5, 1, 10),
        empathy: this.clamp(metrics.empathy || 5, 1, 10),
        structureQuality: this.clamp(metrics.structureQuality || 5, 1, 10),
        legalPrecision: this.clamp(metrics.legalPrecision || 5, 1, 10),
      };
    } catch (error) {
      console.error('Metrics calculation error:', error);
      // Fallback to basic heuristics
      return this.calculateBasicMetrics(letterContent);
    }
  }

  /**
   * Basic heuristic-based metrics calculation (fallback)
   */
  private static calculateBasicMetrics(letterContent: string): MetricsAnalysis {
    const content = letterContent.toLowerCase();
    const words = content.split(/\s+/).length;
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    const avgWordsPerSentence = words / Math.max(sentences, 1);

    // Intensity: based on strong words
    const strongWords = (content.match(/\b(demand|require|insist|urgent|immediate|critical|serious|severe)\b/g) || []).length;
    const intensity = Math.min(10, Math.max(1, 5 + Math.floor(strongWords / 3)));

    // Seriousness: based on legal terms and formal language
    const legalTerms = (content.match(/\b(breach|violation|liability|damages|compensation|legal|law|statute)\b/g) || []).length;
    const seriousness = Math.min(10, Math.max(1, 5 + Math.floor(legalTerms / 5)));

    // Formality: based on formal language patterns
    const formalMarkers = (content.match(/\b(pursuant|whereas|herein|thereof|aforesaid|notwithstanding)\b/g) || []).length;
    const formality = Math.min(10, Math.max(1, 7 + Math.floor(formalMarkers / 2)));

    // Clarity: based on sentence length and complexity
    const clarity = avgWordsPerSentence < 20 ? 8 : avgWordsPerSentence < 30 ? 6 : 4;

    // Persuasiveness: based on argument structure
    const argumentMarkers = (content.match(/\b(therefore|consequently|accordingly|furthermore|moreover|additionally)\b/g) || []).length;
    const persuasiveness = Math.min(10, Math.max(1, 5 + Math.floor(argumentMarkers / 3)));

    // Empathy: based on empathetic language
    const empatheticWords = (content.match(/\b(understand|appreciate|recognize|acknowledge|sympathize|consider)\b/g) || []).length;
    const empathy = Math.min(10, Math.max(1, 5 + Math.floor(empatheticWords / 4)));

    // Structure quality: based on organization markers
    const structureMarkers = (content.match(/\b(first|second|third|finally|in conclusion|summary|background)\b/g) || []).length;
    const structureQuality = Math.min(10, Math.max(1, 5 + Math.floor(structureMarkers / 2)));

    // Legal precision: based on legal terminology
    const legalPrecision = Math.min(10, Math.max(1, 5 + Math.floor(legalTerms / 4)));

    return {
      intensity,
      seriousness,
      formality,
      clarity,
      persuasiveness,
      empathy,
      structureQuality,
      legalPrecision,
    };
  }

  /**
   * Clamp a value between min and max
   */
  private static clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
  }

  /**
   * Convert MetricsAnalysis to LetterMetrics format (without id and timestamps)
   */
  static toLetterMetrics(draftLetterId: string, metrics: MetricsAnalysis): Omit<LetterMetrics, 'id' | 'createdAt' | 'updatedAt' | 'calculatedAt'> {
    return {
      draftLetterId,
      intensity: metrics.intensity,
      seriousness: metrics.seriousness,
      formality: metrics.formality,
      clarity: metrics.clarity,
      persuasiveness: metrics.persuasiveness,
      empathy: metrics.empathy,
      structureQuality: metrics.structureQuality,
      legalPrecision: metrics.legalPrecision,
    };
  }
}


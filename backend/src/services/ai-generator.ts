import axios from 'axios';
import { DocumentProcessor } from './document-processor';
import { TemplateModel } from '../models/Template';
import { PromptModel } from '../models/Prompt';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'gpt-4o';

export interface DocumentAnalysis {
  facts: string[];
  parties: string[];
  damages: string[];
  dates: string[];
  legalBasis: string[];
}

export interface LetterGenerationResult {
  content: string;
  analysis: DocumentAnalysis;
}

export class AIGenerator {
  /**
   * Analyze document and extract key information
   */
  static async analyzeDocument(documentText: string, promptId?: string): Promise<DocumentAnalysis> {
    if (!OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key not configured');
    }

    // Get custom prompt or use default
    let promptContent: string;
    if (promptId) {
      const customPrompt = await PromptModel.findById(promptId);
      if (customPrompt && customPrompt.type === 'analysis') {
        promptContent = customPrompt.content.replace('{{document_text}}', documentText.substring(0, 8000));
      } else {
        // Fallback to default
        promptContent = `Analyze the following legal documents and extract key information. Return a JSON object with the following structure:
{
  "facts": ["fact1", "fact2", ...],
  "parties": ["party1", "party2", ...],
  "damages": ["damage1", "damage2", ...],
  "dates": ["date1", "date2", ...],
  "legalBasis": ["basis1", "basis2", ...]
}

Documents:
${documentText.substring(0, 8000)}`;
      }
    } else {
      // Use default prompt
      const defaultPrompt = await PromptModel.findDefault('analysis');
      if (defaultPrompt) {
        promptContent = defaultPrompt.content.replace('{{document_text}}', documentText.substring(0, 8000));
      } else {
        promptContent = `Analyze the following legal documents and extract key information. Return a JSON object with the following structure:
{
  "facts": ["fact1", "fact2", ...],
  "parties": ["party1", "party2", ...],
  "damages": ["damage1", "damage2", ...],
  "dates": ["date1", "date2", ...],
  "legalBasis": ["basis1", "basis2", ...]
}

Documents:
${documentText.substring(0, 8000)}`;
      }
    }

    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: OPENROUTER_MODEL,
          messages: [
            {
              role: 'system',
              content: 'You are a legal document analyst. Extract structured information from legal documents accurately.',
            },
            {
              role: 'user',
              content: promptContent,
            },
          ],
          response_format: { type: 'json_object' },
          max_tokens: 2000,
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

      const analysis = JSON.parse(content) as DocumentAnalysis;
      return analysis;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Document analysis failed: ${error.response?.data?.error?.message || error.message}`);
      }
      throw new Error(`Document analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate demand letter from document analysis
   */
  static async generateLetter(
    analysis: DocumentAnalysis,
    templateId?: string,
    promptId?: string
  ): Promise<LetterGenerationResult> {
    if (!OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key not configured');
    }

    let templateContent = '';
    if (templateId) {
      const template = await TemplateModel.findById(templateId);
      if (template) {
        templateContent = template.content;
      }
    }

    // Get custom prompt or use default
    let promptContent: string;
    if (promptId) {
      const customPrompt = await PromptModel.findById(promptId);
      if (customPrompt && customPrompt.type === 'generation') {
        promptContent = customPrompt.content
          .replace('{{facts}}', analysis.facts.join('\n'))
          .replace('{{parties}}', analysis.parties.join('\n'))
          .replace('{{damages}}', analysis.damages.join('\n'))
          .replace('{{dates}}', analysis.dates.join('\n'))
          .replace('{{legal_basis}}', analysis.legalBasis.join('\n'))
          .replace('{{template_content}}', templateContent || '');
      } else {
        // Fallback to default
        promptContent = `Generate a professional demand letter based on the following information:

FACTS:
${analysis.facts.join('\n')}

PARTIES INVOLVED:
${analysis.parties.join('\n')}

DAMAGES/CLAIMS:
${analysis.damages.join('\n')}

RELEVANT DATES:
${analysis.dates.join('\n')}

LEGAL BASIS:
${analysis.legalBasis.join('\n')}

${templateContent ? `\nTEMPLATE STRUCTURE:\n${templateContent}` : ''}

Generate a professional, firm demand letter that:
1. Clearly states all relevant facts
2. Identifies all parties involved
3. Details the damages or claims
4. Provides legal basis for the demand
5. Includes specific demands and a reasonable deadline (typically 14-30 days)
6. Maintains a professional and firm tone
7. Is suitable for legal correspondence

${templateContent ? 'Use the template structure provided, replacing variables like {{client_name}}, {{date}}, etc. with appropriate values from the analysis.' : ''}

Return only the letter content, no additional commentary.`;
      }
    } else {
      // Use default prompt
      const defaultPrompt = await PromptModel.findDefault('generation');
      if (defaultPrompt) {
        promptContent = defaultPrompt.content
          .replace('{{facts}}', analysis.facts.join('\n'))
          .replace('{{parties}}', analysis.parties.join('\n'))
          .replace('{{damages}}', analysis.damages.join('\n'))
          .replace('{{dates}}', analysis.dates.join('\n'))
          .replace('{{legal_basis}}', analysis.legalBasis.join('\n'))
          .replace('{{template_content}}', templateContent || '');
      } else {
        promptContent = `Generate a professional demand letter based on the following information:

FACTS:
${analysis.facts.join('\n')}

PARTIES INVOLVED:
${analysis.parties.join('\n')}

DAMAGES/CLAIMS:
${analysis.damages.join('\n')}

RELEVANT DATES:
${analysis.dates.join('\n')}

LEGAL BASIS:
${analysis.legalBasis.join('\n')}

${templateContent ? `\nTEMPLATE STRUCTURE:\n${templateContent}` : ''}

Generate a professional, firm demand letter that:
1. Clearly states all relevant facts
2. Identifies all parties involved
3. Details the damages or claims
4. Provides legal basis for the demand
5. Includes specific demands and a reasonable deadline (typically 14-30 days)
6. Maintains a professional and firm tone
7. Is suitable for legal correspondence

${templateContent ? 'Use the template structure provided, replacing variables like {{client_name}}, {{date}}, etc. with appropriate values from the analysis.' : ''}

Return only the letter content, no additional commentary.`;
      }
    }

    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: OPENROUTER_MODEL,
          messages: [
            {
              role: 'system',
              content: 'You are a legal document generator specializing in demand letters. Generate professional, accurate, and legally appropriate demand letters.',
            },
            {
              role: 'user',
              content: promptContent,
            },
          ],
          max_tokens: 4000,
          temperature: 0.7,
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

      // Replace template variables if template was used
      let finalContent = content;
      if (templateId) {
        const template = await TemplateModel.findById(templateId);
        if (template) {
          // Replace common variables
          finalContent = finalContent
            .replace(/\{\{date\}\}/g, new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }))
            .replace(/\{\{current_date\}\}/g, new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));
        }
      }

      return {
        content: finalContent,
        analysis,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Letter generation failed: ${error.response?.data?.error?.message || error.message}`);
      }
      throw new Error(`Letter generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}


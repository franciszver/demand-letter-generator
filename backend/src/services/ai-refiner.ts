import axios from 'axios';
import { EQEnhancer } from './eq-enhancer';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'gpt-4o';

export class AIRefiner {
  /**
   * Refine demand letter based on instructions with EQ enhancement
   */
  static async refineLetter(
    currentDraft: string,
    instructions: string,
    userId?: string,
    draftLetterId?: string
  ): Promise<string> {
    if (!OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key not configured');
    }

    let basePrompt = `Refine the following demand letter based on these instructions:

INSTRUCTIONS:
${instructions}

CURRENT DRAFT:
${currentDraft}

Please refine the letter according to the instructions while:
1. Maintaining legal accuracy
2. Preserving professional tone
3. Keeping all factual information intact unless specifically instructed to change it
4. Ensuring the letter remains suitable for legal correspondence

Return only the refined letter content, no additional commentary.`;

    // Enhance prompt with EQ data if available
    if (userId && draftLetterId) {
      const eqContext = await EQEnhancer.getEQContext(userId, draftLetterId);
      basePrompt = EQEnhancer.buildEQPrompt(basePrompt, eqContext);
    }

    const prompt = basePrompt;

    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: OPENROUTER_MODEL,
          messages: [
            {
              role: 'system',
              content: 'You are a legal document editor specializing in demand letters. Refine letters based on instructions while maintaining legal accuracy and professional tone.',
            },
            {
              role: 'user',
              content: prompt,
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

      return content;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Letter refinement failed: ${error.response?.data?.error?.message || error.message}`);
      }
      throw new Error(`Letter refinement failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}


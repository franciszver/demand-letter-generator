import axios from 'axios';
import { PromptModel } from '../models/Prompt';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'gpt-4o';

export class AIRefiner {
  /**
   * Refine demand letter based on instructions
   */
  static async refineLetter(
    currentDraft: string,
    instructions: string,
    promptId?: string
  ): Promise<string> {
    if (!OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key not configured');
    }

    // Get custom prompt or use default
    let promptContent: string;
    if (promptId) {
      const customPrompt = await PromptModel.findById(promptId);
      if (customPrompt && customPrompt.type === 'refinement') {
        promptContent = customPrompt.content
          .replace('{{current_draft}}', currentDraft)
          .replace('{{instructions}}', instructions);
      } else {
        // Fallback to default
        promptContent = `Refine the following demand letter based on these instructions:

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
      }
    } else {
      // Use default prompt
      const defaultPrompt = await PromptModel.findDefault('refinement');
      if (defaultPrompt) {
        promptContent = defaultPrompt.content
          .replace('{{current_draft}}', currentDraft)
          .replace('{{instructions}}', instructions);
      } else {
        promptContent = `Refine the following demand letter based on these instructions:

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
              content: 'You are a legal document editor specializing in demand letters. Refine letters based on instructions while maintaining legal accuracy and professional tone.',
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

      return content;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Letter refinement failed: ${error.response?.data?.error?.message || error.message}`);
      }
      throw new Error(`Letter refinement failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}


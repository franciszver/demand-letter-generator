import { db } from '../config/database';

export interface Prompt {
  id: string;
  name: string;
  type: 'generation' | 'refinement' | 'analysis';
  content: string;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export class PromptModel {
  static async findAll(type?: string): Promise<Prompt[]> {
    let query = db('prompts');
    if (type) {
      query = query.where({ type });
    }
    const prompts = await query.orderBy('is_default', 'desc').orderBy('created_at', 'desc');
    return prompts.map(this.mapToPrompt);
  }

  static async findById(id: string): Promise<Prompt | null> {
    const prompt = await db('prompts').where({ id }).first();
    if (!prompt) return null;
    return this.mapToPrompt(prompt);
  }

  static async findDefault(type: string): Promise<Prompt | null> {
    const prompt = await db('prompts')
      .where({ type, is_default: true, is_active: true })
      .first();
    if (!prompt) return null;
    return this.mapToPrompt(prompt);
  }

  static async create(promptData: Omit<Prompt, 'id' | 'createdAt' | 'updatedAt'>): Promise<Prompt> {
    // If this is set as default, unset other defaults of the same type
    if (promptData.isDefault) {
      await db('prompts')
        .where({ type: promptData.type })
        .update({ is_default: false });
    }

    const [prompt] = await db('prompts')
      .insert({
        name: promptData.name,
        type: promptData.type,
        content: promptData.content,
        is_default: promptData.isDefault,
        is_active: promptData.isActive,
      })
      .returning('*');
    
    return this.mapToPrompt(prompt);
  }

  static async update(id: string, updates: Partial<Prompt>): Promise<Prompt | null> {
    // If setting as default, unset other defaults
    if (updates.isDefault) {
      const existing = await this.findById(id);
      if (existing) {
        await db('prompts')
          .where({ type: existing.type })
          .where('id', '!=', id)
          .update({ is_default: false });
      }
    }

    const updateData: any = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.content) updateData.content = updates.content;
    if (updates.isDefault !== undefined) updateData.is_default = updates.isDefault;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    const [prompt] = await db('prompts')
      .where({ id })
      .update(updateData)
      .returning('*');
    
    if (!prompt) return null;
    return this.mapToPrompt(prompt);
  }

  static async delete(id: string): Promise<boolean> {
    const deleted = await db('prompts').where({ id }).delete();
    return deleted > 0;
  }

  private static mapToPrompt(row: any): Prompt {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      content: row.content,
      isDefault: row.is_default,
      isActive: row.is_active,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }
}


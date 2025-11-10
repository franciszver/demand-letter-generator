import { db } from '../config/database';
import { Template } from '../../../shared/types';

export class TemplateModel {
  static async findAll(): Promise<Template[]> {
    const templates = await db('templates').orderBy('created_at', 'desc');
    return templates.map(this.mapToTemplate);
  }

  static async findById(id: string): Promise<Template | null> {
    const template = await db('templates').where({ id }).first();
    if (!template) return null;
    return this.mapToTemplate(template);
  }

  static async create(templateData: Omit<Template, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<Template> {
    const [template] = await db('templates')
      .insert({
        name: templateData.name,
        content: templateData.content,
        variables: JSON.stringify(templateData.variables || []),
        version: 1,
      })
      .returning('*');
    
    return this.mapToTemplate(template);
  }

  static async update(id: string, updates: Partial<Omit<Template, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Template | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const [template] = await db('templates')
      .where({ id })
      .update({
        ...(updates.name && { name: updates.name }),
        ...(updates.content && { content: updates.content }),
        ...(updates.variables && { variables: JSON.stringify(updates.variables) }),
        version: existing.version + 1,
        updated_at: new Date(),
      })
      .returning('*');
    
    if (!template) return null;
    return this.mapToTemplate(template);
  }

  static async delete(id: string): Promise<boolean> {
    const deleted = await db('templates').where({ id }).delete();
    return deleted > 0;
  }

  private static mapToTemplate(row: any): Template {
    return {
      id: row.id,
      name: row.name,
      content: row.content,
      variables: Array.isArray(row.variables) ? row.variables : JSON.parse(row.variables || '[]'),
      version: row.version,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }
}


import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { TemplateModel } from '../models/Template';
import { AnalyticsService } from '../services/analytics';
import { Template } from '../../../shared/types';

export const listTemplatesHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const templates = await TemplateModel.findAll();
    res.json({ success: true, data: templates });
  } catch (error) {
    console.error('List templates error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list templates',
    });
  }
};

export const createTemplateHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, content, variables }: Omit<Template, 'id' | 'createdAt' | 'updatedAt' | 'version'> = req.body;

    if (!name || !content) {
      res.status(400).json({ success: false, error: 'Name and content are required' });
      return;
    }

    // Extract variables from content if not provided
    const extractedVariables = variables || extractVariables(content);

    const template = await TemplateModel.create({
      name,
      content,
      variables: extractedVariables,
    });

    // Track analytics
    await AnalyticsService.trackTemplateCreated(req.user!.id, template.id);

    res.status(201).json({ success: true, data: template });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create template',
    });
  }
};

export const updateTemplateHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, content, variables }: Partial<Template> = req.body;

    if (!id) {
      res.status(400).json({ success: false, error: 'Template ID is required' });
      return;
    }

    const updates: Partial<Template> = {};
    if (name) updates.name = name;
    if (content) {
      updates.content = content;
      // Re-extract variables if content changed
      updates.variables = variables || extractVariables(content);
    } else if (variables) {
      updates.variables = variables;
    }

    const template = await TemplateModel.update(id, updates);

    if (!template) {
      res.status(404).json({ success: false, error: 'Template not found' });
      return;
    }

    // Track analytics
    await AnalyticsService.trackTemplateUpdated(req.user!.id, id);

    res.json({ success: true, data: template });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update template',
    });
  }
};

export const deleteTemplateHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ success: false, error: 'Template ID is required' });
      return;
    }

    const deleted = await TemplateModel.delete(id);

    if (!deleted) {
      res.status(404).json({ success: false, error: 'Template not found' });
      return;
    }

    // Track analytics
    await AnalyticsService.trackTemplateDeleted(req.user!.id, id);

    res.json({ success: true, message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete template',
    });
  }
};

// Helper function to extract variables from template content
function extractVariables(content: string): string[] {
  const variableRegex = /\{\{(\w+)\}\}/g;
  const variables: string[] = [];
  let match;

  while ((match = variableRegex.exec(content)) !== null) {
    if (!variables.includes(match[1])) {
      variables.push(match[1]);
    }
  }

  return variables;
}


export const handler = {
  list: listTemplatesHandler,
  create: createTemplateHandler,
  update: updateTemplateHandler,
  delete: deleteTemplateHandler,
};


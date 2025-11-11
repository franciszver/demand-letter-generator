import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PromptModel } from '../models/Prompt';

export const listPromptsHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { type } = req.query;
    const prompts = await PromptModel.findAll(type as string | undefined);
    res.json({
      success: true,
      data: prompts,
    });
  } catch (error) {
    console.error('List prompts error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list prompts',
    });
  }
};

export const getPromptHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const prompt = await PromptModel.findById(id);
    
    if (!prompt) {
      res.status(404).json({ success: false, error: 'Prompt not found' });
      return;
    }

    res.json({
      success: true,
      data: prompt,
    });
  } catch (error) {
    console.error('Get prompt error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get prompt',
    });
  }
};

export const createPromptHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, type, content, isDefault, isActive } = req.body;

    if (!name || !type || !content) {
      res.status(400).json({ success: false, error: 'Name, type, and content are required' });
      return;
    }

    if (!['generation', 'refinement', 'analysis'].includes(type)) {
      res.status(400).json({ success: false, error: 'Invalid prompt type' });
      return;
    }

    const prompt = await PromptModel.create({
      name,
      type,
      content,
      isDefault: isDefault || false,
      isActive: isActive !== undefined ? isActive : true,
    });

    res.status(201).json({
      success: true,
      data: prompt,
    });
  } catch (error) {
    console.error('Create prompt error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create prompt',
    });
  }
};

export const updatePromptHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, content, isDefault, isActive } = req.body;

    const prompt = await PromptModel.findById(id);
    if (!prompt) {
      res.status(404).json({ success: false, error: 'Prompt not found' });
      return;
    }

    const updates: any = {};
    if (name) updates.name = name;
    if (content) updates.content = content;
    if (isDefault !== undefined) updates.isDefault = isDefault;
    if (isActive !== undefined) updates.isActive = isActive;

    const updated = await PromptModel.update(id, updates);

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Update prompt error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update prompt',
    });
  }
};

export const deletePromptHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const prompt = await PromptModel.findById(id);
    if (!prompt) {
      res.status(404).json({ success: false, error: 'Prompt not found' });
      return;
    }

    if (prompt.isDefault) {
      res.status(400).json({ success: false, error: 'Cannot delete default prompt' });
      return;
    }

    await PromptModel.delete(id);

    res.json({
      success: true,
      message: 'Prompt deleted successfully',
    });
  } catch (error) {
    console.error('Delete prompt error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete prompt',
    });
  }
};


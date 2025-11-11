import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { WebhookModel } from '../models/Webhook';
import { WebhookService } from '../services/webhook-service';

export const listWebhooksHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const webhooks = await WebhookModel.findByUserId(userId);
    res.json({
      success: true,
      data: webhooks,
    });
  } catch (error) {
    console.error('List webhooks error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list webhooks',
    });
  }
};

export const createWebhookHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { url, events, secret } = req.body;

    if (!url || !events || !Array.isArray(events)) {
      res.status(400).json({ success: false, error: 'URL and events array are required' });
      return;
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      res.status(400).json({ success: false, error: 'Invalid URL format' });
      return;
    }

    const webhook = await WebhookModel.create({
      userId,
      url,
      events,
      secret: secret || null,
      active: true,
    });

    res.status(201).json({
      success: true,
      data: webhook,
    });
  } catch (error) {
    console.error('Create webhook error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create webhook',
    });
  }
};

export const updateWebhookHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;
    const { url, events, active } = req.body;

    const webhook = await WebhookModel.findById(id);
    if (!webhook) {
      res.status(404).json({ success: false, error: 'Webhook not found' });
      return;
    }

    if (webhook.userId !== userId) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    const updates: any = {};
    if (url) {
      try {
        new URL(url);
        updates.url = url;
      } catch {
        res.status(400).json({ success: false, error: 'Invalid URL format' });
        return;
      }
    }
    if (events) updates.events = events;
    if (active !== undefined) updates.active = active;

    const updated = await WebhookModel.update(id, updates);

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    console.error('Update webhook error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update webhook',
    });
  }
};

export const deleteWebhookHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const webhook = await WebhookModel.findById(id);
    if (!webhook) {
      res.status(404).json({ success: false, error: 'Webhook not found' });
      return;
    }

    if (webhook.userId !== userId) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    await WebhookModel.delete(id);

    res.json({
      success: true,
      message: 'Webhook deleted successfully',
    });
  } catch (error) {
    console.error('Delete webhook error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete webhook',
    });
  }
};

export const testWebhookHandler = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const webhook = await WebhookModel.findById(id);
    if (!webhook) {
      res.status(404).json({ success: false, error: 'Webhook not found' });
      return;
    }

    if (webhook.userId !== userId) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    // Send test webhook
    await WebhookService.triggerWebhooks('test', {
      message: 'This is a test webhook from Steno Draft',
      webhookId: webhook.id,
    });

    res.json({
      success: true,
      message: 'Test webhook sent successfully',
    });
  } catch (error) {
    console.error('Test webhook error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send test webhook',
    });
  }
};


import { db } from '../config/database';
import crypto from 'crypto';

export interface Webhook {
  id: string;
  userId: string;
  url: string;
  events: string[];
  secret: string | null;
  active: boolean;
  retryCount: number;
  lastTriggeredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export class WebhookModel {
  static async create(webhookData: Omit<Webhook, 'id' | 'createdAt' | 'updatedAt' | 'retryCount' | 'lastTriggeredAt'>): Promise<Webhook> {
    // Generate secret if not provided
    const secret = webhookData.secret || crypto.randomBytes(32).toString('hex');

    const [webhook] = await db('webhooks')
      .insert({
        user_id: webhookData.userId,
        url: webhookData.url,
        events: JSON.stringify(webhookData.events),
        secret,
        active: webhookData.active,
      })
      .returning('*');
    
    return this.mapToWebhook(webhook);
  }

  static async findById(id: string): Promise<Webhook | null> {
    const webhook = await db('webhooks').where({ id }).first();
    if (!webhook) return null;
    return this.mapToWebhook(webhook);
  }

  static async findByUserId(userId: string): Promise<Webhook[]> {
    const webhooks = await db('webhooks')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc');
    return webhooks.map(this.mapToWebhook);
  }

  static async findActiveByEvent(eventType: string): Promise<Webhook[]> {
    const webhooks = await db('webhooks')
      .where({ active: true })
      .whereRaw("events::jsonb ? ?", [eventType]);
    return webhooks.map(this.mapToWebhook);
  }

  static async update(id: string, updates: Partial<Webhook>): Promise<Webhook | null> {
    const updateData: any = {};
    if (updates.url) updateData.url = updates.url;
    if (updates.events) updateData.events = JSON.stringify(updates.events);
    if (updates.active !== undefined) updateData.active = updates.active;
    if (updates.secret) updateData.secret = updates.secret;

    const [webhook] = await db('webhooks')
      .where({ id })
      .update(updateData)
      .returning('*');
    
    if (!webhook) return null;
    return this.mapToWebhook(webhook);
  }

  static async recordTrigger(id: string): Promise<void> {
    await db('webhooks')
      .where({ id })
      .update({
        last_triggered_at: new Date(),
        retry_count: db.raw('retry_count + 1'),
      });
  }

  static async delete(id: string): Promise<boolean> {
    const deleted = await db('webhooks').where({ id }).delete();
    return deleted > 0;
  }

  private static mapToWebhook(row: any): Webhook {
    return {
      id: row.id,
      userId: row.user_id,
      url: row.url,
      events: Array.isArray(row.events) ? row.events : JSON.parse(row.events || '[]'),
      secret: row.secret,
      active: row.active,
      retryCount: row.retry_count,
      lastTriggeredAt: row.last_triggered_at ? row.last_triggered_at.toISOString() : null,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }
}


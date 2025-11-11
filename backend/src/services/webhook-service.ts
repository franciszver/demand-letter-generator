import axios from 'axios';
import crypto from 'crypto';
import { WebhookModel } from '../models/Webhook';

export class WebhookService {
  /**
   * Trigger webhooks for a specific event type
   */
  static async triggerWebhooks(eventType: string, payload: any): Promise<void> {
    const webhooks = await WebhookModel.findActiveByEvent(eventType);

    for (const webhook of webhooks) {
      try {
        await this.deliverWebhook(webhook, eventType, payload);
        await WebhookModel.recordTrigger(webhook.id);
      } catch (error) {
        console.error(`Failed to deliver webhook ${webhook.id}:`, error);
        // Retry logic could be implemented here
      }
    }
  }

  /**
   * Deliver a webhook to a URL
   */
  private static async deliverWebhook(webhook: Webhook, eventType: string, payload: any): Promise<void> {
    const signature = this.generateSignature(webhook.secret || '', JSON.stringify(payload));

    await axios.post(webhook.url, {
      event: eventType,
      data: payload,
      timestamp: new Date().toISOString(),
    }, {
      headers: {
        'X-Webhook-Signature': signature,
        'X-Webhook-Event': eventType,
        'Content-Type': 'application/json',
      },
      timeout: 5000, // 5 second timeout
    });
  }

  /**
   * Generate HMAC signature for webhook verification
   */
  private static generateSignature(secret: string, payload: string): string {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
  }

  /**
   * Verify webhook signature (for incoming webhooks, if needed)
   */
  static verifySignature(secret: string, payload: string, signature: string): boolean {
    const expectedSignature = this.generateSignature(secret, payload);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
}


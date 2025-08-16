import crypto from 'crypto';
import { storage } from './storage';
import type { Webhook } from '@shared/schema';

export async function triggerWebhooks(event: string, data: any, specificWebhooks?: Webhook[]) {
  try {
    const webhooks = specificWebhooks || await storage.getActiveWebhooks();
    const relevantWebhooks = webhooks.filter(webhook => 
      webhook.events?.includes(event) || webhook.events?.includes('*')
    );

    for (const webhook of relevantWebhooks) {
      await sendWebhook(webhook, event, data);
    }
  } catch (error) {
    console.error('Error triggering webhooks:', error);
  }
}

async function sendWebhook(webhook: Webhook, event: string, data: any) {
  try {
    const payload = {
      event,
      data,
      timestamp: new Date().toISOString(),
      webhook_id: webhook.id
    };

    const payloadString = JSON.stringify(payload);
    
    // Generate HMAC signature if secret is provided
    let signature: string | undefined;
    if (webhook.secret) {
      signature = crypto
        .createHmac('sha256', webhook.secret)
        .update(payloadString)
        .digest('hex');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Siwaht-CRM-Webhook/1.0',
      ...(webhook.headers as Record<string, string> || {}),
      ...(signature && { 'X-Webhook-Signature': `sha256=${signature}` }),
    };

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: payloadString,
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    if (response.ok) {
      // Update last triggered timestamp
      await storage.updateWebhook(webhook.id, {
        lastTriggered: new Date()
      });
      console.log(`Webhook ${webhook.name} triggered successfully`);
    } else {
      console.error(`Webhook ${webhook.name} failed with status ${response.status}`);
      // TODO: Implement retry mechanism
    }

  } catch (error) {
    console.error(`Error sending webhook ${webhook.name}:`, error);
    // TODO: Implement retry mechanism
  }
}

export async function verifyWebhookSignature(payload: string, signature: string, secret: string): Promise<boolean> {
  if (!signature.startsWith('sha256=')) {
    return false;
  }

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  const receivedSignature = signature.slice(7); // Remove 'sha256=' prefix

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature, 'hex'),
    Buffer.from(receivedSignature, 'hex')
  );
}

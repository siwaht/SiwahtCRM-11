import { storage } from './storage';
import type { Webhook } from '@shared/schema';
import crypto from 'crypto';

export async function triggerWebhooks(event: string, data: any, specificWebhooks?: Webhook[]) {
  try {
    const webhooks = specificWebhooks || await storage.getActiveWebhooks();
    
    // For manual tests, bypass event filtering when specific webhooks are provided
    const relevantWebhooks = specificWebhooks 
      ? specificWebhooks 
      : webhooks.filter(webhook => webhook.events && webhook.events.includes(event));

    const promises = relevantWebhooks.map(async (webhook) => {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'User-Agent': 'Siwaht-CRM-Webhook/1.0',
        };

        // Add custom headers from webhook config
        if (webhook.headers && typeof webhook.headers === 'object') {
          Object.assign(headers, webhook.headers);
        }

        // Add signature if secret is provided
        if (webhook.secret) {
          const signature = crypto
            .createHmac('sha256', webhook.secret)
            .update(JSON.stringify(data))
            .digest('hex');
          headers['X-Siwaht-Signature'] = `sha256=${signature}`;
        }

        const webhookBody = {
          event,
          data,
          timestamp: new Date().toISOString(),
        };
        
        console.log(`Sending webhook ${webhook.name} with payload:`, JSON.stringify(webhookBody, null, 2));
        
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers,
          body: JSON.stringify(webhookBody),
        });

        if (!response.ok) {
          console.error(`Webhook ${webhook.name} failed: ${response.status} ${response.statusText}`);
        } else {
          console.log(`Webhook ${webhook.name} triggered successfully`);
          // Update last triggered timestamp
          await storage.updateWebhook(webhook.id, { lastTriggered: new Date() } as any);
        }
      } catch (error) {
        console.error(`Webhook ${webhook.name} error:`, error);
      }
    });

    await Promise.allSettled(promises);
  } catch (error) {
    console.error('Error triggering webhooks:', error);
  }
}
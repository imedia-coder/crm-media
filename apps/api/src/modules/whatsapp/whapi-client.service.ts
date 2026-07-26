import { Injectable } from '@nestjs/common';

export interface WhapiSendResult {
  whapiMessageId: string;
}

/**
 * Thin wrapper around Whapi.Cloud's REST API. The exact request/response
 * shape here is a best-effort guess pending a real token to test against
 * (see the plan's verification notes) — isolated to this one method so
 * it's a small, contained fix once confirmed live.
 */
@Injectable()
export class WhapiClientService {
  private readonly baseUrl = process.env.WHAPI_BASE_URL ?? 'https://gate.whapi.cloud';

  async sendTextMessage(token: string, to: string, body: string): Promise<WhapiSendResult> {
    const response = await fetch(`${this.baseUrl}/messages/text`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, body }),
    });

    if (!response.ok) {
      throw new Error(`Whapi send failed (${response.status}): ${await response.text()}`);
    }

    const data = (await response.json()) as { message?: { id?: string } };
    if (!data.message?.id) {
      throw new Error('Whapi send response missing message id');
    }
    return { whapiMessageId: data.message.id };
  }
}

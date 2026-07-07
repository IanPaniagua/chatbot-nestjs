import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import twilio from 'twilio';
import { ChannelAdapter, OutboundMessage } from './channel.types';

@Injectable()
export class TwilioChannelService implements ChannelAdapter {
  private readonly logger = new Logger(TwilioChannelService.name);

  constructor(private readonly config: ConfigService) {}

  async send(message: OutboundMessage): Promise<{ providerMessageId?: string }> {
    const accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.config.get<string>('TWILIO_AUTH_TOKEN');
    const from = this.config.get<string>('TWILIO_WHATSAPP_FROM');

    if (!accountSid || !authToken || !from) {
      this.logger.warn('Twilio credentials are not configured; outbound message was not sent.');
      return {};
    }

    const client = twilio(accountSid, authToken);
    const result = await client.messages.create({
      from,
      to: message.to.startsWith('whatsapp:') ? message.to : `whatsapp:${message.to}`,
      body: message.body,
    });

    return { providerMessageId: result.sid };
  }
}

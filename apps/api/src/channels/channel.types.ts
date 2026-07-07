import type { Channel } from '@chatbot/shared';

export interface InboundMessage {
  companySlug: string;
  channel: Channel;
  externalContactId: string;
  from: string;
  to?: string;
  body: string;
  provider: string;
  providerMessageId?: string;
  metadata?: Record<string, unknown>;
}

export interface OutboundMessage {
  companyId: string;
  channel: Channel;
  to: string;
  body: string;
  provider?: string;
  metadata?: Record<string, unknown>;
}

export interface ChannelAdapter {
  send(message: OutboundMessage): Promise<{ providerMessageId?: string }>;
}

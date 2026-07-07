import type { ConversationIntent, ConversationStatus, MetricsOverview } from '@chatbot/shared';

export interface Company {
  id: string;
  slug: string;
  name: string;
}

export interface Contact {
  id: string;
  displayName?: string | null;
  phone?: string | null;
  externalId: string;
}

export interface Message {
  id: string;
  direction: 'inbound' | 'outbound';
  body: string;
  createdAt: string;
}

export interface ConversationListItem {
  id: string;
  status: ConversationStatus;
  intent: ConversationIntent;
  updatedAt: string;
  summary?: string | null;
  contact: Contact;
  messages: Message[];
}

export interface ConversationDetail extends ConversationListItem {
  collectedData?: Record<string, unknown> | null;
  messages: Message[];
  notes: { id: string; body: string; author?: string | null; createdAt: string }[];
}

export type { MetricsOverview };

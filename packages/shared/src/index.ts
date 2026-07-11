export const ConversationStatuses = ['open', 'waiting_customer', 'needs_human', 'closed'] as const;
export type ConversationStatus = (typeof ConversationStatuses)[number];

export const ConversationIntents = [
  'normal_order',
  'special_order',
  'restaurant_order',
  'faq',
  'human_support',
  'unknown',
] as const;
export type ConversationIntent = (typeof ConversationIntents)[number];

export const Channels = ['whatsapp', 'webchat'] as const;
export type Channel = (typeof Channels)[number];

export const MessageDirections = ['inbound', 'outbound'] as const;
export type MessageDirection = (typeof MessageDirections)[number];

export type FlowKey = 'normal_order' | 'special_order' | 'restaurant_order' | 'faq';

export interface CompanyBotConfig {
  language: string;
  timezone: string;
  onlineStoreUrl?: string;
  websiteUrl?: string;
  instagramUrl?: string;
  internalEmail?: string;
  serviceCatalog?: ServiceCatalogItem[];
  locations: CompanyLocation[];
  faqs: KnowledgeBaseItem[];
  flows: Record<string, FlowDefinition>;
  routingKeywords: Record<string, string[]>;
  messages: BotMessages;
}

export interface ServiceCatalogItem {
  key: string;
  name: string;
  description: string;
  bestFor: string[];
  notFor?: string[];
  qualificationQuestions: string[];
  requiredData: string[];
  leadTag: string;
}

export interface CompanyLocation {
  name: string;
  address?: string;
  pickupNotes?: string;
}

export interface KnowledgeBaseItem {
  question: string;
  answer: string;
  keywords: string[];
}

export interface FlowDefinition {
  welcome: string;
  requiredFields: FlowField[];
  completionMessage: string;
}

export interface FlowField {
  key: string;
  label: string;
  prompt: string;
  optional?: boolean;
}

export interface BotMessages {
  greeting: string;
  fallback: string;
  humanHandoff: string;
  normalOrderRedirect: string;
  clarificationPrompt?: string;
  capabilities?: string;
  courtesyThanks?: string;
  courtesyGoodbye?: string;
  flowResumePrompt?: string;
  flowContinuePrefix?: string;
  flowLowInformation?: string;
}

export interface ConversationSummary {
  intent: ConversationIntent;
  status: ConversationStatus;
  collectedData: Record<string, unknown>;
  missingFields: string[];
  nextQuestion?: string;
  humanReadableSummary: string;
}

export interface MetricsOverview {
  conversationsToday: number;
  needsHumanPercentage: number;
  structuredOrders: number;
  faqAnswered: number;
  averageFirstResponseSeconds: number | null;
}

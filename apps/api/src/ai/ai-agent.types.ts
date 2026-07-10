import { ConversationIntent, ConversationStatus } from '@prisma/client';
import type { CompanyBotConfig } from '@chatbot/shared';

export interface AiAgentInput {
  companyId: string;
  conversationId: string;
  body: string;
  config: CompanyBotConfig;
  activeFlow?: {
    flowKey: string;
    currentStep: number;
    collectedData: Record<string, unknown>;
  } | null;
}

export interface AiAgentDecision {
  reply: string;
  intent: ConversationIntent;
  status: ConversationStatus;
  confidence: number;
  shouldStartFlow: boolean;
  flowKey: string | null;
  collectedDataPatch: Record<string, unknown>;
  needsHuman: boolean;
  reason: string;
  usedKnowledgeIds: string[];
}

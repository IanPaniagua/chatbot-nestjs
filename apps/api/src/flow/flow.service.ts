import { Injectable } from '@nestjs/common';
import { ConversationIntent, ConversationStatus } from '@prisma/client';
import type { CompanyBotConfig, ConversationSummary, FlowDefinition, FlowField } from '@chatbot/shared';
import { CompaniesService } from '../companies/companies.service';
import { PrismaService } from '../prisma/prisma.service';

export interface RouteInboundInput {
  companyId: string;
  conversationId: string;
  contactId: string;
  channel: string;
  from: string;
  body: string;
}

export interface RoutingResult {
  reply: string;
  intent: ConversationIntent;
  status: ConversationStatus;
  decision: string;
  summary?: ConversationSummary;
}

@Injectable()
export class FlowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly companies: CompaniesService,
  ) {}

  async routeInbound(input: RouteInboundInput): Promise<RoutingResult> {
    const config = await this.companies.getConfig(input.companyId);
    const existingSession = await this.prisma.flowSession.findUnique({
      where: { conversationId: input.conversationId },
    });

    if (existingSession && !existingSession.completedAt) {
      return this.continueFlow(input, config, existingSession);
    }

    const intent = await this.classify(input.companyId, input.body, config);
    const result = await this.routeNewIntent(input, config, intent);

    await this.prisma.conversation.update({
      where: { id: input.conversationId },
      data: {
        intent,
        status: result.status,
        summary: result.summary?.humanReadableSummary,
        collectedData: result.summary?.collectedData as any,
      },
    });

    return result;
  }

  async classify(
    companyId: string,
    body: string,
    config: CompanyBotConfig,
  ): Promise<ConversationIntent> {
    const normalized = this.normalize(body);

    if (this.matchesAny(normalized, config.routingKeywords.restaurant_order ?? [])) {
      return ConversationIntent.restaurant_order;
    }

    if (this.matchesAny(normalized, config.routingKeywords.special_order ?? [])) {
      return ConversationIntent.special_order;
    }

    if (this.matchesAny(normalized, config.routingKeywords.normal_order ?? [])) {
      return ConversationIntent.normal_order;
    }

    const faq = await this.findFaqAnswer(companyId, normalized, config);
    if (faq) {
      return ConversationIntent.faq;
    }

    if (this.matchesAny(normalized, config.routingKeywords.human_support ?? [])) {
      return ConversationIntent.human_support;
    }

    return ConversationIntent.unknown;
  }

  private async routeNewIntent(
    input: RouteInboundInput,
    config: CompanyBotConfig,
    intent: ConversationIntent,
  ): Promise<RoutingResult> {
    if (intent === ConversationIntent.normal_order) {
      const reply = this.render(config.messages.normalOrderRedirect, {
        onlineStoreUrl: config.onlineStoreUrl ?? config.websiteUrl ?? '',
      });
      return {
        reply,
        intent,
        status: ConversationStatus.closed,
        decision: 'redirect_to_online_store',
        summary: this.buildSummary(intent, ConversationStatus.closed, {}, [], 'Pedido normal redirigido.'),
      };
    }

    if (intent === ConversationIntent.special_order) {
      return this.startFlow(input, config, 'special_order', ConversationIntent.special_order);
    }

    if (intent === ConversationIntent.restaurant_order) {
      return this.startFlow(input, config, 'restaurant_order', ConversationIntent.restaurant_order);
    }

    if (intent === ConversationIntent.faq) {
      const answer = await this.findFaqAnswer(input.companyId, this.normalize(input.body), config);
      return {
        reply: answer ?? config.messages.fallback,
        intent,
        status: ConversationStatus.closed,
        decision: answer ? 'faq_answered' : 'faq_not_found',
        summary: this.buildSummary(intent, ConversationStatus.closed, {}, [], 'FAQ respondida.'),
      };
    }

    return {
      reply: config.messages.humanHandoff,
      intent: intent === ConversationIntent.human_support ? intent : ConversationIntent.unknown,
      status: ConversationStatus.needs_human,
      decision: 'human_handoff',
      summary: this.buildSummary(intent, ConversationStatus.needs_human, {}, [], 'Derivado a humano.'),
    };
  }

  private async startFlow(
    input: RouteInboundInput,
    config: CompanyBotConfig,
    flowKey: string,
    intent: ConversationIntent,
  ): Promise<RoutingResult> {
    const flow = config.flows[flowKey];
    const firstField = flow.requiredFields[0];

    await this.prisma.flowSession.upsert({
      where: { conversationId: input.conversationId },
      update: {
        flowKey,
        currentStep: 0,
        collectedData: {},
        completedAt: null,
      },
      create: {
        conversationId: input.conversationId,
        flowKey,
        currentStep: 0,
        collectedData: {},
      },
    });

    return {
      reply: `${flow.welcome}\n\n${firstField.prompt}`,
      intent,
      status: ConversationStatus.waiting_customer,
      decision: `start_flow:${flowKey}`,
      summary: this.buildSummary(intent, ConversationStatus.waiting_customer, {}, this.fieldKeys(flow), firstField.prompt),
    };
  }

  private async continueFlow(
    input: RouteInboundInput,
    config: CompanyBotConfig,
    session: { flowKey: string; currentStep: number; collectedData: any },
  ): Promise<RoutingResult> {
    const flow = config.flows[session.flowKey];
    const currentField = flow.requiredFields[session.currentStep];
    const collectedData = {
      ...(session.collectedData ?? {}),
      [currentField.key]: input.body.trim(),
    };
    const nextStep = session.currentStep + 1;
    const nextField = flow.requiredFields[nextStep];
    const intent = session.flowKey as ConversationIntent;

    if (nextField) {
      await this.prisma.flowSession.update({
        where: { conversationId: input.conversationId },
        data: {
          currentStep: nextStep,
          collectedData,
        },
      });

      await this.prisma.conversation.update({
        where: { id: input.conversationId },
        data: {
          intent,
          status: ConversationStatus.waiting_customer,
          collectedData,
        },
      });

      return {
        reply: nextField.prompt,
        intent,
        status: ConversationStatus.waiting_customer,
        decision: `continue_flow:${session.flowKey}`,
        summary: this.buildSummary(
          intent,
          ConversationStatus.waiting_customer,
          collectedData,
          this.missingFields(flow, collectedData),
          nextField.prompt,
        ),
      };
    }

    const summary = this.buildSummary(
      intent,
      ConversationStatus.needs_human,
      collectedData,
      [],
      this.formatCollectedData(flow, collectedData),
    );

    await this.prisma.flowSession.update({
      where: { conversationId: input.conversationId },
      data: {
        currentStep: nextStep,
        collectedData,
        completedAt: new Date(),
      },
    });

    await this.prisma.conversation.update({
      where: { id: input.conversationId },
      data: {
        intent,
        status: ConversationStatus.needs_human,
        collectedData,
        summary: summary.humanReadableSummary,
      },
    });

    return {
      reply: `${flow.completionMessage}\n\n${summary.humanReadableSummary}`,
      intent,
      status: ConversationStatus.needs_human,
      decision: `complete_flow:${session.flowKey}`,
      summary,
    };
  }

  private async findFaqAnswer(
    companyId: string,
    normalizedBody: string,
    config: CompanyBotConfig,
  ): Promise<string | null> {
    const dbFaqs = await this.prisma.knowledgeBaseEntry.findMany({
      where: { companyId, isActive: true },
    });

    const candidates = [
      ...dbFaqs.map((faq) => ({ answer: faq.answer, keywords: faq.keywords })),
      ...config.faqs.map((faq) => ({ answer: faq.answer, keywords: faq.keywords })),
    ];

    const match = candidates.find((faq) => this.matchesAny(normalizedBody, faq.keywords));
    return match?.answer ?? null;
  }

  private buildSummary(
    intent: ConversationIntent,
    status: ConversationStatus,
    collectedData: Record<string, unknown>,
    missingFields: string[],
    humanReadableSummary: string,
  ): ConversationSummary {
    return {
      intent,
      status,
      collectedData,
      missingFields,
      humanReadableSummary,
    };
  }

  private fieldKeys(flow: FlowDefinition): string[] {
    return flow.requiredFields.filter((field) => !field.optional).map((field) => field.key);
  }

  private missingFields(flow: FlowDefinition, data: Record<string, unknown>): string[] {
    return flow.requiredFields
      .filter((field) => !field.optional && !data[field.key])
      .map((field) => field.key);
  }

  private formatCollectedData(flow: FlowDefinition, data: Record<string, unknown>): string {
    const lines = flow.requiredFields
      .map((field: FlowField) => `- ${field.label}: ${data[field.key] ?? 'Pendiente'}`)
      .join('\n');

    return `Resumen estructurado:\n${lines}`;
  }

  private matchesAny(normalizedBody: string, keywords: string[]): boolean {
    return keywords.some((keyword) => normalizedBody.includes(this.normalize(keyword)));
  }

  private normalize(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private render(template: string, values: Record<string, string>): string {
    return Object.entries(values).reduce(
      (text, [key, value]) => text.replaceAll(`{{${key}}}`, value),
      template,
    );
  }
}

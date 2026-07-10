import { Injectable } from '@nestjs/common';
import { ConversationIntent, ConversationStatus } from '@prisma/client';
import type { CompanyBotConfig, ConversationSummary, FlowDefinition, FlowField } from '@chatbot/shared';
import { AiAgentService } from '../ai/ai-agent.service';
import { AiAgentDecision } from '../ai/ai-agent.types';
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

type ConversationSignal = 'thanks' | 'capabilities' | 'goodbye' | 'low_information';

@Injectable()
export class FlowService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly companies: CompaniesService,
    private readonly aiAgent: AiAgentService,
  ) {}

  async routeInbound(input: RouteInboundInput): Promise<RoutingResult> {
    const config = await this.companies.getConfig(input.companyId);
    const existingSession = await this.prisma.flowSession.findUnique({
      where: { conversationId: input.conversationId },
    });

    if (existingSession && !existingSession.completedAt) {
      if (this.isGreetingOnly(input.body)) {
        return this.replyToGreetingInFlow(input, config, existingSession);
      }

      if (this.isStartOverFlowRequest(input.body)) {
        return this.startOverFromActiveFlow(input, config, existingSession);
      }

      if (this.isContinueFlowRequest(input.body)) {
        return this.replyWithCurrentFlowPrompt(input, config, existingSession);
      }

      if (this.isOpenFlowQuestion(input.body)) {
        return this.replyWithOpenFlowContext(input, config, existingSession);
      }

      const explicitHumanIntent = this.classifyExplicitHumanSupport(input.body, config);
      if (explicitHumanIntent) {
        return this.routeIntentFromActiveFlow(input, config, existingSession, explicitHumanIntent);
      }

      const aiResult = await this.tryRouteWithAi(input, config, existingSession);
      if (aiResult) {
        return aiResult;
      }

      const signal = this.detectConversationSignal(input.body);
      if (signal) {
        return this.replyToSignalInFlow(input, config, existingSession, signal);
      }

      const intent = await this.classify(input.companyId, input.body, config);
      if (this.shouldSwitchActiveFlow(input.body, intent, existingSession.flowKey)) {
        return this.routeIntentFromActiveFlow(input, config, existingSession, intent);
      }

      return this.continueFlow(input, config, existingSession);
    }

    const explicitHumanIntent = this.classifyExplicitHumanSupport(input.body, config);
    if (explicitHumanIntent) {
      const result = await this.routeNewIntent(input, config, explicitHumanIntent);
      await this.persistRoutingResult(input.conversationId, result);
      return result;
    }

    const aiResult = await this.tryRouteWithAi(input, config, null);
    if (aiResult) {
      return aiResult;
    }

    if (this.isGreetingOnly(input.body)) {
      const result = this.routeGreeting(config);

      await this.persistRoutingResult(input.conversationId, result);

      return result;
    }

    const signal = this.detectConversationSignal(input.body);
    if (signal) {
      const result = this.routeConversationSignal(config, signal);

      await this.persistRoutingResult(input.conversationId, result);

      return result;
    }

    const intent = await this.classify(input.companyId, input.body, config);
    const result = await this.routeNewIntent(input, config, intent);

    await this.persistRoutingResult(input.conversationId, result, intent);

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

    if (this.matchesExplicitHumanSupport(normalized, config.routingKeywords.human_support ?? [])) {
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

    if (intent === ConversationIntent.human_support) {
      return {
        reply: config.messages.humanHandoff,
        intent,
        status: ConversationStatus.needs_human,
        decision: 'human_handoff',
        summary: this.buildSummary(intent, ConversationStatus.needs_human, {}, [], 'Derivado a humano.'),
      };
    }

    return this.routeClarification(config);
  }

  private async tryRouteWithAi(
    input: RouteInboundInput,
    config: CompanyBotConfig,
    session: { flowKey: string; currentStep: number; collectedData: any } | null,
  ): Promise<RoutingResult | null> {
    try {
      const decision = await this.aiAgent.decide({
        companyId: input.companyId,
        conversationId: input.conversationId,
        body: input.body,
        config,
        activeFlow: session
          ? {
              flowKey: session.flowKey,
              currentStep: session.currentStep,
              collectedData: session.collectedData ?? {},
            }
          : null,
      });

      if (!decision) {
        return null;
      }

      return this.routeAiDecision(input, config, decision, session);
    } catch {
      return null;
    }
  }

  private async routeAiDecision(
    input: RouteInboundInput,
    config: CompanyBotConfig,
    decision: AiAgentDecision,
    session: { flowKey: string; currentStep: number; collectedData: any } | null,
  ): Promise<RoutingResult> {
    const flowKey = decision.shouldStartFlow && decision.flowKey ? decision.flowKey : null;
    const shouldCarrySessionData = Boolean(session && (!flowKey || flowKey === session.flowKey));
    const existingData = shouldCarrySessionData ? ((session?.collectedData ?? {}) as Record<string, unknown>) : {};
    const collectedData = {
      ...existingData,
      ...(decision.collectedDataPatch ?? {}),
    };

    if (flowKey && config.flows[flowKey]) {
      await this.prisma.flowSession.upsert({
        where: { conversationId: input.conversationId },
        update: {
          flowKey,
          currentStep: 0,
          collectedData: collectedData as any,
          completedAt: null,
        },
        create: {
          conversationId: input.conversationId,
          flowKey,
          currentStep: 0,
          collectedData: collectedData as any,
        },
      });
    } else if (session) {
      await this.prisma.flowSession.update({
        where: { conversationId: input.conversationId },
        data: {
          collectedData: collectedData as any,
          ...(decision.status !== ConversationStatus.waiting_customer ? { completedAt: new Date() } : {}),
        },
      });
    }

    const result: RoutingResult = {
      reply: decision.reply,
      intent: decision.intent,
      status: decision.status,
      decision: flowKey ? `ai_agent:start_flow:${flowKey}` : 'ai_agent',
      summary: this.buildSummary(
        decision.intent,
        decision.status,
        collectedData,
        flowKey && config.flows[flowKey] ? this.missingFields(config.flows[flowKey], collectedData) : [],
        decision.reason,
      ),
    };

    await this.persistRoutingResult(input.conversationId, result);
    return result;
  }

  private async persistRoutingResult(
    conversationId: string,
    result: RoutingResult,
    intent = result.intent,
  ) {
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        intent,
        status: result.status,
        summary: result.summary?.humanReadableSummary,
        collectedData: result.summary?.collectedData as any,
      },
    });
  }

  private routeConversationSignal(
    config: CompanyBotConfig,
    signal: ConversationSignal,
  ): RoutingResult {
    if (signal === 'thanks') {
      return {
        reply:
          config.messages.courtesyThanks ??
          'Gracias a ti. Si necesitas algo más, puedes escribirme por aquí.',
        intent: ConversationIntent.unknown,
        status: ConversationStatus.closed,
        decision: 'courtesy_thanks',
        summary: this.buildSummary(
          ConversationIntent.unknown,
          ConversationStatus.closed,
          {},
          [],
          'Cortesía respondida.',
        ),
      };
    }

    if (signal === 'capabilities') {
      const link = config.websiteUrl
        ? `\n\nSi quieres, también puedo orientarte usando la información de la web: ${config.websiteUrl}`
        : '';

      return {
        reply:
          this.render(
            config.messages.capabilities ??
              'Puedo ayudarte con dudas frecuentes, información sobre servicios, solicitudes a medida y recogida de datos para que el equipo pueda responder mejor.{{websiteHint}}\n\nCuéntame qué necesitas y lo vemos paso a paso.',
            { websiteHint: link },
          ),
        intent: ConversationIntent.unknown,
        status: ConversationStatus.open,
        decision: 'explain_capabilities',
        summary: this.buildSummary(
          ConversationIntent.unknown,
          ConversationStatus.open,
          {},
          [],
          'Capacidades explicadas.',
        ),
      };
    }

    if (signal === 'goodbye') {
      return {
        reply:
          config.messages.courtesyGoodbye ??
          'Perfecto, quedo por aquí si necesitas algo más.',
        intent: ConversationIntent.unknown,
        status: ConversationStatus.closed,
        decision: 'courtesy_goodbye',
        summary: this.buildSummary(
          ConversationIntent.unknown,
          ConversationStatus.closed,
          {},
          [],
          'Despedida respondida.',
        ),
      };
    }

    return this.routeClarification(config);
  }

  private routeClarification(config: CompanyBotConfig): RoutingResult {
    return {
      reply:
        config.messages.clarificationPrompt ??
        'Para ayudarte bien, necesito un poco más de contexto. ¿Buscas información general, una propuesta/presupuesto o prefieres que lo revise una persona del equipo?',
      intent: ConversationIntent.unknown,
      status: ConversationStatus.open,
      decision: 'ask_for_clarification',
      summary: this.buildSummary(
        ConversationIntent.unknown,
        ConversationStatus.open,
        {},
        [],
        'Pendiente de aclaración.',
      ),
    };
  }

  private routeGreeting(config: CompanyBotConfig): RoutingResult {
    return {
      reply: `${config.messages.greeting}\n\n¿En qué puedo ayudarte? Cuéntame qué necesitas y te oriento desde aquí.`,
      intent: ConversationIntent.unknown,
      status: ConversationStatus.open,
      decision: 'greeting',
      summary: this.buildSummary(
        ConversationIntent.unknown,
        ConversationStatus.open,
        {},
        [],
        'Saludo inicial.',
      ),
    };
  }

  private async replyToGreetingInFlow(
    input: RouteInboundInput,
    config: CompanyBotConfig,
    session: { flowKey: string; currentStep: number; collectedData: any },
  ): Promise<RoutingResult> {
    const flow = config.flows[session.flowKey];
    const intent = session.flowKey as ConversationIntent;
    const collectedData = session.collectedData ?? {};

    const summary = this.buildSummary(
      intent,
      ConversationStatus.waiting_customer,
      collectedData,
      this.missingFields(flow, collectedData),
      'Saludo durante flujo activo.',
    );

    await this.prisma.conversation.update({
      where: { id: input.conversationId },
      data: {
        intent,
        status: ConversationStatus.waiting_customer,
        collectedData,
        summary: summary.humanReadableSummary,
      },
    });

    return {
      reply: `${config.messages.greeting}\n\n${
        config.messages.flowResumePrompt ??
        'Veo que teníamos una solicitud abierta. ¿Quieres continuar con esa solicitud o empezar una consulta nueva?'
      }`,
      intent,
      status: ConversationStatus.waiting_customer,
      decision: `greeting_in_flow:${session.flowKey}`,
      summary,
    };
  }

  private async replyToSignalInFlow(
    input: RouteInboundInput,
    config: CompanyBotConfig,
    session: { flowKey: string; currentStep: number; collectedData: any },
    signal: ConversationSignal,
  ): Promise<RoutingResult> {
    const flow = config.flows[session.flowKey];
    const currentField = flow.requiredFields[session.currentStep];
    const intent = session.flowKey as ConversationIntent;
    const collectedData = session.collectedData ?? {};
    const prompt = currentField?.prompt ?? 'Cuéntame qué necesitas y te ayudo desde aquí.';
    const summary = this.buildSummary(
      intent,
      ConversationStatus.waiting_customer,
      collectedData,
      currentField ? this.missingFields(flow, collectedData) : [],
      prompt,
    );

    await this.prisma.conversation.update({
      where: { id: input.conversationId },
      data: {
        intent,
        status: ConversationStatus.waiting_customer,
        collectedData,
        summary: summary.humanReadableSummary,
      },
    });

    const replies: Record<ConversationSignal, string> = {
      thanks: `Gracias a ti. Cuando quieras, seguimos con la solicitud.\n\n${prompt}`,
      capabilities:
        `Te puedo ayudar con dudas, recoger la información necesaria y dejarlo preparado para que el equipo lo revise.\n\nTambién hay una solicitud abierta. Si quieres retomarla, responde "continuar"; si prefieres empezar de cero, responde "nueva consulta".`,
      goodbye: 'Perfecto, quedo por aquí. Si quieres retomar esta solicitud más tarde, solo tienes que escribirme.',
      low_information: `${config.messages.flowLowInformation ?? 'No pasa nada. Si no tienes todos los datos, dime lo que sepas y lo dejamos preparado para que el equipo lo revise.'}\n\n${prompt}`,
    };

    return {
      reply: replies[signal],
      intent,
      status: ConversationStatus.waiting_customer,
      decision: `conversation_signal_in_flow:${signal}:${session.flowKey}`,
      summary,
    };
  }

  private async replyWithOpenFlowContext(
    input: RouteInboundInput,
    config: CompanyBotConfig,
    session: { flowKey: string; currentStep: number; collectedData: any },
  ): Promise<RoutingResult> {
    const flow = config.flows[session.flowKey];
    const intent = session.flowKey as ConversationIntent;
    const collectedData = session.collectedData ?? {};
    const currentField = flow.requiredFields[session.currentStep];
    const summary = this.buildSummary(
      intent,
      ConversationStatus.waiting_customer,
      collectedData,
      this.missingFields(flow, collectedData),
      currentField?.prompt ?? 'Solicitud abierta.',
    );

    await this.prisma.conversation.update({
      where: { id: input.conversationId },
      data: {
        intent,
        status: ConversationStatus.waiting_customer,
        collectedData,
        summary: summary.humanReadableSummary,
      },
    });

    return {
      reply: `${this.formatOpenFlowContext(flow, session.flowKey, collectedData)}\n\nSi quieres seguir con esa solicitud, responde "continuar". Si prefieres empezar otra consulta, dime qué necesitas ahora.`,
      intent,
      status: ConversationStatus.waiting_customer,
      decision: `explain_active_flow:${session.flowKey}`,
      summary,
    };
  }

  private async routeIntentFromActiveFlow(
    input: RouteInboundInput,
    config: CompanyBotConfig,
    session: { flowKey: string },
    intent: ConversationIntent,
  ): Promise<RoutingResult> {
    const nextFlowKey = this.flowKeyForIntent(intent);

    if (!nextFlowKey) {
      await this.prisma.flowSession.update({
        where: { conversationId: input.conversationId },
        data: { completedAt: new Date() },
      });
    }

    const result = await this.routeNewIntent(input, config, intent);

    await this.prisma.conversation.update({
      where: { id: input.conversationId },
      data: {
        intent: result.intent,
        status: result.status,
        summary: result.summary?.humanReadableSummary,
        collectedData: result.summary?.collectedData as any,
      },
    });

    return {
      ...result,
      decision: nextFlowKey
        ? `switch_flow:${session.flowKey}->${nextFlowKey}`
        : `interrupt_flow:${session.flowKey}:${result.decision}`,
    };
  }

  private async replyWithCurrentFlowPrompt(
    input: RouteInboundInput,
    config: CompanyBotConfig,
    session: { flowKey: string; currentStep: number; collectedData: any },
  ): Promise<RoutingResult> {
    const flow = config.flows[session.flowKey];
    const currentField = flow.requiredFields[session.currentStep];
    const intent = session.flowKey as ConversationIntent;
    const collectedData = session.collectedData ?? {};
    const prompt = currentField?.prompt ?? 'Cuéntame qué necesitas y te ayudo desde aquí.';
    const summary = this.buildSummary(
      intent,
      ConversationStatus.waiting_customer,
      collectedData,
      currentField ? this.missingFields(flow, collectedData) : [],
      prompt,
    );

    await this.prisma.conversation.update({
      where: { id: input.conversationId },
      data: {
        intent,
        status: ConversationStatus.waiting_customer,
        collectedData,
        summary: summary.humanReadableSummary,
      },
    });

    return {
      reply: `${config.messages.flowContinuePrefix ?? 'Perfecto, seguimos.'}\n\n${prompt}`,
      intent,
      status: ConversationStatus.waiting_customer,
      decision: `repeat_flow_prompt:${session.flowKey}`,
      summary,
    };
  }

  private async startOverFromActiveFlow(
    input: RouteInboundInput,
    config: CompanyBotConfig,
    session: { flowKey: string },
  ): Promise<RoutingResult> {
    await this.prisma.flowSession.update({
      where: { conversationId: input.conversationId },
      data: {
        completedAt: new Date(),
      },
    });

    const result = this.routeGreeting(config);

    await this.prisma.conversation.update({
      where: { id: input.conversationId },
      data: {
        intent: result.intent,
        status: result.status,
        summary: 'Flujo anterior descartado por solicitud del cliente.',
        collectedData: {},
      },
    });

    return {
      ...result,
      decision: `start_over_from_flow:${session.flowKey}`,
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

  private formatOpenFlowContext(
    flow: FlowDefinition,
    flowKey: string,
    data: Record<string, unknown>,
  ): string {
    const collectedLines = flow.requiredFields
      .filter((field) => data[field.key])
      .map((field) => `- ${field.label}: ${data[field.key]}`);
    const collectedSummary =
      collectedLines.length > 0
        ? `\n\nDatos recogidos hasta ahora:\n${collectedLines.join('\n')}`
        : '';

    return `La solicitud abierta es de tipo "${this.flowLabel(flowKey)}".${collectedSummary}`;
  }

  private flowLabel(flowKey: string): string {
    if (flowKey === 'special_order') {
      return 'propuesta o solicitud a medida';
    }

    if (flowKey === 'restaurant_order') {
      return 'consulta de empresa o colaboración';
    }

    return 'consulta';
  }

  private flowKeyForIntent(intent: ConversationIntent): string | null {
    if (intent === ConversationIntent.special_order) {
      return 'special_order';
    }

    if (intent === ConversationIntent.restaurant_order) {
      return 'restaurant_order';
    }

    return null;
  }

  private classifyExplicitHumanSupport(
    body: string,
    config: CompanyBotConfig,
  ): ConversationIntent | null {
    return this.matchesExplicitHumanSupport(this.normalize(body), config.routingKeywords.human_support ?? [])
      ? ConversationIntent.human_support
      : null;
  }

  private matchesAny(normalizedBody: string, keywords: string[]): boolean {
    return keywords.some((keyword) => normalizedBody.includes(this.normalize(keyword)));
  }

  private matchesExplicitHumanSupport(normalizedBody: string, keywords: string[]): boolean {
    const explicitTerms = [
      'persona',
      'humano',
      'agente',
      'asesor',
      'operador',
      'equipo',
      'alguien',
      'atencion',
      'recepcion',
    ];

    if (explicitTerms.some((term) => normalizedBody.includes(term))) {
      return this.matchesAny(normalizedBody, keywords) || this.includesHumanSupportPhrase(normalizedBody);
    }

    return this.includesHumanSupportPhrase(normalizedBody);
  }

  private includesHumanSupportPhrase(normalizedBody: string): boolean {
    return [
      'hablar con una persona',
      'hablar con persona',
      'hablar con alguien',
      'hablar con humano',
      'quiero una persona',
      'quiero hablar con',
      'me atienda una persona',
      'me atienda alguien',
      'pasame con',
      'pasar con',
    ].some((phrase) => normalizedBody.includes(phrase));
  }

  private detectConversationSignal(value: string): ConversationSignal | null {
    if (this.isThanksOnly(value)) {
      return 'thanks';
    }

    if (this.isCapabilitiesQuestion(value)) {
      return 'capabilities';
    }

    if (this.isGoodbyeOnly(value)) {
      return 'goodbye';
    }

    if (this.isLowInformation(value)) {
      return 'low_information';
    }

    return null;
  }

  private shouldSwitchActiveFlow(
    value: string,
    intent: ConversationIntent,
    activeFlowKey: string,
  ): boolean {
    if (intent === ConversationIntent.human_support || intent === ConversationIntent.faq) {
      return true;
    }

    const targetFlowKey = this.flowKeyForIntent(intent);
    if (!targetFlowKey || targetFlowKey === activeFlowKey) {
      return false;
    }

    const normalized = this.normalizedWords(value);

    if (targetFlowKey === 'special_order') {
      return [
        'presupuesto',
        'propuesta',
        'mejorar',
        'mejorar mi web',
        'quiero mejorar',
        'quiero un presupuesto',
        'quiero una propuesta',
        'auditoria',
        'auditoría',
        'captar clientes',
        'quiero empezar',
      ].some((phrase) => normalized.includes(phrase));
    }

    if (targetFlowKey === 'restaurant_order') {
      return [
        'soy una empresa',
        'somos una empresa',
        'mi empresa',
        'partner',
        'colaboracion',
        'colaboración',
        'b2b',
      ].some((phrase) => normalized.includes(phrase));
    }

    return false;
  }

  private isOpenFlowQuestion(value: string): boolean {
    const normalized = this.normalizedWords(value);
    if (!normalized) {
      return false;
    }

    return [
      'de que trata',
      'de que iba',
      'que estaba abierta',
      'que solicitud',
      'cual era la solicitud',
      'cual es la solicitud',
      'que habia abierto',
      'que teniamos abierto',
      'que tenemos abierto',
      'que estaba pendiente',
    ].some((phrase) => normalized.includes(phrase));
  }

  private isThanksOnly(value: string): boolean {
    const normalized = this.normalizedWords(value);
    if (!normalized) {
      return false;
    }

    return [
      'gracias',
      'muchas gracias',
      'ok gracias',
      'vale gracias',
      'perfecto gracias',
      'genial gracias',
      'mil gracias',
      'thank you',
      'thanks',
    ].includes(normalized);
  }

  private isCapabilitiesQuestion(value: string): boolean {
    const normalized = this.normalizedWords(value);
    if (!normalized) {
      return false;
    }

    return [
      'que haceis',
      'que hacen',
      'a que os dedicais',
      'a que se dedican',
      'que servicios teneis',
      'que servicios ofrecen',
      'que puedes hacer',
      'en que me puedes ayudar',
      'me puedes ayudar',
      'necesito ayuda',
      'ayuda',
    ].includes(normalized);
  }

  private isGoodbyeOnly(value: string): boolean {
    const normalized = this.normalizedWords(value);
    if (!normalized) {
      return false;
    }

    return [
      'adios',
      'hasta luego',
      'nos vemos',
      'chao',
      'ciao',
      'bye',
      'hasta pronto',
    ].includes(normalized);
  }

  private isLowInformation(value: string): boolean {
    const normalized = this.normalizedWords(value);
    if (!normalized) {
      return false;
    }

    return [
      'no se',
      'no lo se',
      'no estoy seguro',
      'no estoy segura',
      'no tengo claro',
      'tengo una duda',
      'una duda',
      'duda',
      'info',
      'informacion',
    ].includes(normalized);
  }

  private isGreetingOnly(value: string): boolean {
    const normalized = this.normalize(value)
      .replace(/[^a-z0-9ñ\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!normalized) {
      return false;
    }

    const greetingPhrases = [
      'hola',
      'buenas',
      'buenos dias',
      'buen dia',
      'buenas tardes',
      'buenas noches',
      'que tal',
      'saludos',
      'hello',
      'hi',
      'hey',
    ];

    if (greetingPhrases.includes(normalized)) {
      return true;
    }

    const lowIntentWords = new Set([
      'hola',
      'buenas',
      'buenos',
      'buen',
      'dias',
      'dia',
      'tardes',
      'noches',
      'que',
      'tal',
      'saludos',
      'hello',
      'hi',
      'hey',
    ]);

    const words = normalized.split(' ');
    return words.length <= 4 && words.every((word) => lowIntentWords.has(word));
  }

  private isContinueFlowRequest(value: string): boolean {
    const normalized = this.normalizedWords(value);
    return [
      'continuar',
      'continuemos',
      'seguir',
      'seguimos',
      'sigamos',
      'sigo',
      'si',
      'vale',
      'ok',
      'okay',
    ].includes(normalized);
  }

  private isStartOverFlowRequest(value: string): boolean {
    const normalized = this.normalizedWords(value);
    return [
      'empezar de nuevo',
      'empezar otra vez',
      'otra consulta',
      'consulta nueva',
      'nueva consulta',
      'otra cosa',
      'reiniciar',
      'cancelar',
      'nuevo',
    ].includes(normalized);
  }

  private normalizedWords(value: string): string {
    return this.normalize(value)
      .replace(/[^a-z0-9ñ\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
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

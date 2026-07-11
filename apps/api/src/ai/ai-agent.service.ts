import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConversationIntent, ConversationStatus, MessageDirection } from '@prisma/client';
import { z } from 'zod';
import { PrismaService } from '../prisma/prisma.service';
import { AiAgentDecision, AiAgentInput } from './ai-agent.types';

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const MAX_KNOWLEDGE_ITEMS = 12;
const MAX_HISTORY_MESSAGES = 8;
const MIN_CONFIDENCE = 0.35;
const UNSUPPORTED_CLAIM_PATTERNS = [
  /\b\d+([.,]\d+)?\s*(€|eur|euros?|usd|\$)\b/i,
  /\b(desde|por solo|cuesta|precio fijo|tarifa)\s+\d+/i,
  /\b(en|dentro de)\s+\d+\s+(horas?|dias?|días?|semanas?|meses?)\b/i,
  /\b(garantizamos|garantia|garantía|aseguramos|sin compromiso contractual|gratis|gratuito)\b/i,
];

const aiDecisionSchema = z.object({
  reply: z.string().min(1).max(1600),
  intent: z.nativeEnum(ConversationIntent),
  status: z.nativeEnum(ConversationStatus),
  confidence: z.number().min(0).max(1),
  shouldStartFlow: z.boolean(),
  flowKey: z.string().nullable(),
  recommendedService: z.string().nullable(),
  qualificationStage: z.enum(['discovery', 'qualified', 'handoff_ready', 'not_fit', 'unknown']),
  leadTag: z.string().nullable(),
  collectedDataPatch: z.record(z.unknown()),
  needsHuman: z.boolean(),
  reason: z.string().min(1).max(600),
  usedKnowledgeIds: z.array(z.string()),
});

type KnowledgePromptItem = {
  id: string;
  question: string;
  answer: string;
  keywords: string[];
};

@Injectable()
export class AiAgentService {
  private readonly logger = new Logger(AiAgentService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  async decide(input: AiAgentInput): Promise<AiAgentDecision | null> {
    const explicitHuman = this.tryRouteExplicitHuman(input.body, input.config.messages.humanHandoff);
    if (explicitHuman) {
      return explicitHuman;
    }

    if (!this.isEnabled()) {
      return null;
    }

    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    const model = this.config.get<string>('OPENAI_MODEL');
    if (!apiKey || !model) {
      this.logger.warn('AI agent enabled but OPENAI_API_KEY or OPENAI_MODEL is missing.');
      return null;
    }

    try {
      const [knowledge, history] = await Promise.all([
        this.loadKnowledge(input.companyId),
        this.loadHistory(input.conversationId),
      ]);
      const response = await fetch(OPENAI_RESPONSES_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          input: [
            {
              role: 'system',
              content: [{ type: 'input_text', text: this.buildSystemPrompt(input, knowledge) }],
            },
            {
              role: 'user',
              content: [{ type: 'input_text', text: this.buildUserPrompt(input, history) }],
            },
          ],
          text: {
            format: {
              type: 'json_schema',
              name: 'chatbot_agent_decision',
              strict: false,
              schema: this.responseJsonSchema(),
            },
          },
        }),
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => '');
        this.logger.warn(
          `OpenAI Responses API failed: ${response.status} ${response.statusText} ${errorBody.slice(0, 500)}`,
        );
        return null;
      }

      const payload = await response.json();
      const decision = this.parseDecision(payload);
      if (!decision || decision.confidence < MIN_CONFIDENCE) {
        return null;
      }

      const normalizedDecision = this.normalizeDecision(decision, knowledge, input);
      if (!this.isDecisionWithinScope(normalizedDecision, knowledge)) {
        this.logger.warn('AI agent produced an unsupported business claim; falling back to deterministic flow.');
        return null;
      }

      return normalizedDecision;
    } catch (error) {
      this.logger.warn(`AI agent failed; falling back to deterministic flow: ${String(error)}`);
      return null;
    }
  }

  private isEnabled() {
    return Boolean(this.config.get<boolean>('AI_AGENT_ENABLED'));
  }

  private async loadKnowledge(companyId: string): Promise<KnowledgePromptItem[]> {
    const entries = await this.prisma.knowledgeBaseEntry.findMany({
      where: { companyId, isActive: true },
      orderBy: { question: 'asc' },
      take: MAX_KNOWLEDGE_ITEMS,
    });

    return entries.map((entry) => ({
      id: entry.id,
      question: entry.question,
      answer: entry.answer,
      keywords: entry.keywords,
    }));
  }

  private async loadHistory(conversationId: string) {
    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      take: MAX_HISTORY_MESSAGES,
      select: { direction: true, body: true },
    });

    return messages.reverse().map((message) => ({
      role: message.direction === MessageDirection.inbound ? 'user' : 'assistant',
      body: message.body,
    }));
  }

  private buildSystemPrompt(input: AiAgentInput, knowledge: KnowledgePromptItem[]) {
    const config = input.config;
    return [
      'Eres el agente conversacional profesional de la empresa configurada.',
      'Responde siempre en español natural, breve y útil para WhatsApp.',
      'Tu objetivo es entender la necesidad, orientar y recoger el siguiente dato útil sin sonar como un formulario.',
      'Tu alcance es estricto: puedes conversar de forma natural para entender la necesidad, pero solo puedes afirmar información concreta del negocio si aparece en la configuración o en el conocimiento autorizado.',
      'Recomienda servicios solo desde el catálogo autorizado. Si ninguno encaja, recommendedService=null y qualificationStage="discovery" o "unknown".',
      'Si un servicio encaja, explica por qué de forma breve, haz una sola pregunta útil de cualificación y rellena recommendedService con la key del servicio.',
      'Si recomiendas un servicio para una posible propuesta o lead comercial, usa intent="special_order" salvo que el usuario esté pidiendo explícitamente soporte humano.',
      'No cierres la conversación ni derives a humano solo porque el usuario mencione que el chatbot debe derivar a una persona; eso es un requisito funcional, no una petición de hablar con humano ahora.',
      'No inventes precios, rangos de precios, plazos, disponibilidad, garantías, descuentos, políticas, capacidades técnicas específicas ni servicios concretos.',
      'Si el usuario pide precio, plazo o detalle no incluido en el conocimiento autorizado, explica que depende del alcance o que no quieres inventarlo, y pide el contexto mínimo para que el equipo lo revise.',
      'No hables como ChatGPT general. No des tutoriales largos ni explicaciones abiertas salvo que ayuden a cualificar la solicitud del cliente.',
      'Si el usuario pide hablar con una persona, deriva sin insistir.',
      'Si hay una solicitud activa pero el usuario cambia claramente de tema, puedes iniciar el nuevo flujo adecuado.',
      'En preguntas fuera del negocio, responde brevemente que aquí puedes ayudar con la consulta relacionada con la empresa.',
      'Devuelve exclusivamente JSON válido con el esquema indicado.',
      '',
      `Empresa: ${config.messages.greeting.replace(/^Hola,\s*gracias por escribir a\s*/i, '').replace(/\.$/, '')}`,
      `Web: ${config.websiteUrl ?? 'no configurada'}`,
      `Email interno: ${config.internalEmail ?? 'no configurado'}`,
      `Flujos disponibles: ${Object.keys(config.flows).join(', ')}`,
      `Estado de flujo activo: ${input.activeFlow ? JSON.stringify(input.activeFlow) : 'ninguno'}`,
      '',
      'Catálogo de servicios autorizado:',
      JSON.stringify(config.serviceCatalog ?? [], null, 2),
      '',
      'Conocimiento autorizado:',
      knowledge.length > 0 ? JSON.stringify(knowledge, null, 2) : '[]',
      '',
      'Guía de decisión:',
      '- intent debe ser uno de: normal_order, special_order, restaurant_order, faq, human_support, unknown.',
      '- status debe ser open, waiting_customer, needs_human o closed.',
      '- shouldStartFlow=true solo si vas a abrir/continuar un flujo estructurado.',
      '- flowKey debe ser special_order, restaurant_order, faq o null.',
      '- recommendedService debe ser una key del catálogo autorizado o null.',
      '- qualificationStage debe indicar discovery, qualified, handoff_ready, not_fit o unknown.',
      '- leadTag debe ser el leadTag del servicio recomendado o null.',
      '- collectedDataPatch solo contiene datos que el usuario haya dado explícitamente.',
      '- usedKnowledgeIds contiene ids de conocimiento usados para responder.',
      '- Si respondes con una afirmación concreta tomada de conocimiento autorizado, incluye su id en usedKnowledgeIds.',
      '- Si no hay conocimiento suficiente, usedKnowledgeIds debe ser [] y la respuesta debe pedir contexto sin inventar.',
    ].join('\n');
  }

  private buildUserPrompt(input: AiAgentInput, history: Array<{ role: string; body: string }>) {
    return [
      `Mensaje actual del usuario: ${input.body}`,
      '',
      'Historial reciente:',
      history.length > 0 ? JSON.stringify(history, null, 2) : '[]',
    ].join('\n');
  }

  private parseDecision(payload: any): AiAgentDecision | null {
    const text = this.extractText(payload);
    if (!text) {
      return null;
    }

    try {
      const parsed = aiDecisionSchema.safeParse(JSON.parse(text));
      return parsed.success ? parsed.data : null;
    } catch {
      return null;
    }
  }

  private extractText(payload: any): string | null {
    if (typeof payload?.output_text === 'string') {
      return payload.output_text;
    }

    const output = payload?.output;
    if (!Array.isArray(output)) {
      return null;
    }

    for (const item of output) {
      for (const content of item?.content ?? []) {
        if (typeof content?.text === 'string') {
          return content.text;
        }
      }
    }

    return null;
  }

  private normalizeDecision(
    decision: AiAgentDecision,
    knowledge: KnowledgePromptItem[],
    input: AiAgentInput,
  ): AiAgentDecision {
    const allowedKnowledgeIds = new Set(knowledge.map((item) => item.id));
    const serviceCatalog = input.config.serviceCatalog ?? [];
    const recommendedService = serviceCatalog.find((service) => service.key === decision.recommendedService);
    const validFlowKey = ['special_order', 'restaurant_order', 'faq'].includes(decision.flowKey ?? '')
      ? decision.flowKey
      : null;

    return {
      ...decision,
      reply: decision.reply.trim(),
      intent:
        recommendedService && decision.intent === ConversationIntent.unknown
          ? ConversationIntent.special_order
          : decision.intent,
      needsHuman: decision.needsHuman || decision.intent === ConversationIntent.human_support,
      status:
        decision.needsHuman || decision.intent === ConversationIntent.human_support
          ? ConversationStatus.needs_human
          : decision.status,
      shouldStartFlow: decision.shouldStartFlow && Boolean(validFlowKey),
      flowKey: validFlowKey,
      recommendedService: recommendedService?.key ?? null,
      leadTag: recommendedService ? recommendedService.leadTag : null,
      usedKnowledgeIds: decision.usedKnowledgeIds.filter((id) => allowedKnowledgeIds.has(id)),
    };
  }

  private isDecisionWithinScope(
    decision: AiAgentDecision,
    knowledge: KnowledgePromptItem[],
  ): boolean {
    if (decision.usedKnowledgeIds.length > 0) {
      return true;
    }

    const authorizedText = this.normalize(
      [
        ...knowledge.flatMap((item) => [item.question, item.answer, ...item.keywords]),
        decision.reason,
      ].join(' '),
    );
    const reply = this.normalize(decision.reply);

    return !UNSUPPORTED_CLAIM_PATTERNS.some((pattern) => {
      if (!pattern.test(reply)) {
        return false;
      }

      return !pattern.test(authorizedText);
    });
  }

  private tryRouteExplicitHuman(body: string, humanHandoffMessage: string): AiAgentDecision | null {
    const normalized = this.normalize(body);
    const explicit = [
      'hablar con una persona',
      'hablar con persona',
      'hablar con alguien',
      'hablar con humano',
      'quiero hablar con',
      'me atienda una persona',
      'me atienda alguien',
    ].some((phrase) => normalized.includes(phrase));

    if (!explicit) {
      return null;
    }

    return {
      reply: humanHandoffMessage,
      intent: ConversationIntent.human_support,
      status: ConversationStatus.needs_human,
      confidence: 1,
      shouldStartFlow: false,
      flowKey: null,
      recommendedService: null,
      qualificationStage: 'handoff_ready',
      leadTag: 'human_support',
      collectedDataPatch: {},
      needsHuman: true,
      reason: 'El usuario pidió explícitamente hablar con una persona.',
      usedKnowledgeIds: [],
    };
  }

  private normalize(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private responseJsonSchema() {
    return {
      type: 'object',
      additionalProperties: false,
      required: [
        'reply',
        'intent',
        'status',
        'confidence',
        'shouldStartFlow',
        'flowKey',
        'recommendedService',
        'qualificationStage',
        'leadTag',
        'collectedDataPatch',
        'needsHuman',
        'reason',
        'usedKnowledgeIds',
      ],
      properties: {
        reply: { type: 'string' },
        intent: {
          type: 'string',
          enum: Object.values(ConversationIntent),
        },
        status: {
          type: 'string',
          enum: Object.values(ConversationStatus),
        },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        shouldStartFlow: { type: 'boolean' },
        flowKey: { type: ['string', 'null'] },
        recommendedService: { type: ['string', 'null'] },
        qualificationStage: {
          type: 'string',
          enum: ['discovery', 'qualified', 'handoff_ready', 'not_fit', 'unknown'],
        },
        leadTag: { type: ['string', 'null'] },
        collectedDataPatch: {
          type: 'object',
          additionalProperties: true,
        },
        needsHuman: { type: 'boolean' },
        reason: { type: 'string' },
        usedKnowledgeIds: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    };
  }
}

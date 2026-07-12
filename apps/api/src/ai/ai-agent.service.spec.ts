import { ConversationIntent, ConversationStatus } from '@prisma/client';
import { testCompanyConfig } from '../../test/fixtures/company-config';
import { AiAgentService } from './ai-agent.service';

describe('AiAgentService', () => {
  const originalFetch = global.fetch;
  const config = {
    get: jest.fn(),
  };
  const prisma = {
    knowledgeBaseEntry: {
      findMany: jest.fn(),
    },
    message: {
      findMany: jest.fn(),
    },
  };

  const validDecision = {
    reply:
      'Tiene sentido. Para hacerlo fácil, elige lo más parecido:\n1. Responder FAQs\n2. Derivar a URLs\n3. Pasar a persona',
    intent: ConversationIntent.special_order,
    status: ConversationStatus.open,
    confidence: 0.87,
    shouldStartFlow: false,
    flowKey: null,
    recommendedService: 'whatsapp_chatbot',
    qualificationStage: 'discovery',
    leadTag: 'service:whatsapp_chatbot',
    collectedDataPatch: { need: 'chatbot inteligente' },
    needsHuman: false,
    reason: 'La IA entendió una consulta comercial.',
    usedKnowledgeIds: ['faq-1'],
  };

  let service: AiAgentService;

  beforeEach(() => {
    jest.clearAllMocks();
    config.get.mockImplementation((key: string) => {
      const values: Record<string, unknown> = {
        AI_AGENT_ENABLED: true,
        OPENAI_API_KEY: 'test-key',
        OPENAI_MODEL: 'gpt-test',
      };
      return values[key];
    });
    prisma.knowledgeBaseEntry.findMany.mockResolvedValue([
      {
        id: 'faq-1',
        question: '¿Hacéis chatbots?',
        answer: 'Sí, diseñamos chatbots para webs y WhatsApp.',
        keywords: ['chatbot', 'web'],
      },
    ]);
    prisma.message.findMany.mockResolvedValue([]);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ output_text: JSON.stringify(validDecision) }),
    }) as unknown as typeof fetch;
    service = new AiAgentService(config as any, prisma as any);
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('returns a valid structured decision from OpenAI', async () => {
    const decision = await service.decide({
      companyId: 'company-1',
      conversationId: 'conversation-1',
      body: 'Necesito un chatbot inteligente para mi website',
      config: testCompanyConfig,
      activeFlow: null,
    });

    expect(decision).toEqual(validDecision);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.openai.com/v1/responses',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-key',
        }),
      }),
    );
  });

  it('returns null when the AI output is invalid', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ output_text: '{"reply":""}' }),
    }) as unknown as typeof fetch;

    const decision = await service.decide({
      companyId: 'company-1',
      conversationId: 'conversation-1',
      body: 'Necesito algo',
      config: testCompanyConfig,
      activeFlow: null,
    });

    expect(decision).toBeNull();
  });

  it('passes active knowledge entries into the prompt', async () => {
    await service.decide({
      companyId: 'company-1',
      conversationId: 'conversation-1',
      body: '¿Hacéis chatbots?',
      config: testCompanyConfig,
      activeFlow: null,
    });

    const requestBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    const systemPrompt = requestBody.input[0].content[0].text;

    expect(systemPrompt).toContain('faq-1');
    expect(systemPrompt).toContain('¿Hacéis chatbots?');
    expect(systemPrompt).toContain('Sí, diseñamos chatbots para webs y WhatsApp.');
    expect(systemPrompt).toContain('Tu alcance es estricto');
    expect(systemPrompt).toContain('No inventes precios');
    expect(systemPrompt).toContain('Catálogo de servicios autorizado');
    expect(systemPrompt).toContain('whatsapp_chatbot');
  });

  it('normalizes recommended service and lead tag from the authorized catalog', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        output_text: JSON.stringify({
          ...validDecision,
          intent: ConversationIntent.unknown,
          recommendedService: 'whatsapp_chatbot',
          leadTag: 'wrong-tag',
        }),
      }),
    }) as unknown as typeof fetch;

    const decision = await service.decide({
      companyId: 'company-1',
      conversationId: 'conversation-1',
      body: 'Necesito un chatbot de WhatsApp',
      config: testCompanyConfig,
      activeFlow: null,
    });

    expect(decision?.recommendedService).toBe('whatsapp_chatbot');
    expect(decision?.intent).toBe(ConversationIntent.special_order);
    expect(decision?.leadTag).toBe('service:whatsapp_chatbot');
  });

  it('adds guided options when a discovery reply is too open', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        output_text: JSON.stringify({
          ...validDecision,
          reply: 'Perfecto, encaja con un chatbot de WhatsApp. ¿Qué necesitas que haga principalmente?',
        }),
      }),
    }) as unknown as typeof fetch;

    const decision = await service.decide({
      companyId: 'company-1',
      conversationId: 'conversation-1',
      body: 'Necesito un chatbot para WhatsApp',
      config: testCompanyConfig,
      activeFlow: null,
    });

    expect(decision?.reply).toContain('Para hacerlo fácil');
    expect(decision?.reply).toContain('1. Responder FAQs');
    expect(decision?.reply).toContain('2. Derivar a URLs');
    expect(decision?.reply).toContain('3. Pasar a persona');
  });

  it('adds pricing context options for price requests', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        output_text: JSON.stringify({
          ...validDecision,
          reply: 'Depende del alcance, así que prefiero no inventarte un precio.',
          usedKnowledgeIds: [],
        }),
      }),
    }) as unknown as typeof fetch;

    const decision = await service.decide({
      companyId: 'company-1',
      conversationId: 'conversation-1',
      body: 'Cuánto cuesta',
      config: testCompanyConfig,
      activeFlow: null,
    });

    expect(decision?.reply).toContain('Para orientarlo sin inventar precio');
    expect(decision?.reply).toContain('1. Bot simple');
    expect(decision?.reply).toContain('2. Bot guiado');
    expect(decision?.reply).toContain('3. Bot avanzado');
  });

  it('rejects unsupported price claims from the AI response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        output_text: JSON.stringify({
          ...validDecision,
          reply: 'Un chatbot cuesta 300€ y lo podemos tener listo en 3 días.',
          usedKnowledgeIds: [],
        }),
      }),
    }) as unknown as typeof fetch;

    const decision = await service.decide({
      companyId: 'company-1',
      conversationId: 'conversation-1',
      body: '¿Cuánto cuesta un chatbot?',
      config: testCompanyConfig,
      activeFlow: null,
    });

    expect(decision).toBeNull();
  });

  it('allows price claims when they are backed by authorized knowledge', async () => {
    prisma.knowledgeBaseEntry.findMany.mockResolvedValueOnce([
      {
        id: 'faq-price',
        question: '¿Cuánto cuesta un chatbot?',
        answer: 'Los chatbots empiezan desde 300€ cuando el alcance es básico.',
        keywords: ['precio', 'chatbot'],
      },
    ]);
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        output_text: JSON.stringify({
          ...validDecision,
          reply: 'Según la información disponible, los chatbots empiezan desde 300€ cuando el alcance es básico.',
          usedKnowledgeIds: ['faq-price'],
        }),
      }),
    }) as unknown as typeof fetch;

    const decision = await service.decide({
      companyId: 'company-1',
      conversationId: 'conversation-1',
      body: '¿Cuánto cuesta un chatbot?',
      config: testCompanyConfig,
      activeFlow: null,
    });

    expect(decision?.reply).toContain('300€');
    expect(decision?.usedKnowledgeIds).toEqual(['faq-price']);
  });

  it('routes explicit human requests without calling OpenAI', async () => {
    const decision = await service.decide({
      companyId: 'company-1',
      conversationId: 'conversation-1',
      body: 'quiero hablar con una persona',
      config: testCompanyConfig,
      activeFlow: null,
    });

    expect(decision).toEqual({
      reply: testCompanyConfig.messages.humanHandoff,
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
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns null when the AI agent is disabled', async () => {
    config.get.mockImplementation((key: string) => {
      if (key === 'AI_AGENT_ENABLED') {
        return false;
      }

      return '';
    });

    const decision = await service.decide({
      companyId: 'company-1',
      conversationId: 'conversation-1',
      body: 'hola',
      config: testCompanyConfig,
      activeFlow: null,
    });

    expect(decision).toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

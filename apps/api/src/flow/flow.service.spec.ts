import { ConversationIntent, ConversationStatus } from '@prisma/client';
import { testCompanyConfig } from '../../test/fixtures/company-config';
import { FlowService } from './flow.service';

describe('FlowService', () => {
  const prisma = {
    knowledgeBaseEntry: {
      findMany: jest.fn().mockResolvedValue([]),
    },
    flowSession: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    conversation: {
      update: jest.fn(),
    },
  };

  const companies = {
    getConfig: jest.fn().mockResolvedValue(testCompanyConfig),
  };

  const aiAgent = {
    decide: jest.fn(),
  };

  let service: FlowService;

  beforeEach(() => {
    jest.clearAllMocks();
    companies.getConfig.mockResolvedValue(testCompanyConfig);
    aiAgent.decide.mockResolvedValue(null);
    service = new FlowService(prisma as any, companies as any, aiAgent as any);
  });

  it('classifies special cake requests from configurable keywords', async () => {
    await expect(
      service.classify('company-1', 'Quiero una tarta de comunión', testCompanyConfig),
    ).resolves.toBe(ConversationIntent.special_order);
  });

  it('keeps special cake requests with servings out of human handoff', async () => {
    await expect(
      service.classify(
        'company-1',
        'Hola, quiero una tarta de comunion para 20 personas',
        testCompanyConfig,
      ),
    ).resolves.toBe(ConversationIntent.special_order);
  });

  it('classifies restaurant requests from configurable keywords', async () => {
    await expect(
      service.classify('company-1', 'Necesito hacer un pedido por mayor para restaurante', testCompanyConfig),
    ).resolves.toBe(ConversationIntent.restaurant_order);
  });

  it('answers normal orders with the configured redirect link', async () => {
    prisma.flowSession.findUnique.mockResolvedValue(null);

    const result = await service.routeInbound({
      companyId: 'company-1',
      conversationId: 'conversation-1',
      contactId: 'contact-1',
      channel: 'whatsapp',
      from: 'whatsapp:+1',
      body: 'quiero comprar',
    });

    expect(result.intent).toBe(ConversationIntent.normal_order);
    expect(result.reply).toContain('https://example.com/order');
    expect(result.decision).toBe('redirect_to_online_store');
  });

  it('answers a plain greeting without starting or handing off a flow', async () => {
    prisma.flowSession.findUnique.mockResolvedValue(null);

    const result = await service.routeInbound({
      companyId: 'company-1',
      conversationId: 'conversation-1',
      contactId: 'contact-1',
      channel: 'whatsapp',
      from: 'whatsapp:+1',
      body: 'Hola',
    });

    expect(result.intent).toBe(ConversationIntent.unknown);
    expect(result.decision).toBe('greeting');
    expect(result.reply).toContain('¿En qué puedo ayudarte?');
    expect(result.reply).not.toContain('Te deriva una persona');
    expect(prisma.flowSession.upsert).not.toHaveBeenCalled();
  });

  it('explains capabilities for broad help requests instead of handing off', async () => {
    prisma.flowSession.findUnique.mockResolvedValue(null);

    const result = await service.routeInbound({
      companyId: 'company-1',
      conversationId: 'conversation-1',
      contactId: 'contact-1',
      channel: 'whatsapp',
      from: 'whatsapp:+1',
      body: 'necesito ayuda',
    });

    expect(result.intent).toBe(ConversationIntent.unknown);
    expect(result.status).toBe(ConversationStatus.open);
    expect(result.decision).toBe('explain_capabilities');
    expect(result.reply).toContain('Cuéntame qué necesitas');
    expect(result.reply).not.toContain('Te deriva una persona');
  });

  it('asks for clarification on unknown messages instead of escalating immediately', async () => {
    prisma.flowSession.findUnique.mockResolvedValue(null);

    const result = await service.routeInbound({
      companyId: 'company-1',
      conversationId: 'conversation-1',
      contactId: 'contact-1',
      channel: 'whatsapp',
      from: 'whatsapp:+1',
      body: 'mmm',
    });

    expect(result.intent).toBe(ConversationIntent.unknown);
    expect(result.status).toBe(ConversationStatus.open);
    expect(result.decision).toBe('ask_for_clarification');
    expect(result.reply).toContain('necesito un poco más de contexto');
  });

  it('uses the AI agent decision before deterministic keyword routing', async () => {
    prisma.flowSession.findUnique.mockResolvedValue(null);
    aiAgent.decide.mockResolvedValueOnce({
      reply:
        'Tiene sentido. Para orientarte bien, dime qué objetivo tiene el chatbot y en qué web lo quieres instalar.',
      intent: ConversationIntent.special_order,
      status: ConversationStatus.open,
      confidence: 0.88,
      shouldStartFlow: false,
      flowKey: null,
      collectedDataPatch: { need: 'chatbot inteligente para website' },
      needsHuman: false,
      reason: 'Consulta cualificada por IA.',
      usedKnowledgeIds: [],
    });

    const result = await service.routeInbound({
      companyId: 'company-1',
      conversationId: 'conversation-1',
      contactId: 'contact-1',
      channel: 'whatsapp',
      from: 'whatsapp:+1',
      body: 'Necesito un chatbot inteligente para mi website',
    });

    expect(result.decision).toBe('ai_agent');
    expect(result.reply).toContain('objetivo');
    expect(result.summary?.collectedData).toEqual({ need: 'chatbot inteligente para website' });
    expect(prisma.conversation.update).toHaveBeenCalledWith({
      where: { id: 'conversation-1' },
      data: expect.objectContaining({
        intent: ConversationIntent.special_order,
        status: ConversationStatus.open,
        summary: 'Consulta cualificada por IA.',
        collectedData: { need: 'chatbot inteligente para website' },
      }),
    });
  });

  it('falls back to deterministic routing when the AI agent returns null', async () => {
    prisma.flowSession.findUnique.mockResolvedValue(null);
    aiAgent.decide.mockResolvedValueOnce(null);

    const result = await service.routeInbound({
      companyId: 'company-1',
      conversationId: 'conversation-1',
      contactId: 'contact-1',
      channel: 'whatsapp',
      from: 'whatsapp:+1',
      body: 'Hola',
    });

    expect(aiAgent.decide).toHaveBeenCalled();
    expect(result.decision).toBe('greeting');
  });

  it('falls back to deterministic routing when the AI agent throws', async () => {
    prisma.flowSession.findUnique.mockResolvedValue(null);
    aiAgent.decide.mockRejectedValueOnce(new Error('OpenAI unavailable'));

    const result = await service.routeInbound({
      companyId: 'company-1',
      conversationId: 'conversation-1',
      contactId: 'contact-1',
      channel: 'whatsapp',
      from: 'whatsapp:+1',
      body: 'mmm',
    });

    expect(result.decision).toBe('ask_for_clarification');
    expect(result.status).toBe(ConversationStatus.open);
  });

  it('lets the AI agent start a structured flow with explicit user data', async () => {
    prisma.flowSession.findUnique.mockResolvedValue(null);
    aiAgent.decide.mockResolvedValueOnce({
      reply: 'Perfecto. Para preparar una propuesta, dime qué web quieres mejorar.',
      intent: ConversationIntent.special_order,
      status: ConversationStatus.waiting_customer,
      confidence: 0.91,
      shouldStartFlow: true,
      flowKey: 'special_order',
      collectedDataPatch: { objective: 'mejorar mi web' },
      needsHuman: false,
      reason: 'La IA abrió una solicitud a medida.',
      usedKnowledgeIds: [],
    });

    const result = await service.routeInbound({
      companyId: 'company-1',
      conversationId: 'conversation-1',
      contactId: 'contact-1',
      channel: 'whatsapp',
      from: 'whatsapp:+1',
      body: 'quiero mejorar mi web',
    });

    expect(result.decision).toBe('ai_agent:start_flow:special_order');
    expect(result.summary?.missingFields).toEqual(['date', 'servings']);
    expect(prisma.flowSession.upsert).toHaveBeenCalledWith({
      where: { conversationId: 'conversation-1' },
      update: {
        flowKey: 'special_order',
        currentStep: 0,
        collectedData: { objective: 'mejorar mi web' },
        completedAt: null,
      },
      create: {
        conversationId: 'conversation-1',
        flowKey: 'special_order',
        currentStep: 0,
        collectedData: { objective: 'mejorar mi web' },
      },
    });
  });

  it('uses configured deterministic conversation messages when present', async () => {
    prisma.flowSession.findUnique.mockResolvedValue(null);
    companies.getConfig.mockResolvedValueOnce({
      ...testCompanyConfig,
      messages: {
        ...testCompanyConfig.messages,
        clarificationPrompt: 'Mensaje de aclaración configurable.',
      },
    });

    const result = await service.routeInbound({
      companyId: 'company-1',
      conversationId: 'conversation-1',
      contactId: 'contact-1',
      channel: 'whatsapp',
      from: 'whatsapp:+1',
      body: 'mmm',
    });

    expect(result.decision).toBe('ask_for_clarification');
    expect(result.reply).toBe('Mensaje de aclaración configurable.');
  });

  it('responds to courtesy messages without escalating', async () => {
    prisma.flowSession.findUnique.mockResolvedValue(null);

    const result = await service.routeInbound({
      companyId: 'company-1',
      conversationId: 'conversation-1',
      contactId: 'contact-1',
      channel: 'whatsapp',
      from: 'whatsapp:+1',
      body: 'ok gracias',
    });

    expect(result.intent).toBe(ConversationIntent.unknown);
    expect(result.status).toBe(ConversationStatus.closed);
    expect(result.decision).toBe('courtesy_thanks');
    expect(result.reply).toContain('Gracias a ti');
  });

  it('only hands off when the customer explicitly asks for a person', async () => {
    prisma.flowSession.findUnique.mockResolvedValue(null);

    const result = await service.routeInbound({
      companyId: 'company-1',
      conversationId: 'conversation-1',
      contactId: 'contact-1',
      channel: 'whatsapp',
      from: 'whatsapp:+1',
      body: 'quiero hablar con una persona',
    });

    expect(result.intent).toBe(ConversationIntent.human_support);
    expect(result.status).toBe(ConversationStatus.needs_human);
    expect(result.decision).toBe('human_handoff');
    expect(result.reply).toContain('Te deriva una persona');
    expect(aiAgent.decide).not.toHaveBeenCalled();
  });

  it('does not hand off when a person is mentioned as a chatbot routing requirement', async () => {
    prisma.flowSession.findUnique.mockResolvedValue(null);
    aiAgent.decide.mockResolvedValueOnce({
      reply:
        'Eso encaja con un chatbot de WhatsApp con rutas por intención. ¿Qué necesidades quieres distinguir y a qué URL o persona debería ir cada una?',
      intent: ConversationIntent.special_order,
      status: ConversationStatus.open,
      confidence: 0.9,
      shouldStartFlow: false,
      flowKey: null,
      recommendedService: 'whatsapp_chatbot',
      qualificationStage: 'discovery',
      leadTag: 'service:whatsapp_chatbot',
      collectedDataPatch: {
        channel: 'whatsapp',
        requirement: 'redirigir según necesidad a URLs o persona real',
      },
      needsHuman: false,
      reason: 'Requisito funcional de chatbot, no solicitud de handoff.',
      usedKnowledgeIds: [],
    });

    const result = await service.routeInbound({
      companyId: 'company-1',
      conversationId: 'conversation-1',
      contactId: 'contact-1',
      channel: 'whatsapp',
      from: 'whatsapp:+1',
      body: 'Para que sea en whatsap y redirija según necesidad a diferentes URL o a una persona real',
    });

    expect(result.intent).toBe(ConversationIntent.special_order);
    expect(result.status).toBe(ConversationStatus.open);
    expect(result.decision).toBe('ai_agent');
    expect(result.reply).toContain('rutas por intención');
    expect(result.summary?.collectedData).toEqual(
      expect.objectContaining({
        recommendedService: 'whatsapp_chatbot',
        qualificationStage: 'discovery',
        leadTag: 'service:whatsapp_chatbot',
      }),
    );
    expect(aiAgent.decide).toHaveBeenCalled();
  });

  it('starts a structured flow for special orders', async () => {
    prisma.flowSession.findUnique.mockResolvedValue(null);

    const result = await service.routeInbound({
      companyId: 'company-1',
      conversationId: 'conversation-1',
      contactId: 'contact-1',
      channel: 'whatsapp',
      from: 'whatsapp:+1',
      body: 'quiero una tarta',
    });

    expect(result.intent).toBe(ConversationIntent.special_order);
    expect(result.reply).toContain('¿Qué fecha?');
    expect(prisma.flowSession.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ flowKey: 'special_order' }),
      }),
    );
  });

  it('shows quick reply options for configured flow fields', async () => {
    prisma.flowSession.findUnique.mockResolvedValue({
      conversationId: 'conversation-1',
      flowKey: 'special_order',
      currentStep: 0,
      collectedData: {},
      completedAt: null,
    });

    const result = await service.routeInbound({
      companyId: 'company-1',
      conversationId: 'conversation-1',
      contactId: 'contact-1',
      channel: 'whatsapp',
      from: 'whatsapp:+1',
      body: '12 de agosto',
    });

    expect(result.decision).toBe('continue_flow:special_order');
    expect(result.reply).toContain('Respuesta rápida:');
    expect(result.reply).toContain('1. 10-15 personas');
    expect(result.reply).toContain('2. 20-25 personas');
  });

  it('reviews collected data before completing a flow', async () => {
    prisma.flowSession.findUnique.mockResolvedValue({
      conversationId: 'conversation-1',
      flowKey: 'special_order',
      currentStep: 1,
      collectedData: { date: '12 de agosto' },
      completedAt: null,
    });

    const result = await service.routeInbound({
      companyId: 'company-1',
      conversationId: 'conversation-1',
      contactId: 'contact-1',
      channel: 'whatsapp',
      from: 'whatsapp:+1',
      body: '2',
    });

    expect(result.decision).toBe('review_flow:special_order');
    expect(result.status).toBe(ConversationStatus.waiting_customer);
    expect(result.reply).toContain('Revisa que esté todo bien');
    expect(result.reply).toContain('Fecha\n12 de agosto');
    expect(result.reply).toContain('Personas\n20-25 personas');
    expect(result.reply).toContain('responde "enviar"');
    expect(prisma.flowSession.update).toHaveBeenCalledWith({
      where: { conversationId: 'conversation-1' },
      data: {
        currentStep: 2,
        collectedData: { date: '12 de agosto', servings: '20-25 personas' },
      },
    });
  });

  it('completes a reviewed flow only after explicit submit confirmation', async () => {
    prisma.flowSession.findUnique.mockResolvedValue({
      conversationId: 'conversation-1',
      flowKey: 'special_order',
      currentStep: 2,
      collectedData: { date: '12 de agosto', servings: '20-25 personas' },
      completedAt: null,
    });

    const result = await service.routeInbound({
      companyId: 'company-1',
      conversationId: 'conversation-1',
      contactId: 'contact-1',
      channel: 'whatsapp',
      from: 'whatsapp:+1',
      body: 'enviar',
    });

    expect(result.decision).toBe('complete_flow:special_order');
    expect(result.status).toBe(ConversationStatus.needs_human);
    expect(result.reply).toContain('Solicitud recibida.');
    expect(result.reply).toContain('Resumen de la solicitud');
    expect(prisma.flowSession.update).toHaveBeenCalledWith({
      where: { conversationId: 'conversation-1' },
      data: {
        collectedData: { date: '12 de agosto', servings: '20-25 personas' },
        completedAt: expect.any(Date),
      },
    });
  });

  it('lets the customer correct a reviewed field before submit', async () => {
    prisma.flowSession.findUnique.mockResolvedValue({
      conversationId: 'conversation-1',
      flowKey: 'special_order',
      currentStep: 2,
      collectedData: { date: '12 de agosto', servings: '20-25 personas' },
      completedAt: null,
    });

    const result = await service.routeInbound({
      companyId: 'company-1',
      conversationId: 'conversation-1',
      contactId: 'contact-1',
      channel: 'whatsapp',
      from: 'whatsapp:+1',
      body: 'Personas: 3',
    });

    expect(result.decision).toBe('review_flow_update:special_order:servings');
    expect(result.reply).toContain('He actualizado el dato');
    expect(result.reply).toContain('Personas\nMás de 25 personas');
    expect(prisma.flowSession.update).toHaveBeenCalledWith({
      where: { conversationId: 'conversation-1' },
      data: {
        collectedData: { date: '12 de agosto', servings: 'Más de 25 personas' },
      },
    });
  });

  it('does not consume a greeting or ask for a field inside an active flow', async () => {
    prisma.flowSession.findUnique.mockResolvedValue({
      conversationId: 'conversation-1',
      flowKey: 'restaurant_order',
      currentStep: 0,
      collectedData: {},
      completedAt: null,
    });

    const result = await service.routeInbound({
      companyId: 'company-1',
      conversationId: 'conversation-1',
      contactId: 'contact-1',
      channel: 'whatsapp',
      from: 'whatsapp:+1',
      body: 'hola',
    });

    expect(result.intent).toBe(ConversationIntent.restaurant_order);
    expect(result.decision).toBe('greeting_in_flow:restaurant_order');
    expect(result.reply).toContain('¿Quieres continuar');
    expect(result.reply).not.toContain('Nombre restaurante');
    expect(result.reply).not.toContain('Productos y cantidades');
    expect(prisma.flowSession.update).not.toHaveBeenCalled();
  });

  it('explains what the open flow is without consuming the message', async () => {
    prisma.flowSession.findUnique.mockResolvedValue({
      conversationId: 'conversation-1',
      flowKey: 'restaurant_order',
      currentStep: 1,
      collectedData: { businessName: 'Empresa Demo' },
      completedAt: null,
    });

    const result = await service.routeInbound({
      companyId: 'company-1',
      conversationId: 'conversation-1',
      contactId: 'contact-1',
      channel: 'whatsapp',
      from: 'whatsapp:+1',
      body: 'de que trata la que estaba abierta?',
    });

    expect(result.decision).toBe('explain_active_flow:restaurant_order');
    expect(result.reply).toContain('consulta de empresa');
    expect(result.reply).toContain('Empresa Demo');
    expect(result.reply).toContain('continuar');
    expect(prisma.flowSession.update).not.toHaveBeenCalled();
  });

  it('answers capabilities inside a flow without pushing the pending field', async () => {
    prisma.flowSession.findUnique.mockResolvedValue({
      conversationId: 'conversation-1',
      flowKey: 'restaurant_order',
      currentStep: 0,
      collectedData: {},
      completedAt: null,
    });

    const result = await service.routeInbound({
      companyId: 'company-1',
      conversationId: 'conversation-1',
      contactId: 'contact-1',
      channel: 'whatsapp',
      from: 'whatsapp:+1',
      body: 'qué hacéis?',
    });

    expect(result.decision).toBe('conversation_signal_in_flow:capabilities:restaurant_order');
    expect(result.reply).toContain('Te puedo ayudar');
    expect(result.reply).toContain('continuar');
    expect(result.reply).not.toContain('Nombre restaurante');
    expect(prisma.flowSession.update).not.toHaveBeenCalled();
  });

  it('switches to a clearly requested new flow instead of consuming it as old data', async () => {
    prisma.flowSession.findUnique.mockResolvedValue({
      conversationId: 'conversation-1',
      flowKey: 'restaurant_order',
      currentStep: 1,
      collectedData: { businessName: 'Empresa Demo' },
      completedAt: null,
    });
    companies.getConfig.mockResolvedValueOnce({
      ...testCompanyConfig,
      routingKeywords: {
        ...testCompanyConfig.routingKeywords,
        special_order: [...testCompanyConfig.routingKeywords.special_order, 'presupuesto'],
      },
    });

    const result = await service.routeInbound({
      companyId: 'company-1',
      conversationId: 'conversation-1',
      contactId: 'contact-1',
      channel: 'whatsapp',
      from: 'whatsapp:+1',
      body: 'quiero un presupuesto',
    });

    expect(result.intent).toBe(ConversationIntent.special_order);
    expect(result.decision).toBe('switch_flow:restaurant_order->special_order');
    expect(result.reply).toContain('Datos para tarta especial');
    expect(prisma.flowSession.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          flowKey: 'special_order',
          currentStep: 0,
          collectedData: {},
          completedAt: null,
        }),
      }),
    );
  });

  it('lets the AI agent handle a topic change in an active flow without consuming old data', async () => {
    prisma.flowSession.findUnique.mockResolvedValue({
      conversationId: 'conversation-1',
      flowKey: 'restaurant_order',
      currentStep: 1,
      collectedData: { businessName: 'Empresa Demo' },
      completedAt: null,
    });
    aiAgent.decide.mockResolvedValueOnce({
      reply: 'Claro. Aparco la consulta anterior y te ayudo con la web. ¿Cuál es el objetivo principal?',
      intent: ConversationIntent.special_order,
      status: ConversationStatus.waiting_customer,
      confidence: 0.86,
      shouldStartFlow: true,
      flowKey: 'special_order',
      collectedDataPatch: { objective: 'mejorar web' },
      needsHuman: false,
      reason: 'Cambio de tema detectado por IA.',
      usedKnowledgeIds: [],
    });

    const result = await service.routeInbound({
      companyId: 'company-1',
      conversationId: 'conversation-1',
      contactId: 'contact-1',
      channel: 'whatsapp',
      from: 'whatsapp:+1',
      body: 'quiero mejorar mi web',
    });

    expect(result.decision).toBe('ai_agent:start_flow:special_order');
    expect(prisma.flowSession.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          flowKey: 'special_order',
          collectedData: {
            objective: 'mejorar web',
          },
        }),
      }),
    );
    expect(prisma.flowSession.update).not.toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ collectedData: expect.objectContaining({ items: 'quiero mejorar mi web' }) }),
      }),
    );
  });

  it('repeats the pending prompt when the customer asks to continue a flow', async () => {
    prisma.flowSession.findUnique.mockResolvedValue({
      conversationId: 'conversation-1',
      flowKey: 'restaurant_order',
      currentStep: 0,
      collectedData: {},
      completedAt: null,
    });

    const result = await service.routeInbound({
      companyId: 'company-1',
      conversationId: 'conversation-1',
      contactId: 'contact-1',
      channel: 'whatsapp',
      from: 'whatsapp:+1',
      body: 'continuar',
    });

    expect(result.decision).toBe('repeat_flow_prompt:restaurant_order');
    expect(result.reply).toContain('Nombre restaurante');
    expect(prisma.flowSession.update).not.toHaveBeenCalled();
  });

  it('does not consume low-information messages inside an active flow', async () => {
    prisma.flowSession.findUnique.mockResolvedValue({
      conversationId: 'conversation-1',
      flowKey: 'restaurant_order',
      currentStep: 0,
      collectedData: {},
      completedAt: null,
    });

    const result = await service.routeInbound({
      companyId: 'company-1',
      conversationId: 'conversation-1',
      contactId: 'contact-1',
      channel: 'whatsapp',
      from: 'whatsapp:+1',
      body: 'no sé',
    });

    expect(result.decision).toBe('conversation_signal_in_flow:low_information:restaurant_order');
    expect(result.reply).toContain('No pasa nada');
    expect(result.reply).toContain('Nombre restaurante');
    expect(prisma.flowSession.update).not.toHaveBeenCalled();
  });

  it('lets the customer start over from an active flow', async () => {
    prisma.flowSession.findUnique.mockResolvedValue({
      conversationId: 'conversation-1',
      flowKey: 'restaurant_order',
      currentStep: 0,
      collectedData: {},
      completedAt: null,
    });

    const result = await service.routeInbound({
      companyId: 'company-1',
      conversationId: 'conversation-1',
      contactId: 'contact-1',
      channel: 'whatsapp',
      from: 'whatsapp:+1',
      body: 'otra consulta',
    });

    expect(result.decision).toBe('start_over_from_flow:restaurant_order');
    expect(result.reply).toContain('¿En qué puedo ayudarte?');
    expect(prisma.flowSession.update).toHaveBeenCalledWith({
      where: { conversationId: 'conversation-1' },
      data: { completedAt: expect.any(Date) },
    });
  });
});

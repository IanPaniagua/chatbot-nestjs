import { ConversationIntent } from '@prisma/client';
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

  let service: FlowService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new FlowService(prisma as any, companies as any);
  });

  it('classifies special cake requests from configurable keywords', async () => {
    await expect(
      service.classify('company-1', 'Quiero una tarta de comunión', testCompanyConfig),
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
});

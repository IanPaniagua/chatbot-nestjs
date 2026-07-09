import { TwilioWebhookController } from './twilio-webhook.controller';

describe('TwilioWebhookController', () => {
  const conversations = {
    ingestInbound: jest.fn(),
  };

  const config = {
    get: jest.fn(),
  };

  let controller: TwilioWebhookController;

  beforeEach(() => {
    jest.clearAllMocks();
    conversations.ingestInbound.mockResolvedValue({
      reply: 'Hola, soy el bot base.',
      intent: 'unknown',
      status: 'needs_human',
      decision: 'test',
    });
    config.get.mockImplementation((key: string) =>
      key === 'DEFAULT_COMPANY_SLUG' ? 'base-whatsapp' : undefined,
    );
    controller = new TwilioWebhookController(conversations as any, config as any);
  });

  it('uses DEFAULT_COMPANY_SLUG when Twilio URL has no companySlug', async () => {
    const response = await controller.receiveWhatsApp({
      From: 'whatsapp:+34600000000',
      To: 'whatsapp:+14155238886',
      Body: 'Hola',
      MessageSid: 'SM123',
      ProfileName: 'Dev User',
    });

    expect(conversations.ingestInbound).toHaveBeenCalledWith(
      expect.objectContaining({
        companySlug: 'base-whatsapp',
        channel: 'whatsapp',
        externalContactId: 'whatsapp:+34600000000',
        from: 'whatsapp:+34600000000',
        body: 'Hola',
        provider: 'twilio',
        providerMessageId: 'SM123',
      }),
    );
    expect(response).toContain('<Message>Hola, soy el bot base.</Message>');
  });

  it('uses companySlug query param when provided', async () => {
    await controller.receiveWhatsApp(
      {
        From: 'whatsapp:+34600000000',
        Body: 'Necesito presupuesto',
      },
      'cliente-demo',
    );

    expect(conversations.ingestInbound).toHaveBeenCalledWith(
      expect.objectContaining({
        companySlug: 'cliente-demo',
        body: 'Necesito presupuesto',
      }),
    );
  });
});

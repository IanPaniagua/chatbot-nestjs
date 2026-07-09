import { Body, Controller, Header, Post, Query } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { twiml } from 'twilio';
import { ConversationsService } from '../../conversations/conversations.service';

interface TwilioWhatsAppPayload {
  From?: string;
  To?: string;
  Body?: string;
  MessageSid?: string;
  ProfileName?: string;
}

@Controller('webhooks/twilio')
export class TwilioWebhookController {
  constructor(
    private readonly conversations: ConversationsService,
    private readonly config: ConfigService,
  ) {}

  @Post('whatsapp')
  @Header('Content-Type', 'text/xml')
  async receiveWhatsApp(
    @Body() body: TwilioWhatsAppPayload,
    @Query('companySlug') companySlug?: string,
  ) {
    const resolvedCompanySlug =
      companySlug || this.config.get<string>('DEFAULT_COMPANY_SLUG') || 'base-whatsapp';
    const from = body.From ?? '';
    const result = await this.conversations.ingestInbound({
      companySlug: resolvedCompanySlug,
      channel: 'whatsapp',
      externalContactId: from,
      from,
      to: body.To,
      body: body.Body ?? '',
      provider: 'twilio',
      providerMessageId: body.MessageSid,
      metadata: {
        profileName: body.ProfileName,
        to: body.To,
      },
    });

    const response = new twiml.MessagingResponse();
    response.message(result.reply);
    return response.toString();
  }
}

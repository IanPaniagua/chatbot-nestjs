import { Body, Controller, Header, Post, Query } from '@nestjs/common';
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
  constructor(private readonly conversations: ConversationsService) {}

  @Post('whatsapp')
  @Header('Content-Type', 'text/xml')
  async receiveWhatsApp(
    @Body() body: TwilioWhatsAppPayload,
    @Query('companySlug') companySlug = 'postres-beinetti',
  ) {
    const from = body.From ?? '';
    const result = await this.conversations.ingestInbound({
      companySlug,
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

import { Module } from '@nestjs/common';
import { ConversationsModule } from '../../conversations/conversations.module';
import { TwilioWebhookController } from './twilio-webhook.controller';

@Module({
  imports: [ConversationsModule],
  controllers: [TwilioWebhookController],
})
export class TwilioWebhookModule {}

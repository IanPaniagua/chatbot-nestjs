import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config';
import { ChannelsModule } from './channels/channels.module';
import { CompaniesModule } from './companies/companies.module';
import { ConversationsModule } from './conversations/conversations.module';
import { FlowModule } from './flow/flow.module';
import { KnowledgeModule } from './knowledge/knowledge.module';
import { MetricsModule } from './metrics/metrics.module';
import { PrismaModule } from './prisma/prisma.module';
import { TwilioWebhookModule } from './webhooks/twilio/twilio-webhook.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    PrismaModule,
    CompaniesModule,
    ConversationsModule,
    KnowledgeModule,
    FlowModule,
    ChannelsModule,
    MetricsModule,
    TwilioWebhookModule,
  ],
})
export class AppModule {}

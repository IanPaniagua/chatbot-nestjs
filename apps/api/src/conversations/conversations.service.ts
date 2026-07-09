import { Inject, Injectable, Logger, NotFoundException, forwardRef } from '@nestjs/common';
import { Channel, ConversationIntent, ConversationStatus, MessageDirection } from '@prisma/client';
import { InboundMessage } from '../channels/channel.types';
import { TwilioChannelService } from '../channels/twilio-channel.service';
import { CompaniesService } from '../companies/companies.service';
import { FlowService, RoutingResult } from '../flow/flow.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInternalNoteDto, ListConversationsQuery, SendManualMessageDto } from './dto';

@Injectable()
export class ConversationsService {
  private readonly logger = new Logger(ConversationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly companies: CompaniesService,
    private readonly twilio: TwilioChannelService,
    @Inject(forwardRef(() => FlowService))
    private readonly flow: FlowService,
  ) {}

  list(query: ListConversationsQuery) {
    return this.prisma.conversation.findMany({
      where: {
        companyId: query.companyId,
        ...(query.status ? { status: query.status as ConversationStatus } : {}),
        ...(query.intent ? { intent: query.intent as ConversationIntent } : {}),
      },
      include: {
        contact: true,
        flowSession: true,
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getById(companyId: string, id: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, companyId },
      include: {
        contact: true,
        flowSession: true,
        messages: { orderBy: { createdAt: 'asc' } },
        notes: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async updateStatus(companyId: string, id: string, status: string) {
    const conversation = await this.prisma.conversation.findFirst({ where: { id, companyId } });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return this.prisma.conversation.update({
      where: { id },
      data: { status: status as ConversationStatus },
    });
  }

  addInternalNote(companyId: string, conversationId: string, body: CreateInternalNoteDto) {
    return this.createInternalNote(companyId, conversationId, body);
  }

  async sendManualMessage(companyId: string, conversationId: string, body: SendManualMessageDto) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, companyId },
      include: { contact: true },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const text = body.body.trim();
    const sendResult =
      conversation.channel === Channel.whatsapp
        ? await this.twilio.send({
            companyId,
            channel: 'whatsapp',
            to: conversation.contact.externalId,
            body: text,
            provider: 'twilio',
            metadata: { manual: true, author: body.author ?? 'admin' },
          })
        : {};

    const message = await this.prisma.message.create({
      data: {
        companyId,
        contactId: conversation.contactId,
        conversationId,
        channel: conversation.channel,
        direction: MessageDirection.outbound,
        body: text,
        provider: 'twilio',
        providerMessageId: sendResult.providerMessageId,
        metadata: {
          manual: true,
          author: body.author ?? 'admin',
          sentToProvider: Boolean(sendResult.providerMessageId),
        },
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        status: ConversationStatus.waiting_customer,
        lastMessageAt: new Date(),
      },
    });

    return message;
  }

  async resetFlow(companyId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, companyId },
      include: { flowSession: true },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    await this.prisma.$transaction([
      this.prisma.flowSession.deleteMany({ where: { conversationId } }),
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          status: ConversationStatus.open,
          intent: ConversationIntent.unknown,
          collectedData: undefined,
          summary: null,
        },
      }),
      this.prisma.internalNote.create({
        data: {
          companyId,
          conversationId,
          author: 'system',
          body: 'Flujo conversacional reiniciado desde el admin.',
        },
      }),
    ]);

    return this.getById(companyId, conversationId);
  }

  private async createInternalNote(
    companyId: string,
    conversationId: string,
    body: CreateInternalNoteDto,
  ) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id: conversationId, companyId },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return this.prisma.internalNote.create({
      data: {
        companyId,
        conversationId,
        body: body.body,
        author: body.author,
      },
    });
  }

  async ingestInbound(input: InboundMessage): Promise<RoutingResult> {
    const company = await this.companies.getBySlug(input.companySlug);
    const contact = await this.prisma.contact.upsert({
      where: {
        companyId_channel_externalId: {
          companyId: company.id,
          channel: input.channel as Channel,
          externalId: input.externalContactId,
        },
      },
      update: {
        phone: input.from,
        metadata: (input.metadata as any) ?? undefined,
      },
      create: {
        companyId: company.id,
        channel: input.channel as Channel,
        externalId: input.externalContactId,
        phone: input.from,
        metadata: (input.metadata as any) ?? undefined,
      },
    });

    const conversation = await this.findOrCreateOpenConversation(company.id, contact.id, input);

    await this.prisma.message.create({
      data: {
        companyId: company.id,
        contactId: contact.id,
        conversationId: conversation.id,
        channel: input.channel as Channel,
        direction: MessageDirection.inbound,
        body: input.body,
        provider: input.provider,
        providerMessageId: input.providerMessageId,
        metadata: (input.metadata as any) ?? undefined,
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { lastMessageAt: new Date() },
    });

    const result = await this.flow.routeInbound({
      companyId: company.id,
      conversationId: conversation.id,
      contactId: contact.id,
      channel: input.channel,
      from: input.from,
      body: input.body,
    });

    await this.prisma.message.create({
      data: {
        companyId: company.id,
        contactId: contact.id,
        conversationId: conversation.id,
        channel: input.channel as Channel,
        direction: MessageDirection.outbound,
        body: result.reply,
        provider: input.provider,
        metadata: { routingDecision: result.decision },
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        firstResponseAt: conversation.firstResponseAt ?? new Date(),
        lastMessageAt: new Date(),
      },
    });

    this.logger.log(`Conversation ${conversation.id} routed as ${result.intent}`);
    return result;
  }

  private async findOrCreateOpenConversation(
    companyId: string,
    contactId: string,
    input: InboundMessage,
  ) {
    const existing = await this.prisma.conversation.findFirst({
      where: {
        companyId,
        contactId,
        channel: input.channel as Channel,
        status: { in: [ConversationStatus.open, ConversationStatus.waiting_customer] },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.conversation.create({
      data: {
        companyId,
        contactId,
        channel: input.channel as Channel,
        providerThreadId: input.from,
        lastMessageAt: new Date(),
      },
    });
  }
}

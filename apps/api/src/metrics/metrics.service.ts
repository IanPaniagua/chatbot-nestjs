import { Injectable } from '@nestjs/common';
import { ConversationIntent, ConversationStatus, MessageDirection } from '@prisma/client';
import type { MetricsOverview } from '@chatbot/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MetricsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(companyId: string): Promise<MetricsOverview> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const [conversationsToday, totalConversations, needsHuman, structuredOrders, faqAnswered] =
      await Promise.all([
        this.prisma.conversation.count({ where: { companyId, createdAt: { gte: startOfDay } } }),
        this.prisma.conversation.count({ where: { companyId } }),
        this.prisma.conversation.count({
          where: { companyId, status: ConversationStatus.needs_human },
        }),
        this.prisma.conversation.count({
          where: {
            companyId,
            intent: { in: [ConversationIntent.special_order, ConversationIntent.restaurant_order] },
          },
        }),
        this.prisma.conversation.count({ where: { companyId, intent: ConversationIntent.faq } }),
      ]);

    const responseTimes = await this.prisma.message.findMany({
      where: {
        companyId,
        direction: MessageDirection.outbound,
        conversation: { createdAt: { gte: startOfDay } },
      },
      select: { createdAt: true, conversation: { select: { createdAt: true } } },
      take: 100,
    });

    const averageFirstResponseSeconds =
      responseTimes.length === 0
        ? null
        : Math.round(
            responseTimes.reduce((sum, message) => {
              return sum + (message.createdAt.getTime() - message.conversation!.createdAt.getTime()) / 1000;
            }, 0) / responseTimes.length,
          );

    return {
      conversationsToday,
      needsHumanPercentage:
        totalConversations === 0 ? 0 : Math.round((needsHuman / totalConversations) * 100),
      structuredOrders,
      faqAnswered,
      averageFirstResponseSeconds,
    };
  }
}

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class KnowledgeService {
  constructor(private readonly prisma: PrismaService) {}

  list(companyId: string) {
    return this.prisma.knowledgeBaseEntry.findMany({
      where: { companyId, isActive: true },
      orderBy: { question: 'asc' },
    });
  }
}

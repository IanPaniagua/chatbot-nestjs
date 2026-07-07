import { Injectable, NotFoundException } from '@nestjs/common';
import type { CompanyBotConfig } from '@chatbot/shared';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.company.findMany({
      orderBy: { name: 'asc' },
      include: { config: true },
    });
  }

  async getBySlug(slug: string) {
    const company = await this.prisma.company.findUnique({
      where: { slug },
      include: { config: true, knowledge: { where: { isActive: true } } },
    });

    if (!company || !company.isActive) {
      throw new NotFoundException(`Company not found: ${slug}`);
    }

    return company;
  }

  async getConfig(companyId: string): Promise<CompanyBotConfig> {
    const config = await this.prisma.companyConfig.findUnique({ where: { companyId } });

    if (!config) {
      throw new NotFoundException(`Company config not found: ${companyId}`);
    }

    return config.settings as unknown as CompanyBotConfig;
  }
}

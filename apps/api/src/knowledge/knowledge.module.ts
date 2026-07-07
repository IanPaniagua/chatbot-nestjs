import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { KnowledgeService } from './knowledge.service';

@Module({
  imports: [PrismaModule],
  providers: [KnowledgeService],
  exports: [KnowledgeService],
})
export class KnowledgeModule {}

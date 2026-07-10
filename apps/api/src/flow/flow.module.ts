import { Module, forwardRef } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { CompaniesModule } from '../companies/companies.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { PrismaModule } from '../prisma/prisma.module';
import { FlowService } from './flow.service';

@Module({
  imports: [PrismaModule, CompaniesModule, AiModule, forwardRef(() => ConversationsModule)],
  providers: [FlowService],
  exports: [FlowService],
})
export class FlowModule {}

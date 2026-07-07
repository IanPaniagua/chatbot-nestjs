import { Module, forwardRef } from '@nestjs/common';
import { CompaniesModule } from '../companies/companies.module';
import { FlowModule } from '../flow/flow.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ConversationsController } from './conversations.controller';
import { ConversationsService } from './conversations.service';

@Module({
  imports: [PrismaModule, CompaniesModule, forwardRef(() => FlowModule)],
  controllers: [ConversationsController],
  providers: [ConversationsService],
  exports: [ConversationsService],
})
export class ConversationsModule {}

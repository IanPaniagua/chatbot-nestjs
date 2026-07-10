import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AiAgentService } from './ai-agent.service';

@Module({
  imports: [PrismaModule],
  providers: [AiAgentService],
  exports: [AiAgentService],
})
export class AiModule {}

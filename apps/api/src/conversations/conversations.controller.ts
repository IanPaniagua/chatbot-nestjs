import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AdminTokenGuard } from '../admin-token.guard';
import {
  CreateInternalNoteDto,
  ListConversationsQuery,
  SendManualMessageDto,
  UpdateConversationStatusDto,
} from './dto';
import { ConversationsService } from './conversations.service';

@Controller('conversations')
@UseGuards(AdminTokenGuard)
export class ConversationsController {
  constructor(private readonly conversations: ConversationsService) {}

  @Get()
  list(@Query() query: ListConversationsQuery) {
    return this.conversations.list(query);
  }

  @Get(':id')
  get(@Param('id') id: string, @Query('companyId') companyId: string) {
    return this.conversations.getById(companyId, id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Query('companyId') companyId: string,
    @Body() body: UpdateConversationStatusDto,
  ) {
    return this.conversations.updateStatus(companyId, id, body.status);
  }

  @Post(':id/internal-notes')
  addNote(
    @Param('id') id: string,
    @Query('companyId') companyId: string,
    @Body() body: CreateInternalNoteDto,
  ) {
    return this.conversations.addInternalNote(companyId, id, body);
  }

  @Post(':id/manual-messages')
  sendManualMessage(
    @Param('id') id: string,
    @Query('companyId') companyId: string,
    @Body() body: SendManualMessageDto,
  ) {
    return this.conversations.sendManualMessage(companyId, id, body);
  }

  @Post(':id/reset-flow')
  resetFlow(@Param('id') id: string, @Query('companyId') companyId: string) {
    return this.conversations.resetFlow(companyId, id);
  }
}

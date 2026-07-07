import { IsIn, IsOptional, IsString } from 'class-validator';

const ConversationStatuses = ['open', 'waiting_customer', 'needs_human', 'closed'] as const;
const ConversationIntents = [
  'normal_order',
  'special_order',
  'restaurant_order',
  'faq',
  'human_support',
  'unknown',
] as const;

export class ListConversationsQuery {
  @IsString()
  companyId!: string;

  @IsOptional()
  @IsIn(ConversationStatuses)
  status?: string;

  @IsOptional()
  @IsIn(ConversationIntents)
  intent?: string;
}

export class UpdateConversationStatusDto {
  @IsIn(ConversationStatuses)
  status!: string;
}

export class CreateInternalNoteDto {
  @IsString()
  body!: string;

  @IsOptional()
  @IsString()
  author?: string;
}

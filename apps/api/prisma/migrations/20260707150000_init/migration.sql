CREATE TYPE "Channel" AS ENUM ('whatsapp', 'webchat');
CREATE TYPE "MessageDirection" AS ENUM ('inbound', 'outbound');
CREATE TYPE "ConversationStatus" AS ENUM ('open', 'waiting_customer', 'needs_human', 'closed');
CREATE TYPE "ConversationIntent" AS ENUM ('normal_order', 'special_order', 'restaurant_order', 'faq', 'human_support', 'unknown');

CREATE TABLE "Company" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Company_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CompanyConfig" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "language" TEXT NOT NULL DEFAULT 'es',
  "timezone" TEXT NOT NULL DEFAULT 'Europe/Madrid',
  "internalEmail" TEXT,
  "settings" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CompanyConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Contact" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "channel" "Channel" NOT NULL,
  "externalId" TEXT NOT NULL,
  "displayName" TEXT,
  "phone" TEXT,
  "email" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Conversation" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "contactId" TEXT NOT NULL,
  "channel" "Channel" NOT NULL,
  "status" "ConversationStatus" NOT NULL DEFAULT 'open',
  "intent" "ConversationIntent" NOT NULL DEFAULT 'unknown',
  "providerThreadId" TEXT,
  "collectedData" JSONB,
  "summary" TEXT,
  "lastMessageAt" TIMESTAMP(3),
  "firstResponseAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Message" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "contactId" TEXT,
  "conversationId" TEXT,
  "channel" "Channel" NOT NULL,
  "direction" "MessageDirection" NOT NULL,
  "body" TEXT NOT NULL,
  "provider" TEXT,
  "providerMessageId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FlowSession" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "flowKey" TEXT NOT NULL,
  "currentStep" INTEGER NOT NULL DEFAULT 0,
  "collectedData" JSONB NOT NULL DEFAULT '{}',
  "completedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FlowSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "InternalNote" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "author" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "InternalNote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "KnowledgeBaseEntry" (
  "id" TEXT NOT NULL,
  "companyId" TEXT NOT NULL,
  "question" TEXT NOT NULL,
  "answer" TEXT NOT NULL,
  "keywords" TEXT[],
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "KnowledgeBaseEntry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Company_slug_key" ON "Company"("slug");
CREATE UNIQUE INDEX "CompanyConfig_companyId_key" ON "CompanyConfig"("companyId");
CREATE UNIQUE INDEX "Contact_companyId_channel_externalId_key" ON "Contact"("companyId", "channel", "externalId");
CREATE INDEX "Contact_companyId_idx" ON "Contact"("companyId");
CREATE INDEX "Conversation_companyId_status_idx" ON "Conversation"("companyId", "status");
CREATE INDEX "Conversation_companyId_intent_idx" ON "Conversation"("companyId", "intent");
CREATE INDEX "Message_companyId_createdAt_idx" ON "Message"("companyId", "createdAt");
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");
CREATE UNIQUE INDEX "FlowSession_conversationId_key" ON "FlowSession"("conversationId");
CREATE INDEX "InternalNote_companyId_idx" ON "InternalNote"("companyId");
CREATE INDEX "KnowledgeBaseEntry_companyId_idx" ON "KnowledgeBaseEntry"("companyId");

ALTER TABLE "CompanyConfig" ADD CONSTRAINT "CompanyConfig_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FlowSession" ADD CONSTRAINT "FlowSession_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InternalNote" ADD CONSTRAINT "InternalNote_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InternalNote" ADD CONSTRAINT "InternalNote_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KnowledgeBaseEntry" ADD CONSTRAINT "KnowledgeBaseEntry_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

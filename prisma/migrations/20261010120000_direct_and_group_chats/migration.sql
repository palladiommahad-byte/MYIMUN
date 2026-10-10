-- Conversations become chats: one direct chat per delegate, plus staff-created group chats.
ALTER TABLE "Conversation" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'direct';
ALTER TABLE "Conversation" ADD COLUMN "title" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Conversation" ADD COLUMN "directKey" TEXT;

ALTER TABLE "ChatMessage" ADD COLUMN "senderId" TEXT;
ALTER TABLE "ChatMessage" ADD COLUMN "senderName" TEXT NOT NULL DEFAULT '';

-- Attribute existing delegate messages to the delegate who owned the thread.
UPDATE "ChatMessage"
SET "senderId" = (SELECT c."delegateId" FROM "Conversation" c WHERE c."id" = "ChatMessage"."conversationId"),
    "senderName" = (SELECT c."delegateName" FROM "Conversation" c WHERE c."id" = "ChatMessage"."conversationId")
WHERE "sender" = 'delegate';

-- Keep each legacy thread's subject as context on its opening message.
UPDATE "ChatMessage"
SET "text" = (SELECT c."subject" FROM "Conversation" c WHERE c."id" = "ChatMessage"."conversationId") || char(10) || char(10) || "text"
WHERE "id" IN (SELECT MIN("id") FROM "ChatMessage" GROUP BY "conversationId")
  AND (SELECT c."subject" FROM "Conversation" c WHERE c."id" = "ChatMessage"."conversationId") <> '';

-- Merge every delegate's separate email-style threads into their oldest thread.
UPDATE "ChatMessage"
SET "conversationId" = (
    SELECT MIN(c2."id") FROM "Conversation" c2
    WHERE c2."delegateId" = (SELECT c1."delegateId" FROM "Conversation" c1 WHERE c1."id" = "ChatMessage"."conversationId")
)
WHERE "conversationId" IN (SELECT "id" FROM "Conversation" WHERE "delegateId" IS NOT NULL);

UPDATE "Conversation"
SET "adminUnread" = (SELECT SUM(c2."adminUnread") FROM "Conversation" c2 WHERE c2."delegateId" = "Conversation"."delegateId"),
    "delegateUnread" = (SELECT SUM(c2."delegateUnread") FROM "Conversation" c2 WHERE c2."delegateId" = "Conversation"."delegateId"),
    "lastMessageAt" = (SELECT MAX(c2."lastMessageAt") FROM "Conversation" c2 WHERE c2."delegateId" = "Conversation"."delegateId")
WHERE "id" IN (SELECT MIN("id") FROM "Conversation" WHERE "delegateId" IS NOT NULL GROUP BY "delegateId");

DELETE FROM "Conversation"
WHERE "delegateId" IS NOT NULL
  AND "id" NOT IN (SELECT MIN("id") FROM "Conversation" WHERE "delegateId" IS NOT NULL GROUP BY "delegateId");

UPDATE "Conversation" SET "directKey" = "delegateId", "subject" = '', "category" = '' WHERE "delegateId" IS NOT NULL;

CREATE UNIQUE INDEX "Conversation_directKey_key" ON "Conversation"("directKey");

-- CreateTable
CREATE TABLE "ConversationMember" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "conversationId" INTEGER NOT NULL,
    "delegateId" TEXT NOT NULL,
    "unread" INTEGER NOT NULL DEFAULT 0,
    "joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ConversationMember_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ConversationMember_delegateId_fkey" FOREIGN KEY ("delegateId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ConversationMember_delegateId_idx" ON "ConversationMember"("delegateId");

-- CreateIndex
CREATE UNIQUE INDEX "ConversationMember_conversationId_delegateId_key" ON "ConversationMember"("conversationId", "delegateId");

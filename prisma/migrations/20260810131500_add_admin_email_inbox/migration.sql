-- CreateTable
CREATE TABLE "EmailThread" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "subject" TEXT NOT NULL,
    "normalizedSubject" TEXT NOT NULL,
    "externalName" TEXT NOT NULL,
    "externalEmail" TEXT NOT NULL,
    "linkedDelegateId" TEXT,
    "mailbox" TEXT NOT NULL DEFAULT 'inbox',
    "status" TEXT NOT NULL DEFAULT 'open',
    "unread" BOOLEAN NOT NULL DEFAULT false,
    "lastMessageAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "EmailMessage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "threadId" INTEGER NOT NULL,
    "messageId" TEXT,
    "uid" INTEGER,
    "direction" TEXT NOT NULL,
    "fromName" TEXT NOT NULL,
    "fromAddress" TEXT NOT NULL,
    "to" JSONB NOT NULL DEFAULT [],
    "cc" JSONB NOT NULL DEFAULT [],
    "bcc" JSONB NOT NULL DEFAULT [],
    "subject" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "html" TEXT,
    "snippet" TEXT NOT NULL,
    "attachments" JSONB NOT NULL DEFAULT [],
    "sentAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailMessage_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "EmailThread" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmailSyncState" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "EmailThread_externalEmail_idx" ON "EmailThread"("externalEmail");

-- CreateIndex
CREATE INDEX "EmailThread_linkedDelegateId_idx" ON "EmailThread"("linkedDelegateId");

-- CreateIndex
CREATE INDEX "EmailThread_lastMessageAt_idx" ON "EmailThread"("lastMessageAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailMessage_messageId_key" ON "EmailMessage"("messageId");

-- CreateIndex
CREATE INDEX "EmailMessage_threadId_idx" ON "EmailMessage"("threadId");

-- CreateIndex
CREATE INDEX "EmailMessage_uid_idx" ON "EmailMessage"("uid");

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'delegate',
    "country" TEXT,
    "committee" TEXT,
    "address" TEXT,
    "avatarUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "joined" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Committee" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "abbr" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 30,
    "topics" INTEGER NOT NULL DEFAULT 2,
    "director" TEXT NOT NULL DEFAULT '',
    "topicList" JSONB NOT NULL DEFAULT [],
    "logoUrl" TEXT,
    "waiting" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PositionPaper" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "delegateId" TEXT NOT NULL,
    "delegateName" TEXT NOT NULL,
    "committee" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "fileName" TEXT NOT NULL,
    "fileKey" TEXT,
    "fileSize" INTEGER NOT NULL DEFAULT 0,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PositionPaper_delegateId_fkey" FOREIGN KEY ("delegateId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommitteeApplication" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "delegateId" TEXT NOT NULL,
    "delegateName" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "committeeAbbr" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "whyThisCommittee" TEXT NOT NULL DEFAULT '',
    "preferredCountry" TEXT NOT NULL DEFAULT '',
    "whyShouldWePickYou" TEXT NOT NULL DEFAULT '',
    "assignedCountry" TEXT,
    "appliedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CommitteeApplication_delegateId_fkey" FOREIGN KEY ("delegateId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Registration" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "delegateId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "heardFrom" TEXT NOT NULL,
    "firstTimeMun" BOOLEAN NOT NULL,
    "attendedMyimunBefore" BOOLEAN NOT NULL,
    "motivation" TEXT NOT NULL,
    "idDocName" TEXT,
    "idDocSize" INTEGER,
    "idDocType" TEXT,
    "idDocKey" TEXT,
    "type" TEXT NOT NULL DEFAULT 'Individual',
    "groupName" TEXT,
    "groupSize" INTEGER,
    "institution" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "declineReason" TEXT,
    "paymentStatus" TEXT NOT NULL DEFAULT 'Unpaid',
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Registration_delegateId_fkey" FOREIGN KEY ("delegateId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PaymentSubmission" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "delegateId" TEXT NOT NULL,
    "senderName" TEXT NOT NULL,
    "participantName" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "method" TEXT NOT NULL,
    "packageId" INTEGER,
    "packageName" TEXT,
    "receiptName" TEXT NOT NULL,
    "receiptSize" INTEGER NOT NULL DEFAULT 0,
    "receiptType" TEXT NOT NULL DEFAULT '',
    "receiptKey" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "declineReason" TEXT,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PaymentSubmission_delegateId_fkey" FOREIGN KEY ("delegateId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "delegateId" TEXT,
    "delegateName" TEXT NOT NULL,
    "delegateEmail" TEXT NOT NULL,
    "delegateCountry" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "adminUnread" INTEGER NOT NULL DEFAULT 0,
    "delegateUnread" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessageAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Conversation_delegateId_fkey" FOREIGN KEY ("delegateId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "conversationId" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ChatMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ConferenceEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "subtitle" TEXT NOT NULL DEFAULT '',
    "edition" TEXT NOT NULL DEFAULT '',
    "startDate" TEXT NOT NULL DEFAULT '',
    "endDate" TEXT NOT NULL DEFAULT '',
    "venue" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL DEFAULT '',
    "city" TEXT NOT NULL DEFAULT '',
    "country" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL DEFAULT '',
    "guidelines" JSONB NOT NULL DEFAULT [],
    "bannerUrl" TEXT NOT NULL DEFAULT '',
    "galleryUrls" JSONB NOT NULL DEFAULT [],
    "hotel" JSONB,
    "agenda" JSONB NOT NULL DEFAULT [],
    "published" BOOLEAN NOT NULL DEFAULT true,
    "registrationDeadline" TEXT NOT NULL DEFAULT '',
    "capacity" INTEGER NOT NULL DEFAULT 300,
    "certEditionNumber" INTEGER,
    "certDateDisplay" TEXT,
    "certLocation" TEXT,
    "certSignatory" TEXT,
    "letterEditionYear" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ScheduleEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "day" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ConferencePackage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "description" TEXT NOT NULL DEFAULT '',
    "features" JSONB NOT NULL DEFAULT [],
    "emoji" TEXT NOT NULL DEFAULT '',
    "logoUrl" TEXT,
    "badge" TEXT NOT NULL DEFAULT '',
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "color" TEXT NOT NULL DEFAULT '#3B7FFF',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" JSONB NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "StoredFile" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "size" INTEGER NOT NULL DEFAULT 0,
    "data" BLOB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Committee_abbr_key" ON "Committee"("abbr");

-- CreateIndex
CREATE UNIQUE INDEX "PositionPaper_delegateId_committee_key" ON "PositionPaper"("delegateId", "committee");

-- CreateIndex
CREATE UNIQUE INDEX "CommitteeApplication_delegateId_key" ON "CommitteeApplication"("delegateId");

-- CreateIndex
CREATE UNIQUE INDEX "Registration_delegateId_key" ON "Registration"("delegateId");

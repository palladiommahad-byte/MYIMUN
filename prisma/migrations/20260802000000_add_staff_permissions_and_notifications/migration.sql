-- Add staff page permissions and the tables used by notifications,
-- delegate password-reset requests, and announcements.
ALTER TABLE "User" ADD COLUMN "permissions" JSONB;

CREATE TABLE "Notification" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "audience" TEXT NOT NULL,
    "recipientId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "PasswordResetRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "userId" TEXT,
    "delegateName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME
);

CREATE TABLE "Announcement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "message" TEXT NOT NULL,
    "audience" TEXT NOT NULL DEFAULT 'all',
    "level" TEXT NOT NULL DEFAULT 'info',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "Notification_audience_recipientId_idx" ON "Notification"("audience", "recipientId");
CREATE INDEX "PasswordResetRequest_status_idx" ON "PasswordResetRequest"("status");
CREATE INDEX "Announcement_audience_idx" ON "Announcement"("audience");

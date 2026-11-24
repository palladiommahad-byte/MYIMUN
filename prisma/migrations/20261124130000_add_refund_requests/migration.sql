-- CreateTable
CREATE TABLE "RefundRequest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "delegateId" TEXT NOT NULL,
    "delegateName" TEXT NOT NULL,
    "paymentId" INTEGER,
    "amount" REAL NOT NULL DEFAULT 0,
    "packageName" TEXT,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "declineReason" TEXT,
    "scheduledDate" TEXT,
    "reviewedBy" TEXT,
    "reviewedAt" DATETIME,
    "refundedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RefundRequest_delegateId_fkey" FOREIGN KEY ("delegateId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "RefundRequest_delegateId_idx" ON "RefundRequest"("delegateId");

-- CreateIndex
CREATE INDEX "RefundRequest_status_idx" ON "RefundRequest"("status");

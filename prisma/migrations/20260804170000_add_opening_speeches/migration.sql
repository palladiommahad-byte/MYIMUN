CREATE TABLE "OpeningSpeech" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "delegateId" TEXT NOT NULL,
    "delegateName" TEXT NOT NULL,
    "committee" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "speech" TEXT NOT NULL,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OpeningSpeech_delegateId_fkey" FOREIGN KEY ("delegateId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "OpeningSpeech_delegateId_committee_key" ON "OpeningSpeech"("delegateId", "committee");

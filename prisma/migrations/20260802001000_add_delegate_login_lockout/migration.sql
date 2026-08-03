-- Track delegate login failures so repeated bad credentials can temporarily
-- lock the account, then escalate to a staff reset request.
ALTER TABLE "User" ADD COLUMN "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "loginLockUntil" DATETIME;
ALTER TABLE "User" ADD COLUMN "loginLockLevel" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "accessReviewRequired" BOOLEAN NOT NULL DEFAULT false;

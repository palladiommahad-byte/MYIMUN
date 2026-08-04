ALTER TABLE "Committee" ADD COLUMN "visible" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Committee" ADD COLUMN "applicationState" TEXT NOT NULL DEFAULT 'open';

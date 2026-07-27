-- Track whether a bootstrap administrator still needs to replace its temporary credentials.
ALTER TABLE "User" ADD COLUMN "mustChangeCredentials" BOOLEAN NOT NULL DEFAULT false;

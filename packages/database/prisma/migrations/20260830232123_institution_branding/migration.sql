-- AlterTable
ALTER TABLE "access_consents" ADD COLUMN     "institutionColour" TEXT,
ADD COLUMN     "institutionLogo" TEXT,
ADD COLUMN     "institutionRefreshedAt" TIMESTAMP(3);

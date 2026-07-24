-- CreateEnum
CREATE TYPE "CampaignRole" AS ENUM ('DUNGEON_MASTER', 'PLAYER');

-- CreateEnum
CREATE TYPE "SystemRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('PLANNING', 'ACTIVE', 'ON_HIATUS', 'COMPLETED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "Creature" ADD COLUMN     "campaignId" UUID;

-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "campaignId" UUID;

-- CreateTable
CREATE TABLE "Player" (
    "id" UUID NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT,
    "passwordHash" TEXT,
    "systemRole" "SystemRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "CampaignStatus" NOT NULL DEFAULT 'PLANNING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignMembership" (
    "id" UUID NOT NULL,
    "campaignId" UUID NOT NULL,
    "playerId" UUID NOT NULL,
    "role" "CampaignRole" NOT NULL DEFAULT 'PLAYER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CampaignMembership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Player_username_key" ON "Player"("username");

-- CreateIndex
CREATE INDEX "CampaignMembership_playerId_idx" ON "CampaignMembership"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignMembership_campaignId_playerId_key" ON "CampaignMembership"("campaignId", "playerId");

-- CreateIndex
CREATE INDEX "Creature_campaignId_idx" ON "Creature"("campaignId");

-- CreateIndex
CREATE INDEX "Location_campaignId_idx" ON "Location"("campaignId");

-- AddForeignKey
ALTER TABLE "CampaignMembership" ADD CONSTRAINT "CampaignMembership_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignMembership" ADD CONSTRAINT "CampaignMembership_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerCharacter" ADD CONSTRAINT "PlayerCharacter_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerCharacter" ADD CONSTRAINT "PlayerCharacter_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Creature" ADD CONSTRAINT "Creature_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

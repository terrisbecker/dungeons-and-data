-- AlterTable
ALTER TABLE "InventoryItem" ADD COLUMN     "locationId" UUID;

-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "demandLevel" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "supplyLevel" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "CampaignEconomySettings" (
    "campaignId" UUID NOT NULL,
    "economyEnabled" BOOLEAN NOT NULL DEFAULT false,
    "floorPercent" INTEGER NOT NULL DEFAULT 50,
    "ceilingPercent" INTEGER NOT NULL DEFAULT 50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignEconomySettings_pkey" PRIMARY KEY ("campaignId")
);

-- CreateTable
CREATE TABLE "ItemTypeEconomyConfig" (
    "itemType" "ItemType" NOT NULL,
    "demandSlope" DECIMAL(10,4) NOT NULL DEFAULT 1.0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemTypeEconomyConfig_pkey" PRIMARY KEY ("itemType")
);

-- CreateIndex
CREATE INDEX "InventoryItem_locationId_idx" ON "InventoryItem"("locationId");

-- AddForeignKey
ALTER TABLE "CampaignEconomySettings" ADD CONSTRAINT "CampaignEconomySettings_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- The single-owner CHECK now spans three columns (building inventory adds
-- locationId as a third possible owner). Drop and recreate it exactly-one-of-3.
ALTER TABLE "InventoryItem" DROP CONSTRAINT "InventoryItem_single_owner_check";
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_single_owner_check" CHECK (
  (("characterId" IS NOT NULL)::int + ("creatureId" IS NOT NULL)::int + ("locationId" IS NOT NULL)::int) = 1
);

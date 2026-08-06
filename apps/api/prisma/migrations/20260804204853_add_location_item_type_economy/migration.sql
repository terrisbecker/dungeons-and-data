-- AlterTable
ALTER TABLE "Location" ADD COLUMN     "useItemTypeEconomy" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "LocationItemTypeEconomy" (
    "locationId" UUID NOT NULL,
    "itemType" "ItemType" NOT NULL,
    "supplyLevel" INTEGER NOT NULL DEFAULT 0,
    "demandLevel" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LocationItemTypeEconomy_pkey" PRIMARY KEY ("locationId","itemType")
);

-- AddForeignKey
ALTER TABLE "LocationItemTypeEconomy" ADD CONSTRAINT "LocationItemTypeEconomy_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

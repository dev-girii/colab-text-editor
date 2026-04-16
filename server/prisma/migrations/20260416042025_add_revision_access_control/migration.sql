-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "createdBy" TEXT NOT NULL DEFAULT 'anonymous';

-- CreateTable
CREATE TABLE "Revision" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "savedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Revision_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Revision" ADD CONSTRAINT "Revision_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

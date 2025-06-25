-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "receiverFullName" TEXT NOT NULL DEFAULT 'Full Name',
ADD COLUMN     "receiverPhoneNumber" DOUBLE PRECISION NOT NULL DEFAULT 0;

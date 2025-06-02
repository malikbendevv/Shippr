-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'RETURNED';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "expectedVersion" INTEGER;

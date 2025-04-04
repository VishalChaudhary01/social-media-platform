/*
  Warnings:

  - You are about to drop the column `createdAt` on the `VerificationToken` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `VerificationToken` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "VerificationToken" DROP COLUMN "createdAt",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

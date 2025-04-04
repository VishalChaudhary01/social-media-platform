/*
  Warnings:

  - You are about to drop the column `creacte_at` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `profile_pic` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `verificationToken` on the `User` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TokenType" AS ENUM ('EMAIL_VERIFICATION', 'RESET_PASSWORD');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "creacte_at",
DROP COLUMN "profile_pic",
DROP COLUMN "verificationToken",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "profilePic" TEXT;

-- CreateTable
CREATE TABLE "VerificationToken" (
    "token" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "type" "TokenType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_identifier_key" ON "VerificationToken"("token", "identifier");

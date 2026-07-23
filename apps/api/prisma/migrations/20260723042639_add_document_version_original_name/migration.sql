/*
  Warnings:

  - Added the required column `originalName` to the `document_versions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "document_versions" ADD COLUMN     "originalName" TEXT NOT NULL;

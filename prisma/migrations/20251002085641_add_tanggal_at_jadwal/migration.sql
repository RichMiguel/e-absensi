/*
  Warnings:

  - Added the required column `tanggal` to the `Jadwal` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `jadwal` ADD COLUMN `tanggal` DATETIME(3) NOT NULL;

-- DropForeignKey
ALTER TABLE `absensi` DROP FOREIGN KEY `Absensi_jadwal_id_fkey`;

-- DropIndex
DROP INDEX `Absensi_jadwal_id_fkey` ON `absensi`;

-- AddForeignKey
ALTER TABLE `Absensi` ADD CONSTRAINT `Absensi_jadwal_id_fkey` FOREIGN KEY (`jadwal_id`) REFERENCES `Jadwal`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

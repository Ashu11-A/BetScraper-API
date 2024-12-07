import { MigrationInterface, QueryRunner } from 'typeorm'

export class SchemaUpdate1733434124069 implements MigrationInterface {
  name = 'SchemaUpdate1733434124069'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE TABLE `compliances` (`id` int NOT NULL AUTO_INCREMENT, `value` text NOT NULL, `type` enum (\'bunus\', \'advisement\', \'legalAgeAdvisement\') NOT NULL, `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (`id`)) ENGINE=InnoDB')
    await queryRunner.query('CREATE TABLE `crons` (`id` int NOT NULL AUTO_INCREMENT, `expression` varchar(255) NOT NULL, `lastExecutedAt` timestamp NULL, `nextExecutionAt` timestamp NULL, `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (`id`)) ENGINE=InnoDB')
    await queryRunner.query('CREATE TABLE `bets` (`id` int NOT NULL AUTO_INCREMENT, `name` varchar(255) NOT NULL, `url` varchar(255) NOT NULL, `status` enum (\'none\', \'suspect\', \'approved\', \'disapproved\') NOT NULL DEFAULT \'none\', `score` int NOT NULL DEFAULT \'0\', `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `cronId` int NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB')
    await queryRunner.query('CREATE TABLE `properties` (`id` int NOT NULL AUTO_INCREMENT, `contrast` float NOT NULL, `proportionPercentage` float NOT NULL, `scrollPercentage` float NOT NULL, `distanceToTop` float NOT NULL, `isIntersectingViewport` tinyint NOT NULL, `isVisible` tinyint NOT NULL, `isHidden` tinyint NOT NULL, `hasChildNodes` tinyint NOT NULL, `isInViewport` tinyint NOT NULL, `colors` text NOT NULL, `viewport` text NOT NULL, `pageDimensions` text NOT NULL, `elementBox` text NOT NULL, `taskId` int NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB')
    await queryRunner.query('CREATE TABLE `users` (`id` int NOT NULL AUTO_INCREMENT, `uuid` varchar(36) NOT NULL, `role` enum (\'administrator\', \'user\') NOT NULL DEFAULT \'user\', `name` text NOT NULL, `username` text NOT NULL, `email` varchar(255) NOT NULL, `language` varchar(255) NOT NULL, `password` text NOT NULL, `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (`id`)) ENGINE=InnoDB')
    await queryRunner.query('CREATE TABLE `images` (`id` int NOT NULL AUTO_INCREMENT, `hash` text NOT NULL, `content` text NULL, `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (`id`)) ENGINE=InnoDB')
    await queryRunner.query('CREATE TABLE `ocrs` (`id` int NOT NULL AUTO_INCREMENT, `proportionPercentage` float NOT NULL, `scrollPercentage` float NOT NULL, `distanceToTop` float NOT NULL, `isIntersectingViewport` tinyint NOT NULL, `isVisible` tinyint NOT NULL, `isHidden` tinyint NOT NULL, `isInViewport` tinyint NOT NULL, `viewport` text NOT NULL, `pageDimensions` text NOT NULL, `elementBox` text NOT NULL, `taskId` int NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB')
    await queryRunner.query('CREATE TABLE `tasks` (`id` int NOT NULL AUTO_INCREMENT, `uuid` text NOT NULL, `status` enum (\'scheduled\', \'running\', \'paused\', \'failed\', \'completed\') NOT NULL DEFAULT \'scheduled\', `errorMessage` text NULL, `duration` int NULL, `scheduledAt` timestamp NULL, `finishedAt` timestamp NULL, `updatedAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), `createdAt` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), `betId` int NULL, `userId` int NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB')
    await queryRunner.query('CREATE TABLE `properties_compliances_compliances` (`propertiesId` int NOT NULL, `compliancesId` int NOT NULL, INDEX `IDX_fee84319c7a4c39f28dd02cf2b` (`propertiesId`), INDEX `IDX_3aecee50b5c7183abdab6a165d` (`compliancesId`), PRIMARY KEY (`propertiesId`, `compliancesId`)) ENGINE=InnoDB')
    await queryRunner.query('CREATE TABLE `images_ocrs_ocrs` (`imagesId` int NOT NULL, `ocrsId` int NOT NULL, INDEX `IDX_c2a752b2fe2079292c83351092` (`imagesId`), INDEX `IDX_e0d8c0d0afa67b4e47a1a8c151` (`ocrsId`), PRIMARY KEY (`imagesId`, `ocrsId`)) ENGINE=InnoDB')
    await queryRunner.query('CREATE TABLE `ocrs_compliances_compliances` (`ocrsId` int NOT NULL, `compliancesId` int NOT NULL, INDEX `IDX_553c62ed9380c6a390329c7b53` (`ocrsId`), INDEX `IDX_27f5d6da5c588aebe8c4247ae9` (`compliancesId`), PRIMARY KEY (`ocrsId`, `compliancesId`)) ENGINE=InnoDB')
    await queryRunner.query('ALTER TABLE `bets` ADD CONSTRAINT `FK_804634d04da8e115c137860f04b` FOREIGN KEY (`cronId`) REFERENCES `crons`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION')
    await queryRunner.query('ALTER TABLE `properties` ADD CONSTRAINT `FK_2256c34c6f602b4675cadd55c6e` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION')
    await queryRunner.query('ALTER TABLE `ocrs` ADD CONSTRAINT `FK_143d11277ac776f636c8f6c3c1c` FOREIGN KEY (`taskId`) REFERENCES `tasks`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION')
    await queryRunner.query('ALTER TABLE `tasks` ADD CONSTRAINT `FK_e4bcf0bf21c7ceb459f67c42193` FOREIGN KEY (`betId`) REFERENCES `bets`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION')
    await queryRunner.query('ALTER TABLE `tasks` ADD CONSTRAINT `FK_166bd96559cb38595d392f75a35` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION')
    await queryRunner.query('ALTER TABLE `properties_compliances_compliances` ADD CONSTRAINT `FK_fee84319c7a4c39f28dd02cf2bc` FOREIGN KEY (`propertiesId`) REFERENCES `properties`(`id`) ON DELETE CASCADE ON UPDATE CASCADE')
    await queryRunner.query('ALTER TABLE `properties_compliances_compliances` ADD CONSTRAINT `FK_3aecee50b5c7183abdab6a165d1` FOREIGN KEY (`compliancesId`) REFERENCES `compliances`(`id`) ON DELETE CASCADE ON UPDATE CASCADE')
    await queryRunner.query('ALTER TABLE `images_ocrs_ocrs` ADD CONSTRAINT `FK_c2a752b2fe2079292c83351092e` FOREIGN KEY (`imagesId`) REFERENCES `images`(`id`) ON DELETE CASCADE ON UPDATE CASCADE')
    await queryRunner.query('ALTER TABLE `images_ocrs_ocrs` ADD CONSTRAINT `FK_e0d8c0d0afa67b4e47a1a8c1517` FOREIGN KEY (`ocrsId`) REFERENCES `ocrs`(`id`) ON DELETE NO ACTION ON UPDATE NO ACTION')
    await queryRunner.query('ALTER TABLE `ocrs_compliances_compliances` ADD CONSTRAINT `FK_553c62ed9380c6a390329c7b536` FOREIGN KEY (`ocrsId`) REFERENCES `ocrs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE')
    await queryRunner.query('ALTER TABLE `ocrs_compliances_compliances` ADD CONSTRAINT `FK_27f5d6da5c588aebe8c4247ae92` FOREIGN KEY (`compliancesId`) REFERENCES `compliances`(`id`) ON DELETE CASCADE ON UPDATE CASCADE')
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `ocrs_compliances_compliances` DROP FOREIGN KEY `FK_27f5d6da5c588aebe8c4247ae92`')
    await queryRunner.query('ALTER TABLE `ocrs_compliances_compliances` DROP FOREIGN KEY `FK_553c62ed9380c6a390329c7b536`')
    await queryRunner.query('ALTER TABLE `images_ocrs_ocrs` DROP FOREIGN KEY `FK_e0d8c0d0afa67b4e47a1a8c1517`')
    await queryRunner.query('ALTER TABLE `images_ocrs_ocrs` DROP FOREIGN KEY `FK_c2a752b2fe2079292c83351092e`')
    await queryRunner.query('ALTER TABLE `properties_compliances_compliances` DROP FOREIGN KEY `FK_3aecee50b5c7183abdab6a165d1`')
    await queryRunner.query('ALTER TABLE `properties_compliances_compliances` DROP FOREIGN KEY `FK_fee84319c7a4c39f28dd02cf2bc`')
    await queryRunner.query('ALTER TABLE `tasks` DROP FOREIGN KEY `FK_166bd96559cb38595d392f75a35`')
    await queryRunner.query('ALTER TABLE `tasks` DROP FOREIGN KEY `FK_e4bcf0bf21c7ceb459f67c42193`')
    await queryRunner.query('ALTER TABLE `ocrs` DROP FOREIGN KEY `FK_143d11277ac776f636c8f6c3c1c`')
    await queryRunner.query('ALTER TABLE `properties` DROP FOREIGN KEY `FK_2256c34c6f602b4675cadd55c6e`')
    await queryRunner.query('ALTER TABLE `bets` DROP FOREIGN KEY `FK_804634d04da8e115c137860f04b`')
    await queryRunner.query('DROP INDEX `IDX_27f5d6da5c588aebe8c4247ae9` ON `ocrs_compliances_compliances`')
    await queryRunner.query('DROP INDEX `IDX_553c62ed9380c6a390329c7b53` ON `ocrs_compliances_compliances`')
    await queryRunner.query('DROP TABLE `ocrs_compliances_compliances`')
    await queryRunner.query('DROP INDEX `IDX_e0d8c0d0afa67b4e47a1a8c151` ON `images_ocrs_ocrs`')
    await queryRunner.query('DROP INDEX `IDX_c2a752b2fe2079292c83351092` ON `images_ocrs_ocrs`')
    await queryRunner.query('DROP TABLE `images_ocrs_ocrs`')
    await queryRunner.query('DROP INDEX `IDX_3aecee50b5c7183abdab6a165d` ON `properties_compliances_compliances`')
    await queryRunner.query('DROP INDEX `IDX_fee84319c7a4c39f28dd02cf2b` ON `properties_compliances_compliances`')
    await queryRunner.query('DROP TABLE `properties_compliances_compliances`')
    await queryRunner.query('DROP TABLE `tasks`')
    await queryRunner.query('DROP TABLE `ocrs`')
    await queryRunner.query('DROP TABLE `images`')
    await queryRunner.query('DROP TABLE `users`')
    await queryRunner.query('DROP TABLE `properties`')
    await queryRunner.query('DROP TABLE `bets`')
    await queryRunner.query('DROP TABLE `crons`')
    await queryRunner.query('DROP TABLE `compliances`')
  }

}

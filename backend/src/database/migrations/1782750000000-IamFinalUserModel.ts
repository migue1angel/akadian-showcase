import { MigrationInterface, QueryRunner } from 'typeorm';

export class IamFinalUserModel1782750000000 implements MigrationInterface {
  name = 'IamFinalUserModel1782750000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "UQ_fe0bb3f6520ee0469504521e710"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "username"`);
    await queryRunner.query(`ALTER TABLE "users" ADD "first_name" text`);
    await queryRunner.query(`ALTER TABLE "users" ADD "last_name" text`);
    await queryRunner.query(`ALTER TABLE "users" ADD "email_verified" boolean NOT NULL DEFAULT true`);
    await queryRunner.query(`UPDATE "users" SET "first_name" = split_part("email", '@', 1), "last_name" = 'User' WHERE "first_name" IS NULL OR "last_name" IS NULL`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "first_name" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "last_name" SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "username" text`);
    await queryRunner.query(`UPDATE "users" SET "username" = split_part("email", '@', 1) WHERE "username" IS NULL`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "username" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username")`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "email_verified"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "last_name"`);
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "first_name"`);
  }
}

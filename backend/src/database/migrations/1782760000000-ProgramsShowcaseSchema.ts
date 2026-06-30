import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProgramsShowcaseSchema1782760000000 implements MigrationInterface {
  name = 'ProgramsShowcaseSchema1782760000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "programs" DROP CONSTRAINT IF EXISTS "FK_8e33ef3b3c47e0ae678464b4c9d"`);
    await queryRunner.query(`ALTER TABLE "programs" DROP CONSTRAINT IF EXISTS "FK_958d7cfffcc1b7cfd1af84ac292"`);
    await queryRunner.query(`ALTER TABLE "language_levels" DROP CONSTRAINT IF EXISTS "FK_bd6f31c12df90b13706baaa19db"`);
    await queryRunner.query(`ALTER TABLE "tutor_proficiencies" DROP CONSTRAINT IF EXISTS "FK_ff0927f44724b2d75dae7dae6c4"`);
    await queryRunner.query(`ALTER TABLE "tutor_proficiencies" DROP CONSTRAINT IF EXISTS "FK_9be6bfed3431b122f410d727359"`);
    await queryRunner.query(`ALTER TABLE "course_schedules" DROP CONSTRAINT IF EXISTS "FK_f0cd61820798323cb06ca91105d"`);
    await queryRunner.query(`ALTER TABLE "class_sessions" DROP CONSTRAINT IF EXISTS "FK_1397d1e5d657291c564326ef505"`);
    await queryRunner.query(`ALTER TABLE "class_sessions" DROP CONSTRAINT IF EXISTS "FK_5c191f9d3fbc45b64853d413232"`);
    await queryRunner.query(`ALTER TABLE "courses" DROP CONSTRAINT IF EXISTS "FK_ef3a23e394203eb11b06b77f695"`);
    await queryRunner.query(`ALTER TABLE "courses" DROP CONSTRAINT IF EXISTS "FK_72d6f185d29c3ace13018ed8bcc"`);
    await queryRunner.query(`ALTER TABLE "attendance_logs" DROP CONSTRAINT IF EXISTS "FK_7abf1ab49e97827d8b9ee5d959d"`);
    await queryRunner.query(`ALTER TABLE "enrollments" DROP CONSTRAINT IF EXISTS "FK_b79d0bf01779fdf9cfb6b092af3"`);
    await queryRunner.query(`ALTER TABLE "enrollments" DROP CONSTRAINT IF EXISTS "FK_ff997f5a39cd24a491b9aca45c9"`);
    await queryRunner.query(`ALTER TABLE "student_proficiencies" DROP CONSTRAINT IF EXISTS "FK_32e1206c68ab8d77254022337bf"`);
    await queryRunner.query(`ALTER TABLE "student_proficiencies" DROP CONSTRAINT IF EXISTS "FK_ed035c9e28b69852c35c23e0c2d"`);
    await queryRunner.query(`ALTER TABLE "unit_class_files" DROP CONSTRAINT IF EXISTS "FK_9877f9d361348cba5587f3b9c76"`);
    await queryRunner.query(`ALTER TABLE "unit_classes" DROP CONSTRAINT IF EXISTS "FK_1e88d1b1acc391e29888fab35c7"`);
    await queryRunner.query(`ALTER TABLE "unit_classes" DROP CONSTRAINT IF EXISTS "FK_680e2efeb319c6ce55b6cae1a83"`);

    await queryRunner.query(`DROP TABLE IF EXISTS "attendance_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "enrollments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "student_proficiencies"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "class_sessions"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "course_schedules"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "courses"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tutor_proficiencies"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "unit_class_files"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categories"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "language_levels"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "languages"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."enrollments_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."class_sessions_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "public"."courses_status_enum"`);

    await queryRunner.query(`ALTER TABLE "programs" RENAME COLUMN "total_classes" TO "total_units"`);
    await queryRunner.query(`ALTER TABLE "programs" ADD "description" text`);
    await queryRunner.query(`ALTER TABLE "programs" ADD "deleted_at" TIMESTAMP`);
    await queryRunner.query(`UPDATE "programs" SET "language_id" = '00000000-0000-0000-0000-000000000000' WHERE "language_id" IS NULL`);
    await queryRunner.query(`UPDATE "programs" SET "level_id" = '00000000-0000-0000-0000-000000000000' WHERE "level_id" IS NULL`);
    await queryRunner.query(`ALTER TABLE "programs" ALTER COLUMN "language_id" SET NOT NULL`);
    await queryRunner.query(`ALTER TABLE "programs" ALTER COLUMN "level_id" SET NOT NULL`);

    await queryRunner.query(`DELETE FROM "units" WHERE "program_id" IS NULL`);
    await queryRunner.query(`ALTER TABLE "units" ALTER COLUMN "program_id" SET NOT NULL`);

    await queryRunner.query(`DROP TABLE IF EXISTS "unit_classes"`);
    await queryRunner.query(`
      CREATE TABLE "unit_classes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "unit_id" uuid NOT NULL,
        "class_number" integer NOT NULL,
        "name" text NOT NULL,
        "type" text NOT NULL,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "PK_c753bb5f8f372e29155d4d67652" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`ALTER TABLE "unit_classes" ADD CONSTRAINT "FK_680e2efeb319c6ce55b6cae1a83" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "unit_classes" DROP CONSTRAINT IF EXISTS "FK_680e2efeb319c6ce55b6cae1a83"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "unit_classes"`);
    await queryRunner.query(`
      CREATE TABLE "unit_classes" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "unit_id" uuid,
        "category_id" uuid,
        "title" text,
        "description" text,
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP,
        CONSTRAINT "PK_c753bb5f8f372e29155d4d67652" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`ALTER TABLE "units" ALTER COLUMN "program_id" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "programs" ALTER COLUMN "level_id" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "programs" ALTER COLUMN "language_id" DROP NOT NULL`);
    await queryRunner.query(`ALTER TABLE "programs" DROP COLUMN "deleted_at"`);
    await queryRunner.query(`ALTER TABLE "programs" DROP COLUMN "description"`);
    await queryRunner.query(`ALTER TABLE "programs" RENAME COLUMN "total_units" TO "total_classes"`);
  }
}

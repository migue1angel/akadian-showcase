import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1778271200411 implements MigrationInterface {
    name = 'Initial1778271200411'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "description" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_48ce552495d14eae9b187bb6716" UNIQUE ("name"), CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "description" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_648e3f5447f725579d7d4ffdfb7" UNIQUE ("name"), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "username" text NOT NULL, "email" text NOT NULL, "password_hash" text NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "languages" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "is_active" boolean NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_b517f827ca496b29f4d549c631d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "UQ_8b0be371d28245da6e4f4b61878" UNIQUE ("name"), CONSTRAINT "PK_24dbc6126a28ff948da33e97d3b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "unit_class_files" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "unit_class_id" uuid, "file_name" text NOT NULL, "file_url" text NOT NULL, "file_size" bigint, "uploaded_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_abf7d4d4968f155e67937d0b58e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "unit_classes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "unit_id" uuid, "category_id" uuid, "title" text, "description" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_c753bb5f8f372e29155d4d67652" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "units" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "program_id" uuid, "name" text NOT NULL, "description" text, "unit_number" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_5a8f2f064919b587d93936cb223" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "programs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" text NOT NULL, "total_classes" integer NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "language_id" uuid, "level_id" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_d43c664bcaafc0e8a06dfd34e05" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "language_levels" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "language_id" uuid, "code" text NOT NULL, "weight" integer NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_af345e726e5993e123f7c15b7cc" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "tutor_proficiencies" ("user_id" uuid NOT NULL, "language_level_id" uuid NOT NULL, "is_native" boolean NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_f1b57b7611ff654fc3ca037eb3a" PRIMARY KEY ("user_id", "language_level_id"))`);
        await queryRunner.query(`CREATE TABLE "course_schedules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "course_id" uuid, "day_of_week" integer NOT NULL, "start_time" TIME NOT NULL, "end_time" TIME NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "CHK_86387761d168d5057865757ad6" CHECK ("day_of_week" >= 0 AND "day_of_week" <= 6), CONSTRAINT "PK_68118fc569f0c9ebb03fb79f80e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."class_sessions_status_enum" AS ENUM('SCHEDULED', 'COMPLETED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "class_sessions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "course_id" uuid, "scheduled_date" date NOT NULL, "session_number" integer NOT NULL, "status" "public"."class_sessions_status_enum" NOT NULL DEFAULT 'SCHEDULED', "unit_class_id" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_dc034da48c6e0cf95c51f606c4e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."courses_status_enum" AS ENUM('DRAFT', 'PUBLISHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "courses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "program_id" uuid, "capacity" integer NOT NULL, "enrolled_count" integer NOT NULL DEFAULT '0', "group_code" text NOT NULL, "total_sessions_held" integer NOT NULL DEFAULT '0', "time_zone" text NOT NULL, "status" "public"."courses_status_enum" NOT NULL DEFAULT 'DRAFT', "tutor_id" uuid, "is_open_for_enrollment" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_3f70a487cc718ad8eda4e6d58c9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "attendance_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "enrollment_id" uuid, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_e78c28cf950bd06d614ae09f26b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."enrollments_status_enum" AS ENUM('PENDING', 'PAUSED', 'ACTIVE', 'COMPLETED', 'DROPPED', 'TRANSFERRED')`);
        await queryRunner.query(`CREATE TABLE "enrollments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "course_id" uuid, "user_id" uuid, "classes_consumed" integer NOT NULL DEFAULT '0', "absences" integer NOT NULL DEFAULT '0', "enrolled_at_session_number" integer, "status" "public"."enrollments_status_enum" NOT NULL DEFAULT 'PENDING', "paused_at" TIMESTAMP, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_7c0f752f9fb68bf6ed7367ab00f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "student_proficiencies" ("user_id" uuid NOT NULL, "language_level_id" uuid NOT NULL, "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "PK_fc9b67d2b0b76c1b1061e703b5e" PRIMARY KEY ("user_id", "language_level_id"))`);
        await queryRunner.query(`CREATE TABLE "role_permissions" ("permission_id" uuid NOT NULL, "role_id" uuid NOT NULL, CONSTRAINT "PK_25d24010f53bb80b78e412c9656" PRIMARY KEY ("permission_id", "role_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_17022daf3f885f7d35423e9971" ON "role_permissions" ("permission_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_178199805b901ccd220ab7740e" ON "role_permissions" ("role_id") `);
        await queryRunner.query(`CREATE TABLE "user_roles" ("user_id" uuid NOT NULL, "role_id" uuid NOT NULL, CONSTRAINT "PK_23ed6f04fe43066df08379fd034" PRIMARY KEY ("user_id", "role_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_87b8888186ca9769c960e92687" ON "user_roles" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_b23c65e50a758245a33ee35fda" ON "user_roles" ("role_id") `);
        await queryRunner.query(`ALTER TABLE "unit_class_files" ADD CONSTRAINT "FK_9877f9d361348cba5587f3b9c76" FOREIGN KEY ("unit_class_id") REFERENCES "unit_classes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "unit_classes" ADD CONSTRAINT "FK_680e2efeb319c6ce55b6cae1a83" FOREIGN KEY ("unit_id") REFERENCES "units"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "unit_classes" ADD CONSTRAINT "FK_1e88d1b1acc391e29888fab35c7" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "units" ADD CONSTRAINT "FK_8e49f46215b59323933c5802c15" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "programs" ADD CONSTRAINT "FK_8e33ef3b3c47e0ae678464b4c9d" FOREIGN KEY ("language_id") REFERENCES "languages"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "programs" ADD CONSTRAINT "FK_958d7cfffcc1b7cfd1af84ac292" FOREIGN KEY ("level_id") REFERENCES "language_levels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "language_levels" ADD CONSTRAINT "FK_bd6f31c12df90b13706baaa19db" FOREIGN KEY ("language_id") REFERENCES "languages"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tutor_proficiencies" ADD CONSTRAINT "FK_ff0927f44724b2d75dae7dae6c4" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tutor_proficiencies" ADD CONSTRAINT "FK_9be6bfed3431b122f410d727359" FOREIGN KEY ("language_level_id") REFERENCES "language_levels"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "course_schedules" ADD CONSTRAINT "FK_f0cd61820798323cb06ca91105d" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "class_sessions" ADD CONSTRAINT "FK_1397d1e5d657291c564326ef505" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "class_sessions" ADD CONSTRAINT "FK_5c191f9d3fbc45b64853d413232" FOREIGN KEY ("unit_class_id") REFERENCES "unit_classes"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "courses" ADD CONSTRAINT "FK_ef3a23e394203eb11b06b77f695" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "courses" ADD CONSTRAINT "FK_72d6f185d29c3ace13018ed8bcc" FOREIGN KEY ("tutor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "attendance_logs" ADD CONSTRAINT "FK_7abf1ab49e97827d8b9ee5d959d" FOREIGN KEY ("enrollment_id") REFERENCES "enrollments"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "enrollments" ADD CONSTRAINT "FK_b79d0bf01779fdf9cfb6b092af3" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "enrollments" ADD CONSTRAINT "FK_ff997f5a39cd24a491b9aca45c9" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "student_proficiencies" ADD CONSTRAINT "FK_32e1206c68ab8d77254022337bf" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "student_proficiencies" ADD CONSTRAINT "FK_ed035c9e28b69852c35c23e0c2d" FOREIGN KEY ("language_level_id") REFERENCES "language_levels"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_17022daf3f885f7d35423e9971e" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_178199805b901ccd220ab7740ec" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_87b8888186ca9769c960e926870" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_b23c65e50a758245a33ee35fda1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_b23c65e50a758245a33ee35fda1"`);
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_87b8888186ca9769c960e926870"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_178199805b901ccd220ab7740ec"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_17022daf3f885f7d35423e9971e"`);
        await queryRunner.query(`ALTER TABLE "student_proficiencies" DROP CONSTRAINT "FK_ed035c9e28b69852c35c23e0c2d"`);
        await queryRunner.query(`ALTER TABLE "student_proficiencies" DROP CONSTRAINT "FK_32e1206c68ab8d77254022337bf"`);
        await queryRunner.query(`ALTER TABLE "enrollments" DROP CONSTRAINT "FK_ff997f5a39cd24a491b9aca45c9"`);
        await queryRunner.query(`ALTER TABLE "enrollments" DROP CONSTRAINT "FK_b79d0bf01779fdf9cfb6b092af3"`);
        await queryRunner.query(`ALTER TABLE "attendance_logs" DROP CONSTRAINT "FK_7abf1ab49e97827d8b9ee5d959d"`);
        await queryRunner.query(`ALTER TABLE "courses" DROP CONSTRAINT "FK_72d6f185d29c3ace13018ed8bcc"`);
        await queryRunner.query(`ALTER TABLE "courses" DROP CONSTRAINT "FK_ef3a23e394203eb11b06b77f695"`);
        await queryRunner.query(`ALTER TABLE "class_sessions" DROP CONSTRAINT "FK_5c191f9d3fbc45b64853d413232"`);
        await queryRunner.query(`ALTER TABLE "class_sessions" DROP CONSTRAINT "FK_1397d1e5d657291c564326ef505"`);
        await queryRunner.query(`ALTER TABLE "course_schedules" DROP CONSTRAINT "FK_f0cd61820798323cb06ca91105d"`);
        await queryRunner.query(`ALTER TABLE "tutor_proficiencies" DROP CONSTRAINT "FK_9be6bfed3431b122f410d727359"`);
        await queryRunner.query(`ALTER TABLE "tutor_proficiencies" DROP CONSTRAINT "FK_ff0927f44724b2d75dae7dae6c4"`);
        await queryRunner.query(`ALTER TABLE "language_levels" DROP CONSTRAINT "FK_bd6f31c12df90b13706baaa19db"`);
        await queryRunner.query(`ALTER TABLE "programs" DROP CONSTRAINT "FK_958d7cfffcc1b7cfd1af84ac292"`);
        await queryRunner.query(`ALTER TABLE "programs" DROP CONSTRAINT "FK_8e33ef3b3c47e0ae678464b4c9d"`);
        await queryRunner.query(`ALTER TABLE "units" DROP CONSTRAINT "FK_8e49f46215b59323933c5802c15"`);
        await queryRunner.query(`ALTER TABLE "unit_classes" DROP CONSTRAINT "FK_1e88d1b1acc391e29888fab35c7"`);
        await queryRunner.query(`ALTER TABLE "unit_classes" DROP CONSTRAINT "FK_680e2efeb319c6ce55b6cae1a83"`);
        await queryRunner.query(`ALTER TABLE "unit_class_files" DROP CONSTRAINT "FK_9877f9d361348cba5587f3b9c76"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b23c65e50a758245a33ee35fda"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_87b8888186ca9769c960e92687"`);
        await queryRunner.query(`DROP TABLE "user_roles"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_178199805b901ccd220ab7740e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_17022daf3f885f7d35423e9971"`);
        await queryRunner.query(`DROP TABLE "role_permissions"`);
        await queryRunner.query(`DROP TABLE "student_proficiencies"`);
        await queryRunner.query(`DROP TABLE "enrollments"`);
        await queryRunner.query(`DROP TYPE "public"."enrollments_status_enum"`);
        await queryRunner.query(`DROP TABLE "attendance_logs"`);
        await queryRunner.query(`DROP TABLE "courses"`);
        await queryRunner.query(`DROP TYPE "public"."courses_status_enum"`);
        await queryRunner.query(`DROP TABLE "class_sessions"`);
        await queryRunner.query(`DROP TYPE "public"."class_sessions_status_enum"`);
        await queryRunner.query(`DROP TABLE "course_schedules"`);
        await queryRunner.query(`DROP TABLE "tutor_proficiencies"`);
        await queryRunner.query(`DROP TABLE "language_levels"`);
        await queryRunner.query(`DROP TABLE "programs"`);
        await queryRunner.query(`DROP TABLE "units"`);
        await queryRunner.query(`DROP TABLE "unit_classes"`);
        await queryRunner.query(`DROP TABLE "unit_class_files"`);
        await queryRunner.query(`DROP TABLE "categories"`);
        await queryRunner.query(`DROP TABLE "languages"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "roles"`);
        await queryRunner.query(`DROP TABLE "permissions"`);
    }

}

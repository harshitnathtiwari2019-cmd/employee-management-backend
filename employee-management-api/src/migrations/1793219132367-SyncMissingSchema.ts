import { MigrationInterface, QueryRunner } from "typeorm";

export class SyncMissingSchema1793219132367 implements MigrationInterface {
  name = "SyncMissingSchema1793219132367";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
    ALTER TABLE "employees"
    ADD COLUMN IF NOT EXISTS "mobile" character varying(20)
  `);

    await queryRunner.query(`
    ALTER TABLE "refresh_tokens"
    ADD COLUMN IF NOT EXISTS "session_id" uuid
  `);

    await queryRunner.query(`
    UPDATE "refresh_tokens"
    SET "session_id" = uuid_generate_v4()
    WHERE "session_id" IS NULL
  `);

    await queryRunner.query(`
    ALTER TABLE "refresh_tokens"
    ALTER COLUMN "session_id" SET NOT NULL
  `);

    await queryRunner.query(`
    CREATE TABLE IF NOT EXISTS "activity" (
      "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
      "employee_id" uuid NOT NULL,
      "description" text NOT NULL,
      CONSTRAINT "PK_activity_id" PRIMARY KEY ("id")
    )
  `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Keep this migration reversible without deleting activity data.
    await queryRunner.query(`
      ALTER TABLE "refresh_tokens"
      ALTER COLUMN "session_id" DROP NOT NULL
    `);

    // Intentionally retain the added column/table on rollback
    // to avoid deleting potentially valuable data.
  }
}

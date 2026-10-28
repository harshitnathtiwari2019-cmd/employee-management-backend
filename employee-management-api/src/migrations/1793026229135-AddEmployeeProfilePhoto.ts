import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmployeeProfilePhoto1793026229135 implements MigrationInterface {
    name = 'AddEmployeeProfilePhoto1793026229135'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "employees" ADD "profilePhoto" character varying(255)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "employees" DROP COLUMN "profilePhoto"`);
    }

}

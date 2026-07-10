import { MigrationInterface, QueryRunner } from "typeorm";

export class AutoMigration1783642162502 implements MigrationInterface {
    name = 'AutoMigration1783642162502'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."otps_type_enum" AS ENUM('email_verification', 'password_reset')`);
        await queryRunner.query(`CREATE TABLE "otps" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" "public"."otps_type_enum" NOT NULL, "otpHash" text NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "usedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "PK_91fef5ed60605b854a2115d2410" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "refresh_tokens" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "hashedToken" text NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "revokedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, CONSTRAINT "PK_7d8bee0204106019488c4c50ffa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."jobs_employmenttype_enum" AS ENUM('full_time', 'part_time', 'internship', 'contract')`);
        await queryRunner.query(`CREATE TYPE "public"."jobs_experiencelevel_enum" AS ENUM('fresher', 'mid', 'senior')`);
        await queryRunner.query(`CREATE TABLE "jobs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(50) NOT NULL, "description" text NOT NULL, "location" character varying(100) NOT NULL, "isRemote" boolean NOT NULL DEFAULT false, "salaryMin" integer NOT NULL, "salaryMax" integer NOT NULL, "employmentType" "public"."jobs_employmenttype_enum" NOT NULL, "experienceLevel" "public"."jobs_experiencelevel_enum" NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "organizationId" uuid, "createdById" uuid, CONSTRAINT "PK_cf0a6c42b72fcc7f7c237def345" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "organization_verification_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" character varying, "domain" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "organizationId" uuid, CONSTRAINT "REL_da0b94a27fa8c248cf4f621116" UNIQUE ("organizationId"), CONSTRAINT "PK_effb5d922831978620fec120cee" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "organization_reports" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "reason" character varying NOT NULL, "description" character varying, "status" character varying NOT NULL DEFAULT 'open', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "organizationId" uuid, "reporterId" uuid, CONSTRAINT "PK_62fdacaca5f49607c534a45a765" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "organizations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "website" character varying, "description" character varying, "address" character varying, "logoUrl" character varying, "bannerUrl" character varying, "joinCode" character varying NOT NULL, "verifiedDomain" character varying, "isVerified" boolean NOT NULL DEFAULT false, "verifiedAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_9b7ca6d30b94fef571cff876884" UNIQUE ("name"), CONSTRAINT "UQ_484cc8be307fc7b88c037da31c2" UNIQUE ("logoUrl"), CONSTRAINT "UQ_fbcccb6259c67203c496a4940fa" UNIQUE ("joinCode"), CONSTRAINT "PK_6b031fcd0863e3f6b44230163f9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."organization_members_role_enum" AS ENUM('admin', 'member')`);
        await queryRunner.query(`CREATE TABLE "organization_members" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "role" "public"."organization_members_role_enum" NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" uuid, "organizationId" uuid, CONSTRAINT "PK_c2b39d5d072886a4d9c8105eb9a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('candidate', 'recruiter')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "username" character varying(24), "role" "public"."users_role_enum", "onboardingComplete" boolean NOT NULL DEFAULT false, "firstName" character varying(50), "lastName" character varying(50), "googleId" character varying, "email" character varying NOT NULL, "hashedPassword" character varying, "avatarUrl" text, "bio" text, "phoneNumber" character varying(20), "emailVerified" boolean NOT NULL DEFAULT false, "location" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "UQ_f382af58ab36057334fb262efd5" UNIQUE ("googleId"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."applications_status_enum" AS ENUM('applied', 'reviewing', 'shortlisted', 'rejected', 'hired')`);
        await queryRunner.query(`CREATE TABLE "applications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "status" "public"."applications_status_enum" NOT NULL DEFAULT 'applied', "resumePublicId" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "jobId" uuid, "applicantId" uuid, CONSTRAINT "PK_938c0a27255637bde919591888f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "otps" ADD CONSTRAINT "FK_82b0deb105275568cdcef2823eb" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" ADD CONSTRAINT "FK_610102b60fea1455310ccd299de" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD CONSTRAINT "FK_08bdc8b939f39e6d55b4c38cfb9" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "jobs" ADD CONSTRAINT "FK_942364c910910a09a018566455e" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "organization_verification_requests" ADD CONSTRAINT "FK_da0b94a27fa8c248cf4f6211167" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "organization_reports" ADD CONSTRAINT "FK_7e483af027a515861faf0014447" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "organization_reports" ADD CONSTRAINT "FK_1c3af0824eddede0ddb191ab7cd" FOREIGN KEY ("reporterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "organization_members" ADD CONSTRAINT "FK_e826222ad017663c6db1a45a4f1" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "organization_members" ADD CONSTRAINT "FK_5652c2c6b066835b6c500d0d83f" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "applications" ADD CONSTRAINT "FK_f6ebb8bc5061068e4dd97df3c77" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "applications" ADD CONSTRAINT "FK_909867e55cc94e350ae38383cb5" FOREIGN KEY ("applicantId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "applications" DROP CONSTRAINT "FK_909867e55cc94e350ae38383cb5"`);
        await queryRunner.query(`ALTER TABLE "applications" DROP CONSTRAINT "FK_f6ebb8bc5061068e4dd97df3c77"`);
        await queryRunner.query(`ALTER TABLE "organization_members" DROP CONSTRAINT "FK_5652c2c6b066835b6c500d0d83f"`);
        await queryRunner.query(`ALTER TABLE "organization_members" DROP CONSTRAINT "FK_e826222ad017663c6db1a45a4f1"`);
        await queryRunner.query(`ALTER TABLE "organization_reports" DROP CONSTRAINT "FK_1c3af0824eddede0ddb191ab7cd"`);
        await queryRunner.query(`ALTER TABLE "organization_reports" DROP CONSTRAINT "FK_7e483af027a515861faf0014447"`);
        await queryRunner.query(`ALTER TABLE "organization_verification_requests" DROP CONSTRAINT "FK_da0b94a27fa8c248cf4f6211167"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP CONSTRAINT "FK_942364c910910a09a018566455e"`);
        await queryRunner.query(`ALTER TABLE "jobs" DROP CONSTRAINT "FK_08bdc8b939f39e6d55b4c38cfb9"`);
        await queryRunner.query(`ALTER TABLE "refresh_tokens" DROP CONSTRAINT "FK_610102b60fea1455310ccd299de"`);
        await queryRunner.query(`ALTER TABLE "otps" DROP CONSTRAINT "FK_82b0deb105275568cdcef2823eb"`);
        await queryRunner.query(`DROP TABLE "applications"`);
        await queryRunner.query(`DROP TYPE "public"."applications_status_enum"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`DROP TABLE "organization_members"`);
        await queryRunner.query(`DROP TYPE "public"."organization_members_role_enum"`);
        await queryRunner.query(`DROP TABLE "organizations"`);
        await queryRunner.query(`DROP TABLE "organization_reports"`);
        await queryRunner.query(`DROP TABLE "organization_verification_requests"`);
        await queryRunner.query(`DROP TABLE "jobs"`);
        await queryRunner.query(`DROP TYPE "public"."jobs_experiencelevel_enum"`);
        await queryRunner.query(`DROP TYPE "public"."jobs_employmenttype_enum"`);
        await queryRunner.query(`DROP TABLE "refresh_tokens"`);
        await queryRunner.query(`DROP TABLE "otps"`);
        await queryRunner.query(`DROP TYPE "public"."otps_type_enum"`);
    }

}

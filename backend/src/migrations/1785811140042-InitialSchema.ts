import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1785811140042 implements MigrationInterface {
    name = 'InitialSchema1785811140042'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "passwordHash" character varying NOT NULL, "fullName" character varying NOT NULL, "role" character varying NOT NULL DEFAULT 'employee', "companyId" uuid, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "companies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantCode" character varying NOT NULL, "name" character varying NOT NULL, "businessType" character varying NOT NULL DEFAULT 'autre', "phone" character varying, "email" character varying, "status" character varying NOT NULL DEFAULT 'active', "licenseKey" character varying NOT NULL, "subscriptionStart" TIMESTAMP NOT NULL, "subscriptionEnd" TIMESTAMP NOT NULL, "subscriptionDurationDays" integer NOT NULL DEFAULT '30', "aiEnabled" boolean NOT NULL DEFAULT false, "aiPersonality" text, "whatsappPhoneNumberId" character varying, "lastExpiryReminderThreshold" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_5c6deb3b5d395bc94aa62358e38" UNIQUE ("tenantCode"), CONSTRAINT "UQ_c4125b1e66cfb7e0088d0535579" UNIQUE ("licenseKey"), CONSTRAINT "PK_d4bc3e82a314fa9e29f652c2c22" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "clients" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "companyId" uuid NOT NULL, "fullName" character varying NOT NULL, "phone" character varying, "email" character varying, "notes" text, "preferences" text, "visitsCount" integer NOT NULL DEFAULT '0', "totalSpent" double precision NOT NULL DEFAULT '0', "loyaltyPoints" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_f1ab7cf3a5714dbc6bb4e1c28a4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5016a1ccedbea5f26d46376d6b" ON "clients" ("companyId") `);
        await queryRunner.query(`CREATE TABLE "appointments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "companyId" uuid NOT NULL, "clientId" uuid NOT NULL, "serviceLabel" character varying NOT NULL, "startTime" TIMESTAMP NOT NULL, "durationMinutes" integer NOT NULL DEFAULT '30', "status" character varying NOT NULL DEFAULT 'pending', "estimatedPrice" double precision, "notes" text, "reminder24hSent" boolean NOT NULL DEFAULT false, "reminder2hSent" boolean NOT NULL DEFAULT false, "reminder30minSent" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4a437a9a27e948726b8bb3e36ad" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7a6efb318059ac335c40e1f455" ON "appointments" ("companyId", "startTime") `);
        await queryRunner.query(`CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "companyId" uuid NOT NULL, "provider" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'pending', "purpose" character varying NOT NULL DEFAULT 'subscription_renewal', "amount" double precision NOT NULL, "currency" character varying NOT NULL DEFAULT 'XOF', "reference" character varying NOT NULL, "providerTransactionId" character varying, "subscriptionDaysGranted" integer NOT NULL, "failureReason" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "confirmedAt" TIMESTAMP, CONSTRAINT "UQ_866ddee0e17d9385b4e3b86851d" UNIQUE ("reference"), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_79fa12c269730f9e1eb40b09d3" ON "payments" ("companyId") `);
        await queryRunner.query(`CREATE TABLE "notification_logs" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "companyId" character varying, "channel" character varying NOT NULL, "category" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'sent', "recipient" character varying NOT NULL, "message" text NOT NULL, "failureReason" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_19c524e644cdeaebfcffc284871" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_bbed62e32651e9d742e0959649" ON "notification_logs" ("companyId") `);
        await queryRunner.query(`CREATE TABLE "ai_messages" ("seq" SERIAL NOT NULL, "id" uuid NOT NULL DEFAULT uuid_generate_v4(), "companyId" character varying NOT NULL, "clientPhone" character varying NOT NULL, "role" character varying NOT NULL, "content" text NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_a390434d4a515ba18a41bc996c2" UNIQUE ("id"), CONSTRAINT "PK_c7f8b0f6bf2dd23329e9350b0c4" PRIMARY KEY ("seq"))`);
        await queryRunner.query(`CREATE INDEX "IDX_36bb8af09e328427ae310aa15e" ON "ai_messages" ("companyId", "clientPhone") `);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_6f9395c9037632a31107c8a9e58" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "clients" ADD CONSTRAINT "FK_5016a1ccedbea5f26d46376d6b2" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD CONSTRAINT "FK_48d9b0c87ddc67da594c616dca2" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD CONSTRAINT "FK_c4dbd8eb292b83b5dc67be3cf45" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_79fa12c269730f9e1eb40b09d3b" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_79fa12c269730f9e1eb40b09d3b"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT "FK_c4dbd8eb292b83b5dc67be3cf45"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT "FK_48d9b0c87ddc67da594c616dca2"`);
        await queryRunner.query(`ALTER TABLE "clients" DROP CONSTRAINT "FK_5016a1ccedbea5f26d46376d6b2"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_6f9395c9037632a31107c8a9e58"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_36bb8af09e328427ae310aa15e"`);
        await queryRunner.query(`DROP TABLE "ai_messages"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bbed62e32651e9d742e0959649"`);
        await queryRunner.query(`DROP TABLE "notification_logs"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_79fa12c269730f9e1eb40b09d3"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7a6efb318059ac335c40e1f455"`);
        await queryRunner.query(`DROP TABLE "appointments"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5016a1ccedbea5f26d46376d6b"`);
        await queryRunner.query(`DROP TABLE "clients"`);
        await queryRunner.query(`DROP TABLE "companies"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}

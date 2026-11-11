-- Official resource snapshot and link health tracking.

ALTER TABLE "patch_resource"
ADD COLUMN "is_official" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "patch_resource_link"
ADD COLUMN "health_status" VARCHAR(32) NOT NULL DEFAULT 'unknown',
ADD COLUMN "last_checked_at" TIMESTAMP(3),
ADD COLUMN "last_ok_at" TIMESTAMP(3),
ADD COLUMN "check_errno" INTEGER,
ADD COLUMN "check_message" VARCHAR(1007) NOT NULL DEFAULT '',
ADD COLUMN "remote_md5" VARCHAR(64) NOT NULL DEFAULT '',
ADD COLUMN "remote_size" VARCHAR(64) NOT NULL DEFAULT '',
ADD COLUMN "fail_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "replaced_by" INTEGER;

-- Existing resources uploaded by role 3/4 become official snapshots.
UPDATE "patch_resource" AS resource
SET "is_official" = true
FROM "user" AS owner
WHERE resource."user_id" = owner."id"
  AND owner."role" >= 3;

CREATE INDEX "patch_resource_is_official_status_idx"
ON "patch_resource"("is_official", "status");

CREATE INDEX "patch_resource_link_health_status_last_checked_at_idx"
ON "patch_resource_link"("health_status", "last_checked_at");

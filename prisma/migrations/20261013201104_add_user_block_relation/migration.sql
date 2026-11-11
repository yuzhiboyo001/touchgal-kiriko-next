-- DropIndex
DROP INDEX "patch_released_idx";

-- CreateTable
CREATE TABLE "user_block_relation" (
    "id" SERIAL NOT NULL,
    "blocker_id" INTEGER NOT NULL,
    "blocked_id" INTEGER NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_block_relation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_block_relation_blocker_id_idx" ON "user_block_relation"("blocker_id");

-- CreateIndex
CREATE INDEX "user_block_relation_blocked_id_idx" ON "user_block_relation"("blocked_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_block_relation_blocker_id_blocked_id_key" ON "user_block_relation"("blocker_id", "blocked_id");

-- CreateIndex
CREATE INDEX "patch_released_idx" ON "patch"("released" text_pattern_ops);

-- AddForeignKey
ALTER TABLE "user_block_relation" ADD CONSTRAINT "user_block_relation_blocker_id_fkey" FOREIGN KEY ("blocker_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_block_relation" ADD CONSTRAINT "user_block_relation_blocked_id_fkey" FOREIGN KEY ("blocked_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "brain_memory"
  ADD COLUMN "type" VARCHAR(20) NOT NULL DEFAULT 'episode',
  ADD COLUMN "source_turn" INTEGER,
  ADD COLUMN "evidence" TEXT,
  ADD COLUMN "status" VARCHAR(20);

CREATE INDEX "brain_memory_user_id_character_type_idx"
  ON "brain_memory"("user_id", "character", "type");

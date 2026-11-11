ALTER TABLE "brain_memory"
  ADD COLUMN "slot" VARCHAR(40);

CREATE UNIQUE INDEX "brain_memory_user_id_character_slot_key"
  ON "brain_memory"("user_id", "character", "slot");

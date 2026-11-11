-- CreateTable
CREATE TABLE "admin_log" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "content" VARCHAR(10007) NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 0,
    "user_id" INTEGER NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_conversation" (
    "id" SERIAL NOT NULL,
    "user_a_id" INTEGER NOT NULL,
    "user_b_id" INTEGER NOT NULL,
    "last_message_id" INTEGER,
    "last_message_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_a_unread_count" INTEGER NOT NULL DEFAULT 0,
    "user_b_unread_count" INTEGER NOT NULL DEFAULT 0,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_private_message" (
    "id" SERIAL NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "sender_id" INTEGER NOT NULL,
    "content" VARCHAR(2000) NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 0,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "edited_at" TIMESTAMP(3),
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_private_message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kiriko_profile" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "character" VARCHAR(20) NOT NULL,
    "affection" INTEGER NOT NULL DEFAULT 0,
    "affection_level" INTEGER NOT NULL DEFAULT 1,
    "coins" INTEGER NOT NULL DEFAULT 0,
    "total_days" INTEGER NOT NULL DEFAULT 0,
    "last_chat_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "first_chat_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "achievements" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "purchase_history" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kiriko_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kiriko_user_task" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "task_id" TEXT NOT NULL,
    "task_type" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "week_start" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kiriko_user_task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patch_comment" (
    "id" SERIAL NOT NULL,
    "content" VARCHAR(10007) NOT NULL DEFAULT '',
    "content_html" TEXT NOT NULL DEFAULT '',
    "content_html_version" INTEGER NOT NULL DEFAULT 0,
    "edit" TEXT NOT NULL DEFAULT '',
    "is_spoiler" BOOLEAN NOT NULL DEFAULT false,
    "parent_id" INTEGER,
    "user_id" INTEGER NOT NULL,
    "patch_id" INTEGER NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patch_comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_patch_comment_like_relation" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "comment_id" INTEGER NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_patch_comment_like_relation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patch_company" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(107) NOT NULL,
    "introduction" VARCHAR(10007) NOT NULL DEFAULT '',
    "count" INTEGER NOT NULL DEFAULT 0,
    "primary_language" TEXT[],
    "official_website" TEXT[],
    "parent_brand" TEXT[],
    "alias" TEXT[],
    "user_id" INTEGER NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patch_company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patch_company_relation" (
    "id" SERIAL NOT NULL,
    "patch_id" INTEGER NOT NULL,
    "company_id" INTEGER NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patch_company_relation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patch_rating" (
    "id" SERIAL NOT NULL,
    "recommend" TEXT NOT NULL,
    "overall" INTEGER NOT NULL,
    "play_status" TEXT NOT NULL DEFAULT 'not_started',
    "short_summary" VARCHAR(1314) NOT NULL DEFAULT '',
    "spoiler_level" TEXT NOT NULL DEFAULT 'none',
    "user_id" INTEGER NOT NULL,
    "patch_id" INTEGER NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patch_rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patch_rating_like" (
    "id" SERIAL NOT NULL,
    "patch_rating_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patch_rating_like_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patch_rating_stat" (
    "patch_id" INTEGER NOT NULL,
    "avg_overall" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "count" INTEGER NOT NULL DEFAULT 0,
    "rec_strong_no" INTEGER NOT NULL DEFAULT 0,
    "rec_no" INTEGER NOT NULL DEFAULT 0,
    "rec_neutral" INTEGER NOT NULL DEFAULT 0,
    "rec_yes" INTEGER NOT NULL DEFAULT 0,
    "rec_strong_yes" INTEGER NOT NULL DEFAULT 0,
    "o1" INTEGER NOT NULL DEFAULT 0,
    "o2" INTEGER NOT NULL DEFAULT 0,
    "o3" INTEGER NOT NULL DEFAULT 0,
    "o4" INTEGER NOT NULL DEFAULT 0,
    "o5" INTEGER NOT NULL DEFAULT 0,
    "o6" INTEGER NOT NULL DEFAULT 0,
    "o7" INTEGER NOT NULL DEFAULT 0,
    "o8" INTEGER NOT NULL DEFAULT 0,
    "o9" INTEGER NOT NULL DEFAULT 0,
    "o10" INTEGER NOT NULL DEFAULT 0,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patch_rating_stat_pkey" PRIMARY KEY ("patch_id")
);

-- CreateTable
CREATE TABLE "patch_report" (
    "id" SERIAL NOT NULL,
    "target_type" VARCHAR(16) NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 0,
    "reason" VARCHAR(5007) NOT NULL,
    "handler_reply" VARCHAR(5007) NOT NULL DEFAULT '',
    "handled_at" TIMESTAMP(3),
    "sender_id" INTEGER NOT NULL,
    "reported_user_id" INTEGER NOT NULL,
    "handler_id" INTEGER,
    "patch_id" INTEGER NOT NULL,
    "comment_id" INTEGER,
    "rating_id" INTEGER,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patch_report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patch_resource" (
    "id" SERIAL NOT NULL,
    "section" VARCHAR(107) NOT NULL,
    "name" VARCHAR(300) NOT NULL DEFAULT '',
    "note" VARCHAR(10007) NOT NULL DEFAULT '',
    "type" TEXT[],
    "language" TEXT[],
    "platform" TEXT[],
    "download" INTEGER NOT NULL DEFAULT 0,
    "status" INTEGER NOT NULL DEFAULT 0,
    "user_id" INTEGER NOT NULL,
    "patch_id" INTEGER NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patch_resource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patch_resource_link" (
    "id" SERIAL NOT NULL,
    "storage" VARCHAR(107) NOT NULL,
    "size" VARCHAR(107) NOT NULL DEFAULT '',
    "code" VARCHAR(1007) NOT NULL DEFAULT '',
    "password" VARCHAR(1007) NOT NULL DEFAULT '',
    "hash" TEXT NOT NULL DEFAULT '',
    "s3_key" VARCHAR(2048) NOT NULL DEFAULT '',
    "content" TEXT NOT NULL DEFAULT '',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "download" INTEGER NOT NULL DEFAULT 0,
    "resource_id" INTEGER NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patch_resource_link_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_patch_resource_like_relation" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "resource_id" INTEGER NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_patch_resource_like_relation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patch_tag" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(107) NOT NULL,
    "introduction" VARCHAR(10007) NOT NULL DEFAULT '',
    "count" INTEGER NOT NULL DEFAULT 0,
    "alias" TEXT[],
    "source" TEXT NOT NULL DEFAULT 'self',
    "vndb_original_name" TEXT,
    "vndb_category" TEXT,
    "vndb_spoiler" INTEGER,
    "vndb_rating" DOUBLE PRECISION,
    "user_id" INTEGER NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patch_tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patch_tag_relation" (
    "id" SERIAL NOT NULL,
    "patch_id" INTEGER NOT NULL,
    "tag_id" INTEGER NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patch_tag_relation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patch" (
    "id" SERIAL NOT NULL,
    "unique_id" VARCHAR(8) NOT NULL,
    "name" VARCHAR(1007) NOT NULL,
    "vndb_id" VARCHAR(107),
    "vndb_relation_id" VARCHAR(107),
    "bangumi_id" INTEGER,
    "steam_id" INTEGER,
    "dlsite_code" VARCHAR(107),
    "banner" VARCHAR(1007) NOT NULL DEFAULT '',
    "introduction" VARCHAR(100007) NOT NULL DEFAULT '',
    "released" VARCHAR(107) NOT NULL DEFAULT 'unknown',
    "content_limit" VARCHAR(107) NOT NULL DEFAULT '',
    "status" INTEGER NOT NULL DEFAULT 0,
    "download" INTEGER NOT NULL DEFAULT 0,
    "view" INTEGER NOT NULL DEFAULT 0,
    "resource_update_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT[],
    "language" TEXT[],
    "engine" TEXT[],
    "platform" TEXT[],
    "favorite_count" INTEGER NOT NULL DEFAULT 0,
    "resource_count" INTEGER NOT NULL DEFAULT 0,
    "comment_count" INTEGER NOT NULL DEFAULT 0,
    "user_id" INTEGER NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patch_alias" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(1007) NOT NULL,
    "patch_id" INTEGER NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patch_alias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(17) NOT NULL,
    "email" VARCHAR(1007) NOT NULL,
    "password" VARCHAR(1007) NOT NULL,
    "ip" VARCHAR(233) NOT NULL DEFAULT '',
    "avatar" VARCHAR(233) NOT NULL DEFAULT '',
    "role" INTEGER NOT NULL DEFAULT 1,
    "status" INTEGER NOT NULL DEFAULT 0,
    "register_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "moemoepoint" INTEGER NOT NULL DEFAULT 0,
    "bio" VARCHAR(107) NOT NULL DEFAULT '',
    "chat_daily_count" INTEGER NOT NULL DEFAULT 0,
    "chat_last_used_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enable_email_notice" BOOLEAN NOT NULL DEFAULT true,
    "allow_private_message" BOOLEAN NOT NULL DEFAULT true,
    "blocked_tag_ids" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "daily_image_count" INTEGER NOT NULL DEFAULT 0,
    "daily_check_in" INTEGER NOT NULL DEFAULT 0,
    "daily_upload_size" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "last_login_time" TEXT NOT NULL DEFAULT '',
    "enable_2fa" BOOLEAN NOT NULL DEFAULT false,
    "two_factor_secret" TEXT NOT NULL DEFAULT '',
    "two_factor_backup" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_follow_relation" (
    "id" SERIAL NOT NULL,
    "follower_id" INTEGER NOT NULL,
    "following_id" INTEGER NOT NULL,

    CONSTRAINT "user_follow_relation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_message" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "content" VARCHAR(10007) NOT NULL,
    "status" INTEGER NOT NULL DEFAULT 0,
    "link" VARCHAR(1007) NOT NULL DEFAULT '',
    "sender_id" INTEGER,
    "recipient_id" INTEGER,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_patch_favorite_folder" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500) NOT NULL DEFAULT '',
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "user_id" INTEGER NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_patch_favorite_folder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_patch_favorite_folder_relation" (
    "id" SERIAL NOT NULL,
    "folder_id" INTEGER NOT NULL,
    "patch_id" INTEGER NOT NULL,
    "created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_patch_favorite_folder_relation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_log" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "character" VARCHAR(20) NOT NULL,
    "role" VARCHAR(10) NOT NULL,
    "content" TEXT NOT NULL,
    "turn_number" INTEGER NOT NULL DEFAULT 0,
    "is_summarized" BOOLEAN NOT NULL DEFAULT false,
    "memory_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brain_memory" (
    "id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "character" VARCHAR(20) NOT NULL,
    "content" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brain_memory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_conversation_user_a_id_last_message_time_id_idx" ON "user_conversation"("user_a_id", "last_message_time" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "user_conversation_user_b_id_last_message_time_id_idx" ON "user_conversation"("user_b_id", "last_message_time" DESC, "id" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "user_conversation_user_a_id_user_b_id_key" ON "user_conversation"("user_a_id", "user_b_id");

-- CreateIndex
CREATE INDEX "user_private_message_conversation_id_created_id_idx" ON "user_private_message"("conversation_id", "created" DESC, "id" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "kiriko_profile_user_id_key" ON "kiriko_profile"("user_id");

-- CreateIndex
CREATE INDEX "kiriko_profile_user_id_character_idx" ON "kiriko_profile"("user_id", "character");

-- CreateIndex
CREATE INDEX "kiriko_user_task_user_id_task_type_idx" ON "kiriko_user_task"("user_id", "task_type");

-- CreateIndex
CREATE INDEX "kiriko_user_task_user_id_task_id_idx" ON "kiriko_user_task"("user_id", "task_id");

-- CreateIndex
CREATE UNIQUE INDEX "kiriko_user_task_user_id_task_id_key" ON "kiriko_user_task"("user_id", "task_id");

-- CreateIndex
CREATE INDEX "patch_comment_patch_id_parent_id_created_id_idx" ON "patch_comment"("patch_id", "parent_id", "created" DESC, "id" DESC);

-- CreateIndex
CREATE INDEX "patch_comment_parent_id_idx" ON "patch_comment"("parent_id");

-- CreateIndex
CREATE INDEX "patch_comment_user_id_created_idx" ON "patch_comment"("user_id", "created" DESC);

-- CreateIndex
CREATE INDEX "user_patch_comment_like_relation_comment_id_idx" ON "user_patch_comment_like_relation"("comment_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_patch_comment_like_relation_user_id_comment_id_key" ON "user_patch_comment_like_relation"("user_id", "comment_id");

-- CreateIndex
CREATE INDEX "patch_company_name_idx" ON "patch_company"("name");

-- CreateIndex
CREATE INDEX "patch_company_relation_company_id_idx" ON "patch_company_relation"("company_id");

-- CreateIndex
CREATE UNIQUE INDEX "patch_company_relation_patch_id_company_id_key" ON "patch_company_relation"("patch_id", "company_id");

-- CreateIndex
CREATE INDEX "patch_rating_patch_id_idx" ON "patch_rating"("patch_id");

-- CreateIndex
CREATE UNIQUE INDEX "patch_rating_user_id_patch_id_key" ON "patch_rating"("user_id", "patch_id");

-- CreateIndex
CREATE UNIQUE INDEX "patch_rating_like_patch_rating_id_user_id_key" ON "patch_rating_like"("patch_rating_id", "user_id");

-- CreateIndex
CREATE INDEX "patch_rating_stat_avg_overall_idx" ON "patch_rating_stat"("avg_overall");

-- CreateIndex
CREATE INDEX "patch_rating_stat_count_idx" ON "patch_rating_stat"("count");

-- CreateIndex
CREATE INDEX "patch_report_status_target_type_created_idx" ON "patch_report"("status", "target_type", "created" DESC);

-- CreateIndex
CREATE INDEX "patch_report_target_type_comment_id_status_idx" ON "patch_report"("target_type", "comment_id", "status");

-- CreateIndex
CREATE INDEX "patch_report_target_type_rating_id_status_idx" ON "patch_report"("target_type", "rating_id", "status");

-- CreateIndex
CREATE INDEX "patch_report_sender_id_idx" ON "patch_report"("sender_id");

-- CreateIndex
CREATE INDEX "patch_report_reported_user_id_idx" ON "patch_report"("reported_user_id");

-- CreateIndex
CREATE INDEX "patch_report_patch_id_idx" ON "patch_report"("patch_id");

-- CreateIndex
CREATE INDEX "patch_resource_patch_id_idx" ON "patch_resource"("patch_id");

-- CreateIndex
CREATE INDEX "patch_resource_section_status_created_idx" ON "patch_resource"("section", "status", "created" DESC);

-- CreateIndex
CREATE INDEX "patch_resource_link_resource_id_sort_order_idx" ON "patch_resource_link"("resource_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "user_patch_resource_like_relation_user_id_resource_id_key" ON "user_patch_resource_like_relation"("user_id", "resource_id");

-- CreateIndex
CREATE UNIQUE INDEX "patch_tag_name_key" ON "patch_tag"("name");

-- CreateIndex
CREATE INDEX "patch_tag_count_idx" ON "patch_tag"("count");

-- CreateIndex
CREATE INDEX "patch_tag_relation_tag_id_idx" ON "patch_tag_relation"("tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "patch_tag_relation_patch_id_tag_id_key" ON "patch_tag_relation"("patch_id", "tag_id");

-- CreateIndex
CREATE UNIQUE INDEX "patch_unique_id_key" ON "patch"("unique_id");

-- CreateIndex
CREATE UNIQUE INDEX "patch_bangumi_id_key" ON "patch"("bangumi_id");

-- CreateIndex
CREATE UNIQUE INDEX "patch_steam_id_key" ON "patch"("steam_id");

-- CreateIndex
CREATE UNIQUE INDEX "patch_dlsite_code_key" ON "patch"("dlsite_code");

-- CreateIndex
CREATE INDEX "patch_created_idx" ON "patch"("created");

-- CreateIndex
CREATE INDEX "patch_resource_update_time_idx" ON "patch"("resource_update_time");

-- CreateIndex
CREATE INDEX "patch_content_limit_idx" ON "patch"("content_limit");

-- CreateIndex
CREATE INDEX "patch_released_idx" ON "patch"("released" text_pattern_ops);

-- CreateIndex
CREATE INDEX "patch_favorite_count_idx" ON "patch"("favorite_count");

-- CreateIndex
CREATE INDEX "patch_type_idx" ON "patch" USING GIN ("type");

-- CreateIndex
CREATE INDEX "patch_language_idx" ON "patch" USING GIN ("language");

-- CreateIndex
CREATE INDEX "patch_platform_idx" ON "patch" USING GIN ("platform");

-- CreateIndex
CREATE UNIQUE INDEX "patch_vndb_id_vndb_relation_id_key" ON "patch"("vndb_id", "vndb_relation_id");

-- CreateIndex
CREATE INDEX "patch_alias_patch_id_idx" ON "patch_alias"("patch_id");

-- CreateIndex
CREATE INDEX "patch_alias_name_idx" ON "patch_alias"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_name_key" ON "user"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_follow_relation_follower_id_following_id_key" ON "user_follow_relation"("follower_id", "following_id");

-- CreateIndex
CREATE INDEX "user_message_recipient_id_status_type_id_idx" ON "user_message"("recipient_id", "status", "type", "id");

-- CreateIndex
CREATE INDEX "user_message_recipient_id_sender_id_type_idx" ON "user_message"("recipient_id", "sender_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "user_patch_favorite_folder_user_id_name_key" ON "user_patch_favorite_folder"("user_id", "name");

-- CreateIndex
CREATE INDEX "upffr_patch_id_idx" ON "user_patch_favorite_folder_relation"("patch_id");

-- CreateIndex
CREATE INDEX "upffr_folder_created_id_idx" ON "user_patch_favorite_folder_relation"("folder_id", "created" DESC, "id");

-- CreateIndex
CREATE UNIQUE INDEX "user_patch_favorite_folder_relation_folder_id_patch_id_key" ON "user_patch_favorite_folder_relation"("folder_id", "patch_id");

-- CreateIndex
CREATE INDEX "conversation_log_user_id_character_is_summarized_idx" ON "conversation_log"("user_id", "character", "is_summarized");

-- CreateIndex
CREATE INDEX "conversation_log_user_id_character_turn_number_idx" ON "conversation_log"("user_id", "character", "turn_number");

-- CreateIndex
CREATE INDEX "brain_memory_user_id_character_is_active_idx" ON "brain_memory"("user_id", "character", "is_active");

-- CreateIndex
CREATE INDEX "brain_memory_user_id_character_created_at_idx" ON "brain_memory"("user_id", "character", "created_at");

-- AddForeignKey
ALTER TABLE "admin_log" ADD CONSTRAINT "admin_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_conversation" ADD CONSTRAINT "user_conversation_user_a_id_fkey" FOREIGN KEY ("user_a_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_conversation" ADD CONSTRAINT "user_conversation_user_b_id_fkey" FOREIGN KEY ("user_b_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_private_message" ADD CONSTRAINT "user_private_message_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "user_conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_private_message" ADD CONSTRAINT "user_private_message_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kiriko_profile" ADD CONSTRAINT "kiriko_profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kiriko_user_task" ADD CONSTRAINT "kiriko_user_task_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patch_comment" ADD CONSTRAINT "patch_comment_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "patch_comment"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patch_comment" ADD CONSTRAINT "patch_comment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patch_comment" ADD CONSTRAINT "patch_comment_patch_id_fkey" FOREIGN KEY ("patch_id") REFERENCES "patch"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_patch_comment_like_relation" ADD CONSTRAINT "user_patch_comment_like_relation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_patch_comment_like_relation" ADD CONSTRAINT "user_patch_comment_like_relation_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "patch_comment"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patch_company" ADD CONSTRAINT "patch_company_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patch_company_relation" ADD CONSTRAINT "patch_company_relation_patch_id_fkey" FOREIGN KEY ("patch_id") REFERENCES "patch"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patch_company_relation" ADD CONSTRAINT "patch_company_relation_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "patch_company"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patch_rating" ADD CONSTRAINT "patch_rating_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patch_rating" ADD CONSTRAINT "patch_rating_patch_id_fkey" FOREIGN KEY ("patch_id") REFERENCES "patch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patch_rating_like" ADD CONSTRAINT "patch_rating_like_patch_rating_id_fkey" FOREIGN KEY ("patch_rating_id") REFERENCES "patch_rating"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patch_rating_like" ADD CONSTRAINT "patch_rating_like_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patch_rating_stat" ADD CONSTRAINT "patch_rating_stat_patch_id_fkey" FOREIGN KEY ("patch_id") REFERENCES "patch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "patch_report" ADD CONSTRAINT "patch_report_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patch_report" ADD CONSTRAINT "patch_report_reported_user_id_fkey" FOREIGN KEY ("reported_user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patch_report" ADD CONSTRAINT "patch_report_handler_id_fkey" FOREIGN KEY ("handler_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patch_report" ADD CONSTRAINT "patch_report_patch_id_fkey" FOREIGN KEY ("patch_id") REFERENCES "patch"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patch_report" ADD CONSTRAINT "patch_report_comment_id_fkey" FOREIGN KEY ("comment_id") REFERENCES "patch_comment"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patch_report" ADD CONSTRAINT "patch_report_rating_id_fkey" FOREIGN KEY ("rating_id") REFERENCES "patch_rating"("id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patch_resource" ADD CONSTRAINT "patch_resource_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patch_resource" ADD CONSTRAINT "patch_resource_patch_id_fkey" FOREIGN KEY ("patch_id") REFERENCES "patch"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patch_resource_link" ADD CONSTRAINT "patch_resource_link_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "patch_resource"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_patch_resource_like_relation" ADD CONSTRAINT "user_patch_resource_like_relation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_patch_resource_like_relation" ADD CONSTRAINT "user_patch_resource_like_relation_resource_id_fkey" FOREIGN KEY ("resource_id") REFERENCES "patch_resource"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patch_tag" ADD CONSTRAINT "patch_tag_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patch_tag_relation" ADD CONSTRAINT "patch_tag_relation_patch_id_fkey" FOREIGN KEY ("patch_id") REFERENCES "patch"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patch_tag_relation" ADD CONSTRAINT "patch_tag_relation_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "patch_tag"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patch" ADD CONSTRAINT "patch_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "patch_alias" ADD CONSTRAINT "patch_alias_patch_id_fkey" FOREIGN KEY ("patch_id") REFERENCES "patch"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_follow_relation" ADD CONSTRAINT "user_follow_relation_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_follow_relation" ADD CONSTRAINT "user_follow_relation_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_message" ADD CONSTRAINT "user_message_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_message" ADD CONSTRAINT "user_message_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "user_patch_favorite_folder" ADD CONSTRAINT "user_patch_favorite_folder_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_patch_favorite_folder_relation" ADD CONSTRAINT "user_patch_favorite_folder_relation_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "user_patch_favorite_folder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_patch_favorite_folder_relation" ADD CONSTRAINT "user_patch_favorite_folder_relation_patch_id_fkey" FOREIGN KEY ("patch_id") REFERENCES "patch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_log" ADD CONSTRAINT "conversation_log_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brain_memory" ADD CONSTRAINT "brain_memory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

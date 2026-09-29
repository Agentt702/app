CREATE TABLE IF NOT EXISTS "bookmarks" (
  "device_id" text NOT NULL,
  "prophet_id" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT "bookmarks_device_id_prophet_id_pk" PRIMARY KEY("device_id", "prophet_id")
);

CREATE TABLE IF NOT EXISTS "kids_progress" (
  "device_id" text PRIMARY KEY NOT NULL,
  "current_level" integer DEFAULT 1 NOT NULL,
  "levels" jsonb DEFAULT '{}'::jsonb NOT NULL
);

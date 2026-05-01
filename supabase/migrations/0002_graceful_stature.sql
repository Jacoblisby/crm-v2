CREATE TABLE "scrape_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"status" text DEFAULT 'running' NOT NULL,
	"run_kind" text DEFAULT 'cron' NOT NULL,
	"postnr_codes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"listings_scraped" integer DEFAULT 0 NOT NULL,
	"listings_new" integer DEFAULT 0 NOT NULL,
	"listings_updated" integer DEFAULT 0 NOT NULL,
	"listings_marked_sold" integer DEFAULT 0 NOT NULL,
	"pdfs_fetched" integer DEFAULT 0 NOT NULL,
	"pdfs_failed" integer DEFAULT 0 NOT NULL,
	"afkast_recomputed" integer DEFAULT 0 NOT NULL,
	"log" text,
	"error" text
);
--> statement-breakpoint
ALTER TABLE "on_market_candidates" ADD COLUMN "pdf_fetch_attempts" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "on_market_candidates" ADD COLUMN "pdf_last_error" text;--> statement-breakpoint
ALTER TABLE "on_market_candidates" ADD COLUMN "last_seen_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "on_market_candidates" ADD COLUMN "sold_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "scrape_jobs_started_idx" ON "scrape_jobs" USING btree ("started_at");--> statement-breakpoint
CREATE INDEX "scrape_jobs_status_idx" ON "scrape_jobs" USING btree ("status","started_at");
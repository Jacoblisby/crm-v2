ALTER TABLE "on_market_candidates" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "on_market_candidates" ADD COLUMN "primary_image" text;--> statement-breakpoint
ALTER TABLE "on_market_candidates" ADD COLUMN "images" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "on_market_candidates" ADD COLUMN "m2_pris" integer;--> statement-breakpoint
ALTER TABLE "on_market_candidates" ADD COLUMN "first_seen_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "on_market_candidates" ADD COLUMN "cost_grundvaerdi" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "on_market_candidates" ADD COLUMN "cost_faellesudgifter" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "on_market_candidates" ADD COLUMN "cost_rottebekempelse" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "on_market_candidates" ADD COLUMN "cost_renovation" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "on_market_candidates" ADD COLUMN "cost_forsikringer" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "on_market_candidates" ADD COLUMN "cost_faelleslaan" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "on_market_candidates" ADD COLUMN "cost_grundfond" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "on_market_candidates" ADD COLUMN "cost_vicevaert" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "on_market_candidates" ADD COLUMN "cost_vedligeholdelse" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "on_market_candidates" ADD COLUMN "cost_andre_drift" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "on_market_candidates" ADD COLUMN "refurb_gulv" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "on_market_candidates" ADD COLUMN "refurb_maling" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "on_market_candidates" ADD COLUMN "refurb_rengoring" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "on_market_candidates" ADD COLUMN "refurb_andre" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "on_market_candidates" ADD COLUMN "estimeret_leje_md" integer;--> statement-breakpoint
ALTER TABLE "on_market_candidates" ADD COLUMN "forhandlet_pris" bigint;--> statement-breakpoint
ALTER TABLE "on_market_candidates" ADD COLUMN "afkast_calculated_at" timestamp with time zone;
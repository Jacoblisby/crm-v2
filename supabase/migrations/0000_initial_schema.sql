CREATE TABLE "campaign_recipients" (
	"campaign_id" uuid NOT NULL,
	"property_id" uuid NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "campaign_recipients_campaign_id_property_id_pk" PRIMARY KEY("campaign_id","property_id")
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"kind" text NOT NULL,
	"sent_at" timestamp with time zone,
	"recipients_count" integer,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor" text,
	"type" text NOT NULL,
	"lead_id" uuid,
	"property_id" uuid,
	"payload" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "housing_associations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"street_name" text,
	"postal_code" text,
	"city" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lead_communications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"type" text NOT NULL,
	"direction" text NOT NULL,
	"subject" text,
	"body" text,
	"resend_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text
);
--> statement-breakpoint
CREATE TABLE "lead_stage_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lead_id" uuid NOT NULL,
	"from_stage" text,
	"to_stage" text NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"changed_by" text
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text,
	"email" text,
	"phone" text,
	"property_id" uuid,
	"address" text,
	"postal_code" text,
	"city" text,
	"property_type" text,
	"kvm" integer,
	"rooms" numeric(3, 1),
	"year_built" integer,
	"list_price" bigint,
	"stage_slug" text DEFAULT 'ny-lead' NOT NULL,
	"stage_changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"condition_rating" integer,
	"valuation_dkk" bigint,
	"bid_dkk" bigint,
	"bid_status" text,
	"priority" integer DEFAULT 0 NOT NULL,
	"source" text,
	"assigned_to" text,
	"notes" text,
	"campaign_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "lease_agreements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"portfolio_property_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"monthly_rent_dkk" integer NOT NULL,
	"deposit_dkk" integer,
	"prepaid_rent_dkk" integer,
	"start_date" timestamp with time zone NOT NULL,
	"end_date" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "on_market_candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scraped_at" timestamp with time zone DEFAULT now() NOT NULL,
	"source" text DEFAULT 'boligsiden' NOT NULL,
	"source_id" text NOT NULL,
	"source_url" text NOT NULL,
	"case_url" text,
	"realtor_name" text,
	"broker_kind" text,
	"property_id" uuid,
	"address" text NOT NULL,
	"postal_code" text NOT NULL,
	"city" text NOT NULL,
	"kvm" integer NOT NULL,
	"rooms" numeric(3, 1),
	"year_built" integer,
	"list_price" bigint NOT NULL,
	"monthly_expense" integer,
	"avm_value" bigint,
	"avm_calculated_at" timestamp with time zone,
	"bid_dkk" bigint,
	"margin_pct" numeric(5, 2),
	"pdf_filename" text,
	"pdf_status" text DEFAULT 'pending' NOT NULL,
	"pdf_downloaded_at" timestamp with time zone,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pipeline_stages" (
	"slug" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"sla_days" integer,
	"is_terminal" boolean DEFAULT false NOT NULL,
	"is_bid_ready" boolean DEFAULT false NOT NULL,
	"sort_order" integer NOT NULL,
	"color" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio_companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"cvr" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "portfolio_properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"property_id" uuid,
	"address" text NOT NULL,
	"postal_code" text NOT NULL,
	"city" text NOT NULL,
	"kommune" text,
	"property_type" text DEFAULT 'Ejerlejlighed' NOT NULL,
	"kvm" integer,
	"rooms" numeric(3, 1),
	"year_built" integer,
	"energy_class" text,
	"purchase_price" bigint,
	"purchase_date" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bfe_number" text,
	"address" text NOT NULL,
	"postal_code" text NOT NULL,
	"city" text NOT NULL,
	"association_id" uuid,
	"property_type" text DEFAULT 'Ejerlejlighed' NOT NULL,
	"kvm" integer,
	"rooms" numeric(3, 1),
	"year_built" integer,
	"energy_class" text,
	"owner_name" text,
	"owner_kind" text,
	"owner_address" text,
	"lives_in_property" boolean,
	"last_sale_price" bigint,
	"last_sale_date" timestamp with time zone,
	"grundskyld_kr" integer,
	"last_letter_sent_at" timestamp with time zone,
	"contacted_at" timestamp with time zone,
	"imported_from_xlsx_at" timestamp with time zone,
	"import_source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"email" text,
	"phone" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "campaign_recipients" ADD CONSTRAINT "campaign_recipients_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaign_recipients" ADD CONSTRAINT "campaign_recipients_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_communications" ADD CONSTRAINT "lead_communications_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_stage_history" ADD CONSTRAINT "lead_stage_history_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_stage_history" ADD CONSTRAINT "lead_stage_history_from_stage_pipeline_stages_slug_fk" FOREIGN KEY ("from_stage") REFERENCES "public"."pipeline_stages"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lead_stage_history" ADD CONSTRAINT "lead_stage_history_to_stage_pipeline_stages_slug_fk" FOREIGN KEY ("to_stage") REFERENCES "public"."pipeline_stages"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_stage_slug_pipeline_stages_slug_fk" FOREIGN KEY ("stage_slug") REFERENCES "public"."pipeline_stages"("slug") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lease_agreements" ADD CONSTRAINT "lease_agreements_portfolio_property_id_portfolio_properties_id_fk" FOREIGN KEY ("portfolio_property_id") REFERENCES "public"."portfolio_properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lease_agreements" ADD CONSTRAINT "lease_agreements_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "on_market_candidates" ADD CONSTRAINT "on_market_candidates_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_properties" ADD CONSTRAINT "portfolio_properties_company_id_portfolio_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."portfolio_companies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "portfolio_properties" ADD CONSTRAINT "portfolio_properties_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_association_id_housing_associations_id_fk" FOREIGN KEY ("association_id") REFERENCES "public"."housing_associations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "events_occurred_at_idx" ON "events" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "events_lead_idx" ON "events" USING btree ("lead_id","occurred_at");--> statement-breakpoint
CREATE INDEX "events_type_idx" ON "events" USING btree ("type","occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "housing_associations_name_idx" ON "housing_associations" USING btree ("name");--> statement-breakpoint
CREATE INDEX "lead_communications_lead_idx" ON "lead_communications" USING btree ("lead_id","created_at");--> statement-breakpoint
CREATE INDEX "lead_communications_resend_idx" ON "lead_communications" USING btree ("resend_id");--> statement-breakpoint
CREATE INDEX "lead_stage_history_lead_idx" ON "lead_stage_history" USING btree ("lead_id","changed_at");--> statement-breakpoint
CREATE INDEX "leads_stage_idx" ON "leads" USING btree ("stage_slug");--> statement-breakpoint
CREATE INDEX "leads_stage_changed_at_idx" ON "leads" USING btree ("stage_changed_at");--> statement-breakpoint
CREATE INDEX "leads_property_idx" ON "leads" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "leads_email_idx" ON "leads" USING btree ("email");--> statement-breakpoint
CREATE INDEX "leads_campaign_idx" ON "leads" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "lease_agreements_property_idx" ON "lease_agreements" USING btree ("portfolio_property_id");--> statement-breakpoint
CREATE INDEX "lease_agreements_tenant_idx" ON "lease_agreements" USING btree ("tenant_id");--> statement-breakpoint
CREATE UNIQUE INDEX "on_market_source_id_idx" ON "on_market_candidates" USING btree ("source","source_id");--> statement-breakpoint
CREATE INDEX "on_market_postal_code_idx" ON "on_market_candidates" USING btree ("postal_code","status");--> statement-breakpoint
CREATE INDEX "on_market_status_idx" ON "on_market_candidates" USING btree ("status","scraped_at");--> statement-breakpoint
CREATE INDEX "on_market_property_idx" ON "on_market_candidates" USING btree ("property_id");--> statement-breakpoint
CREATE INDEX "pipeline_stages_sort_idx" ON "pipeline_stages" USING btree ("sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "portfolio_companies_name_idx" ON "portfolio_companies" USING btree ("name");--> statement-breakpoint
CREATE INDEX "portfolio_properties_company_idx" ON "portfolio_properties" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "portfolio_properties_kommune_idx" ON "portfolio_properties" USING btree ("kommune");--> statement-breakpoint
CREATE UNIQUE INDEX "properties_bfe_idx" ON "properties" USING btree ("bfe_number");--> statement-breakpoint
CREATE INDEX "properties_association_idx" ON "properties" USING btree ("association_id");--> statement-breakpoint
CREATE INDEX "properties_postal_code_idx" ON "properties" USING btree ("postal_code");--> statement-breakpoint
CREATE INDEX "properties_owner_kind_idx" ON "properties" USING btree ("owner_kind");--> statement-breakpoint
CREATE INDEX "tenants_email_idx" ON "tenants" USING btree ("email");
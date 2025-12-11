CREATE TABLE IF NOT EXISTS "Chat" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp NOT NULL,
	"messages" json NOT NULL,
	"userId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Reservation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"createdAt" timestamp NOT NULL,
	"details" json NOT NULL,
	"hasCompletedPayment" boolean DEFAULT false NOT NULL,
	"userId" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "User" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(64) NOT NULL,
	"password" varchar(64)
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Chat" ADD CONSTRAINT "Chat_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Reservation" ADD CONSTRAINT "Reservation_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;


-- flight module
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "Flights" (
	"fa_flight_id" uuid PRIMARY KEY NOT NULL,
	"scheduled_out" timestamp NOT NULL,
	"origin_iata" text,
	"destination_iata" text,
	"userId" uuid NOT NULL
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "FlightTrack" (
	"fa_flight_id" uuid PRIMARY KEY NOT NULL,
	"actual_distance" integer,
	"positions" jsonb
);

--> statement-breakpoint
create table IF NOT EXISTS "Airport" (
	iata text PRIMARY KEY NOT NULL,
	name text null,
	longitude double precision null,
	latitude double precision null,
	timezone text null,
	country_code text null
);

CREATE TABLE IF NOT EXISTS "FlightTrack" (
	fa_flight_id text PRIMARY KEY NOT NULL,
	actual_distance integer null,
	positions jsonb null
);


CREATE TABLE IF NOT EXISTS "Flights" (
	fa_flight_id text null,
	scheduled_out date not null,
	origin_iata character text null,
	destination_iata character text null,
	"userId" uuid not null,
	ident text not null,
	constraint Flights_pkey primary key unique (scheduled_out, ident),
	constraint Flights_userId_fkey foreign KEY ("userId") references "User" (id)
);


CREATE TABLE IF NOT EXISTS "TrainStation" (
	crs text PRIMARY KEY NOT NULL,
	name text null,
	classification text null,
	latitude double precision null,
	longitude double precision null,
	operator text null,
	postcode text null
);

CREATE TABLE IF NOT EXISTS "Trains" (
	service_uid text null,
	run_date date not null,
	origin text not null REFERENCES "TrainStation"(crs),
	origin_time text not null,
	destination text not null REFERENCES "TrainStation"(crs),
	destination_time text null,
	locations jsonb null,
	atoc_code text null,
	transport_mode text null,
	constraint Trains_pkey primary key (run_date, origin, origin_time),
);
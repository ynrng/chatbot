import { Message } from "ai";
import { InferSelectModel } from "drizzle-orm";
import {
  pgTable,
  varchar,
  timestamp,
  json,
  uuid,
  boolean,
  integer,
  text,
  jsonb,
  doublePrecision,
  date
} from "drizzle-orm/pg-core";

export const user = pgTable("User", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  email: varchar("email", { length: 64 }).notNull(),
  password: varchar("password", { length: 64 }),
});

export type User = InferSelectModel<typeof user>;

export const chat = pgTable("Chat", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  createdAt: timestamp("createdAt").notNull(),
  messages: json("messages").notNull(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
});

export type Chat = Omit<InferSelectModel<typeof chat>, "messages"> & {
  messages: Array<Message>;
};

export const reservation = pgTable("Reservation", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  createdAt: timestamp("createdAt").notNull(),
  details: json("details").notNull(),
  hasCompletedPayment: boolean("hasCompletedPayment").notNull().default(false),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
});

export type Reservation = InferSelectModel<typeof reservation>;


// export const movies = pgTable("Movies", {
//   imdbId: varchar("imdbId").primaryKey().notNull(),
//   createdAt: timestamp("createdAt").notNull(),
//   eventAt: timestamp("eventAt"),
//   eventSent: boolean("eventsent").default(false),
//   user: varchar("user", { length: 64 }).notNull(),
// });

// export type Movies = InferSelectModel<typeof movies>;


// export const movie_votes = pgTable("MovieVotes", {
//   imdbId: varchar("imdbId").primaryKey().notNull(),
//   user: integer("user").notNull().default(0),
// });

// export type MovieVotes = InferSelectModel<typeof movie_votes>;


// https://www.flightaware.com/aeroapi/portal/documentation#get-/airports/-id-
export const airport = pgTable("Airport", {
  iata: text("iata").primaryKey().notNull(),
  name: text("name"),
  longitude: doublePrecision("longitude"),
  latitude: doublePrecision("latitude"),
  timezone: text("timezone"),
  country_code: text("country_code"),
});

export type Airport = InferSelectModel<typeof airport>;


// https://www.flightaware.com/aeroapi/portal/documentation#get-/flights/-id-/track
export const flightTrack = pgTable("FlightTrack", {
  fa_flight_id: text("fa_flight_id").primaryKey().notNull(), //.references(() => flights.fa_flight_id),
  actual_distance: integer("actual_distance"),
  positions: jsonb("positions"),
});

export type FlightTrack = InferSelectModel<typeof flightTrack>;



// https://www.flightaware.com/aeroapi/portal/documentation#get-/flights/-ident-
export const flights = pgTable("Flights", {
  fa_flight_id: text("fa_flight_id"),
  scheduled_out: date("scheduled_out").notNull(),
  origin_iata: text("origin_iata"),
  destination_iata: text("destination_iata"),
  ident: text("ident").notNull(),
  userId: uuid("userId")
    .notNull()
    .references(() => user.id),
});

export type Flights = InferSelectModel<typeof flights>;

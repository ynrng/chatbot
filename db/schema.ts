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


export const movies = pgTable("Movies", {
  imdbId: varchar("imdbId").primaryKey().notNull(),
  createdAt: timestamp("createdAt").notNull(),
  eventAt: timestamp("eventAt"),
  eventSent: boolean("eventsent").default(false),
  user: varchar("user", { length: 64 }).notNull(),
});

export type Movies = InferSelectModel<typeof movies>;


export const movie_votes = pgTable("MovieVotes", {
  imdbId: varchar("imdbId").primaryKey().notNull(),
  user: integer("user").notNull().default(0),
});

export type MovieVotes = InferSelectModel<typeof movie_votes>;
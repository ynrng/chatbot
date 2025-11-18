import "server-only";

import { genSaltSync, hashSync } from "bcrypt-ts";
import { and, desc, eq, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import {
  user, chat, User, reservation,
  flightTrack, FlightTrack, flights, Flights, airport, Airport,
  TrainStation, trainStation, trains, Trains, trainLegs, TrainLegs,
} from "./schema";

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle
let client = postgres(`${process.env.POSTGRES_URL!}?sslmode=require`);
let db = drizzle(client);


export async function createTrainLegs(ts: TrainLegs) {
  try {
    return await db.insert(trainLegs).values(ts);
  } catch (error) {
    console.error("Failed to create trainLegs in database");
    throw error;
  }
}

export async function getTrainLegs( ): Promise<Array<TrainLegs>> {
  try {
    return await db.select().from(trainLegs)
  } catch (error) {
    console.error("Failed to get trainLegs from database");
    throw error;
  }
}


export async function deleteTrain(ts: any) {
  try {
    return await db.delete(trains).where(
      and(
        eq(trains.origin, ts.origin),
        eq(trains.runDate, ts.runDate),
        eq(trains.destination, ts.destination),
        eq(trains.originTime, ts.originTime)
      ));
  } catch (error) {
    console.error("Failed to delete trains in database");
    throw error;
  }
}

export async function updateTrain(ts: any) {
  try {
    for (let key in ts) {
      if (ts[key] === undefined || ts[key] === null) {
        delete ts[key];
      }
    }
    return await db.update(trains).set(ts).where(
      and(
        eq(trains.origin, ts.origin),
        eq(trains.runDate, ts.runDate),
        eq(trains.destination, ts.destination),
        ts.originTime == '0000' ? undefined : eq(trains.originTime, ts.originTime)
      ));
  } catch (error) {
    console.error("Failed to update trains in database");
    throw error;
  }
}

export async function createTrain(ts: Trains) {
  try {
    return await db.insert(trains).values(ts);
  } catch (error) {
    console.error("Failed to create trains in database");
    throw error;
  }
}

export async function getTrains(): Promise<Array<Trains>> {
  try {
    return await db.select().from(trains);
  } catch (error) {
    console.error("Failed to get trains from database");
    throw error;
  }
}

export async function createTrainStations(tss: Array<TrainStation>) {
  try {
    return await db.insert(trainStation).values(tss);
  } catch (error) {
    console.error("Failed to create train station in database");
    throw error;
  }
}

export async function getTrainStations(ids: Array<string> | undefined): Promise<Array<TrainStation>> {
  try {
    if (ids?.length) {
      return await db.select().from(trainStation).where(inArray(trainStation.crs, ids));
    } else {
      return await db.select().from(trainStation)
    }
  } catch (error) {
    console.error("Failed to get train stations from database");
    throw error;
  }
}

export async function createAirport(ap: Airport) {
  try {
    return await db.insert(airport).values(ap);
  } catch (error) {
    console.error("Failed to create airport in database");
    throw error;
  }
}

export async function getAirports(ids: string[]): Promise<Array<Airport>> {
  try {
    if (!ids || ids.length === 0) return [];
    return await db.select().from(airport).where(inArray(airport.iata, ids));
  } catch (error) {
    console.error("Failed to get airport from database");
    throw error;
  }
}

export async function createFlightTrack(track: FlightTrack) {
  try {
    return await db.insert(flightTrack).values(track);
  } catch (error) {
    console.error("Failed to create track in database");
    throw error;
  }
}


export async function getFlightTrack(id: string): Promise<FlightTrack> {
  try {
    return await db.select().from(flightTrack).where(eq(flightTrack.fa_flight_id, id)).limit(1).then(res => res[0]);
  } catch (error) {
    console.error("Failed to get flightTrack from database", id);
    throw error;
  }
}
export async function getflights(): Promise<Array<Flights>> {
  try {
    return await db.select().from(flights);
  } catch (error) {
    console.error("Failed to get flights from database");
    throw error;
  }
}

export async function createFlight(flight: Flights) {
  try {
    return await db.insert(flights).values(flight);
  } catch (error) {
    console.error("Failed to create flight in database");
    throw error;
  }
}

// export async function deleteFlight(id: string) {
//   try {
//     return await db.delete(flights).where(eq(flights.fa_flight_id, id));
//   } catch (error) {
//     console.error("Failed to delete flight track from database");
//     throw error;
//   }
// }

export async function getUser(email: string): Promise<Array<User>> {
  try {
    return await db.select().from(user).where(eq(user.email, email));
  } catch (error) {
    console.error("Failed to get user from database");
    throw error;
  }
}

export async function createUser(email: string, password: string) {
  let salt = genSaltSync(10);
  let hash = hashSync(password, salt);

  try {
    return await db.insert(user).values({ email, password: hash });
  } catch (error) {
    console.error("Failed to create user in database");
    throw error;
  }
}

export async function saveChat({
  id,
  messages,
  userId,
}: {
  id: string;
  messages: any;
  userId: string;
}) {
  try {
    const selectedChats = await db.select().from(chat).where(eq(chat.id, id));

    if (selectedChats.length > 0) {
      return await db
        .update(chat)
        .set({
          messages: JSON.stringify(messages),
        })
        .where(eq(chat.id, id));
    }

    return await db.insert(chat).values({
      id,
      createdAt: new Date(),
      messages: JSON.stringify(messages),
      userId,
    });
  } catch (error) {
    console.error("Failed to save chat in database");
    throw error;
  }
}

export async function deleteChatById({ id }: { id: string }) {
  try {
    return await db.delete(chat).where(eq(chat.id, id));
  } catch (error) {
    console.error("Failed to delete chat by id from database");
    throw error;
  }
}

export async function getChatsByUserId({ id }: { id: string }) {
  try {
    return await db
      .select()
      .from(chat)
      .where(eq(chat.userId, id))
      .orderBy(desc(chat.createdAt));
  } catch (error) {
    console.error("Failed to get chats by user from database");
    throw error;
  }
}

export async function getChatById({ id }: { id: string }) {
  try {
    const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
    return selectedChat;
  } catch (error) {
    console.error("Failed to get chat by id from database");
    throw error;
  }
}

export async function createReservation({
  id,
  userId,
  details,
}: {
  id: string;
  userId: string;
  details: any;
}) {
  return await db.insert(reservation).values({
    id,
    createdAt: new Date(),
    userId,
    hasCompletedPayment: false,
    details: JSON.stringify(details),
  });
}

export async function getReservationById({ id }: { id: string }) {
  const [selectedReservation] = await db
    .select()
    .from(reservation)
    .where(eq(reservation.id, id));

  return selectedReservation;
}

export async function updateReservation({
  id,
  hasCompletedPayment,
}: {
  id: string;
  hasCompletedPayment: boolean;
}) {
  return await db
    .update(reservation)
    .set({
      hasCompletedPayment,
    })
    .where(eq(reservation.id, id));
}

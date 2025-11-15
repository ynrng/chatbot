// import { auth } from "@/app/(auth)/auth";
import { getAirports, getflights, getFlightTrack, createAirport } from "@/db/queries";

import fs from "fs/promises";
import path from "path";
import { parse } from "csv-parse/sync";

import { auth } from "@/app/(auth)/auth";
import {  fetcherInternal } from "@/lib/utils";

// import { Flights } from "@/db/schema";

// type Flight = Flights & {
//   from: any;
//   to: any;
// };

async function withoutTrack(request: Request, r: any) {

  const session = await auth();
  const res2 = await fetcherInternal("/api/flight", request, {
    method: "POST",
    body: JSON.stringify({
      scheduled_out: r.date,
      origin: { code_iata: r.departure_iata },
      destination: { code_iata: r.arrival_iata },
      ident: r.flight_number,
      userId: session?.user?.id || '',
    }),
  });

  return res2;
}

export async function POST(request: Request) {

  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  let records = [];
  try {
    const resp = await fetcherInternal('/csv/flight_history.csv', request);
    const csv = await resp.text();
    // parse to array of objects using header row as keys
    records = parse(csv, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as Array<Record<string, string>>;


    for (const r of records) {
      let today = new Date()
      let flightDate = new Date(r.date)
      if (flightDate.valueOf() > today.valueOf() || today.valueOf() - flightDate.valueOf() > 10 * 24 * 60 * 60 * 1000) {
        withoutTrack(request, r,);
      } else {
        const res_f = await fetcherInternal(`/api/flight?id=${r.flight_number}&date=${r.date}`, request);
        const json_f = await res_f.json()
        if (json_f && json_f.flights && json_f.flights.length > 0) {
          json_f.flights.forEach(async (f: any) => {
            if (f.origin.code_iata === r.departure_iata && f.destination.code_iata === r.arrival_iata && f.scheduled_out.startsWith(r.date)) {
              const res = await fetcherInternal(`/api/flight`, request, {
                method: "POST",
                body: JSON.stringify(f),
              });
            }
          });
        } else {
          withoutTrack(request, r,);
        }
      }
    }

  } catch (err) {
    console.error("Failed to read/parse CSV", err);
    return new Response("Failed to read CSV", { status: 500 });
  }

  // optionally transform fields/types here
  return Response.json({});
}

// import { auth } from "@/app/(auth)/auth";
import { getAirports, getflights, getFlightTrack, createAirport } from "@/db/queries";

import fs from "fs/promises";
import path from "path";
import { parse } from "csv-parse/sync";

import { auth } from "@/app/(auth)/auth";
import { fetcherFlight } from "@/lib/utils";
import { Flights, Airport, FlightTrack } from "@/db/schema";

// import { Flights } from "@/db/schema";

// type Flight = Flights & {
//   from: any;
//   to: any;
// };

export async function GET(request: Request) {

  const flights = await getflights();
  // retrieve flight track if possible


  for (const r of flights) {
    console.log('rrrrrr', r);


    let today = new Date()
    let flightDate = new Date(r.scheduled_out)
    let diff = today.valueOf() - flightDate.valueOf()

    if (diff > 0 && today.valueOf() - flightDate.valueOf() < 10 * 24 * 60 * 60 * 1000) {

      if (r.fa_flight_id) {
        const res_track = await getFlightTrack(r.fa_flight_id);
        let positions = res_track?.positions || null;
        if (positions && JSON.parse(positions as string).length > 0) {
          continue;
        }
      }

      const res_f = await fetcherInternal(`/api/flight?id=${r.fa_flight_id}`, request);

      const json_f = await res_f.json()
      console.log('flightsssssss:', json_f);
      if (json_f?.flights?.length > 0) {

        for (let f of json_f.flights) {
          console.log('fffffff fa_flight_id:');
          if (f.origin.code_iata === r.origin_iata && f.destination.code_iata === r.destination_iata && f.scheduled_out.startsWith(r.scheduled_out)) {
            console.log('mmmmmmmmmmmmmatch fa_flight_id:', f);
            const res = await fetcherInternal(`/api/flight`, request, {
              method: "POST",
              body: JSON.stringify(f),
            });
            break;
          }
        }

      }
    }
  }

  // retrieve airports information
  const iatas = flights.map((f) => [f.origin_iata, f.destination_iata]);
  const iataSet = Array.from(new Set(iatas.flat().filter(i => i != null)));


  const airports = await getAirports(iataSet)
  const airportMap: { [key: string]: any } = {};
  airports.forEach((a) => {
    airportMap[a.iata] = a;
  })
  const iatas_existing = Object.keys(airportMap);

  await Promise.all(
    iataSet.map(async (i) => {
      if (iatas_existing.indexOf(i) < 0) {
        const res2 = await fetcherFlight(`https://aeroapi.flightaware.com/aeroapi/airports/${i}`);

        console.log('res2:', res2);
        let ap: Airport | null = null;
        if (res2?.code_iata == i) {
          ap = {
            iata: res2.code_iata,
            name: res2.name,
            longitude: res2.longitude,
            latitude: res2.latitude,
            timezone: res2.timezone,
            country_code: res2.country_code,
          };

        } else if (res2?.alternatives?.length) {
          for (let a of res2.alternatives) {
            if (a?.code_iata == i) {
              ap = {
                iata: a.code_iata,
                name: a.name,
                longitude: a.longitude,
                latitude: a.latitude,
                timezone: a.timezone,
                country_code: a.country_code,
              };
              break;
            }
          }
        }
        if (ap) {
          iatas_existing.push(ap.iata);
          airportMap[ap.iata] = ap;
          await createAirport(ap);
        }
      }
    })
  );

  const iata_couple = iatas.map(v => v.join('-'));
  let route_counts: { [key: string]: number } = {};
  for (let ic of iata_couple) {
    route_counts[ic] = (route_counts[ic] || 0) + 1;
  }

  const res = await Promise.all(flights.map(async (f) => {
    let positions = null;
    if (f.fa_flight_id) {
      const res_track = await getFlightTrack(f.fa_flight_id);
      positions = res_track?.positions || null;
    }

    route_counts[`${f.origin_iata}-${f.destination_iata}`] -= 1;

    return {
      ...f,
      from_airport: airportMap[f.origin_iata || ""],
      to_airport: airportMap[f.destination_iata || ""],
      route_count: route_counts[`${f.origin_iata}-${f.destination_iata}`] || 0,
      positions: positions
    };
  }));

  return Response.json(res);
}

function fetcherInternal(url: string, request: Request, option?: any) {

  const internalUrl = new URL(url, request.url).toString();
  console.log('fetcherInternal url:', internalUrl);

  return fetch(internalUrl, {
    method: "GET",
    headers: {
      "content-type": "application/json",
      // forward client cookies / auth headers when needed
      "cookie": request.headers.get("cookie") ?? "",
      "authorization": request.headers.get("authorization") ?? "",
    },
    ...option,
  });
}

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
    // const filePath = path.join(process.cwd(), "db", "data", "flight_history.csv");
    const body = await request.json();

    const resp = await fetch(body.path);
    if (!resp.ok) {
      return new Response(`Failed to fetch CSV from url: ${resp.status} ${resp.statusText}`, {
        status: 502,
      });
    }

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

// import { auth } from "@/app/(auth)/auth";
import { getAirports, getflights, getFlightTrack, createAirport } from "@/db/queries";

import fs from "fs/promises";
import path from "path";
import { parse } from "csv-parse/sync";

import { auth } from "@/app/(auth)/auth";
import { fetcherInternal } from "@/lib/utils";
import { Flights, Airport, FlightTrack } from "@/db/schema";
import { fetcherFlight } from "@/app/(travel)/api/flight/utils";

// import { Flights } from "@/db/schema";

// type Flight = Flights & {
//   from: any;
//   to: any;
// };

export async function GET(request: Request) {

  const flights = await getflights();
  // retrieve flight track if possible


  // for (const r of flights) {
  //   let today = new Date()
  //   let flightDate = r.scheduled_out
  //   let diff = today.valueOf() - flightDate.valueOf()

  //   if (diff > 0 && today.valueOf() - flightDate.valueOf() < 10 * 24 * 60 * 60 * 1000) {

  //     if (r.fa_flight_id) {
  //       const res_track = await getFlightTrack(r.fa_flight_id);
  //       let positions = Array.isArray(res_track?.positions) ? res_track.positions : [];
  //       if (positions.length > 0) {
  //         continue;
  //       }
  //     }


  //     const json_f = await res_f.json()
  //     if (json_f?.flights?.length > 0) {

  //       for (let f of json_f.flights) {
  //         if (f.origin.code_iata === r.origin_iata && f.destination.code_iata === r.destination_iata && f.scheduled_out.startsWith(r.scheduled_out.toISOString().split('T')[0])) {
  //             method: "POST",
  //             body: JSON.stringify(f),
  //           });
  //           break;
  //         }
  //       }

  //     }
  //   }
  // }

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
        const res2 = await fetcherFlight(`/airports/${i}`);
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

    airportMap[f.origin_iata || ""].count = (airportMap[f.origin_iata || ""].count || 0) + 1;
    airportMap[f.destination_iata || ""].count = (airportMap[f.destination_iata || ""].count || 0) + 1;

    return {
      ...f,
      from_airport: airportMap[f.origin_iata || ""],
      to_airport: airportMap[f.destination_iata || ""],
      route_count: route_counts[`${f.origin_iata}-${f.destination_iata}`] || 0,
      positions: positions
    };
  }));



  return Response.json({ flights: res, airports: Object.values(airportMap) });
}

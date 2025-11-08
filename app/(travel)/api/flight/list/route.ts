// import { auth } from "@/app/(auth)/auth";
import { getAirports, getflights, getFlightTrack } from "@/db/queries";

// import { Flights } from "@/db/schema";

// type Flight = Flights & {
//   from: any;
//   to: any;
// };

export async function GET() {
  // const session = await auth();

  // if (!session || !session.user) {
  //   return Response.json("Unauthorized!", { status: 401 });
  // }

  const flights = await getflights();
  const iatas = flights.map((f) => [f.origin_iata, f.destination_iata]);
  const iataSet = new Set(iatas.flat().filter(i => i !== null));

  const airports = await getAirports(Array.from(iataSet))
  const airportMap: { [key: string]: any } = {};
  airports.forEach((a) => {
    airportMap[a.iata] = a;
  })





  // const new_iatas = iataSet.difference(new Set(Object.keys(airportMap)));

  const res = await Promise.all(flights.map(async (f) => {
    let positions = null;
    if (f.fa_flight_id) {
      const res_track = await getFlightTrack(f.fa_flight_id);
      positions = res_track?.positions || null;
    }

    return {
      ...f,
      from_airport: airportMap[f.origin_iata || ""],
      to_airport: airportMap[f.destination_iata || ""],
      positions: positions
    };
  }));

  return Response.json(res);
}

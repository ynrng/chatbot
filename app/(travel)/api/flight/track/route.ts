
import { auth } from "@/app/(auth)/auth";
import {
  createFlightTrack,
  updateFlight,
} from "@/db/queries";


import { fetcherFlight } from "@/app/(travel)/api/flight/utils";
import { fetcherInternal } from "@/lib/utils";

// import data from './fake.flight.track.json';

export async function POST(request: Request) {


  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (request.body === null) {
    return new Response("Request body is empty", { status: 400 });
  }

  let r: any;
  try {
    r = await request.json();
  } catch (error) {
    return new Response("Invalid JSON in request body", { status: 400 });
  }


  let today = new Date()
  let flightDate = new Date(r.scheduled_out)
  let diff = today.valueOf() - flightDate.valueOf()

  if (diff > 0 && diff < 10 * 24 * 60 * 60 * 1000) {

    const res_f = await fetcherInternal(`/api/flight?id=${r.ident}`, request);

    const json_f = await res_f.json()
    if (json_f?.flights?.length > 0) {

      for (let f of json_f.flights) {
        if (f.origin.code_iata === r.origin_iata && f.destination.code_iata === r.destination_iata && f.scheduled_out.startsWith(new Date(r.scheduled_out).toISOString().split('T')[0])) {
          r = { ...r, ...f };
          break;
        }
      }

    }


    if (r.fa_flight_id) {

      await updateFlight({ "fa_flight_id": r.fa_flight_id }, r);
      const res1 = await fetcherFlight(`/flights/${r.fa_flight_id}/track`);
      if (res1?.positions?.length) {

        await createFlightTrack({
          fa_flight_id: r.fa_flight_id,
          actual_distance: res1.actual_distance,
          positions: res1.positions,
        });
        return Response.json(res1);
      }

    }
  }


  return new Response("Empty Track", { status: 200 });

}

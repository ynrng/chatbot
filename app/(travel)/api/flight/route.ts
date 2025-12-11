
import { auth } from "@/app/(auth)/auth";
import {
  deleteChatById,
  getChatById,
  createFlight,
  getAirports,
  createAirport,
  createFlightTrack,
} from "@/db/queries";
import { Flights, Airport, FlightTrack } from "@/db/schema";


import { fetcherFlight } from "@/app/(travel)/api/flight/utils";


export async function GET(request: Request) {

  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id || id =='null') {
    return new Response("No Id Read from data", { status: 404 });
  }
  const date = searchParams.get("date");
  let q = '';
  const start = date?.split("T")[0] || "";
  if (start) {
    q += `&start=${start}`;
    const end = start ? `${start}T23%3A59%3A59Z` : ''
    if (end) {
      q += `&end=${end}`;
    }
  }

  const res = await fetcherFlight(
    `/flights/${id}?ident_type=fa_flight_id${q}`
  );

  return Response.json(res)
}



export async function POST(request: Request) {


  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (request.body === null) {
    return new Response("Request body is empty", { status: 400 });
  }

  let body: any;
  try {
    body = await request.json();
  } catch (error) {
    return new Response("Invalid JSON in request body", { status: 400 });
  }



  let f: Flights = {
    fa_flight_id: body.fa_flight_id || null,
    scheduled_out: new Date(body.scheduled_out),
    origin_iata: body.origin?.code_iata,
    destination_iata: body.destination?.code_iata,
    ident: body.ident,
    userId: session?.user?.id || '',
  };

  try {
    await createFlight(f);
  } catch (error) {
    console.error("Failed to save flight");
    return new Response("Failed to save flight", { status: 500 });
  }

  if (f.fa_flight_id) {

    const res1 = await fetcherFlight(`/flights/${f.fa_flight_id}/track`);
    if (res1?.positions?.length) {

      await createFlightTrack({
        fa_flight_id: f.fa_flight_id,
        actual_distance: res1.actual_distance,
        positions: res1.positions,
      });
    }

  }


  const iatas = [f.origin_iata || "", f.destination_iata || ""].filter(i => i !== "");
  const airports = await getAirports(iatas)
  const iatas_existing = airports.map(a => a.iata)

  console.log("Fetching new iatas for airports:", iatas, iatas_existing,);
  await Promise.all(
    iatas.map(async (i) => {
      if (iatas_existing.indexOf(i) === -1) {
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
          for (let index = 0; index < res2.alternatives.length; index++) {
            let a = res2.alternatives[index];
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
          await createAirport(ap);
        }

      }
    })
  );




  return Response.json({});
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new Response("Not Found", { status: 404 });
  }

  const session = await auth();

  if (!session || !session.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const chat = await getChatById({ id });

    if (chat.userId !== session.user.id) {
      return new Response("Unauthorized", { status: 401 });
    }

    await deleteChatById({ id });

    return new Response("Chat deleted", { status: 200 });
  } catch (error) {
    return new Response("An error occurred while processing your request", {
      status: 500,
    });
  }
}

import { convertToCoreMessages, Message, streamText } from "ai";
import { z } from "zod";

import { geminiProModel } from "@/ai";
import {
  generateReservationPrice,
  generateSampleFlightSearchResults,
  generateSampleFlightStatus,
  generateSampleSeatSelection,
} from "@/ai/actions";
import { auth } from "@/app/(auth)/auth";
import {
  createReservation,
  deleteChatById,
  getChatById,
  getReservationById,
  saveChat,
  createFlight,
  getAirports,
  createAirport,
  createFlightTrack,

} from "@/db/queries";
import { Flights, Airport, FlightTrack } from "@/db/schema";


import { fetcherFlight } from "@/lib/utils";
import data_get from './fake.get.json';



export async function GET(request: Request) {



  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }


  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const date = searchParams.get("date");
  const start = date?.split("T")[0] || "";

  // const res = await fetcherFlight(
  //   `https://aeroapi.flightaware.com/aeroapi/flights/${id}?ident_type=fa_flight_id&start=${date}&end=${date}T23%3A59%3A59Z`
  // );
  const res = Response.json(data_get.flights);



  return res;
}



export async function POST(request: Request) {



  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  if (request.body === null) {
    return new Response("Request body is empty", { status: 400 });
  }


  // try {
  const body = await request.json();


  // const res = Response.json(data_get.flights);


  let f: Flights = {
    fa_flight_id: body.fa_flight_id || '',
    scheduled_out: body.scheduled_out,
    origin_iata: body.origin.code_iata,
    destination_iata: body.destination.code_iata,
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

    const res1 = await fetcherFlight(`https://aeroapi.flightaware.com/aeroapi/flights/${f.fa_flight_id}/track`);
    if (res1 && res1.positions) {
      console.log("11111111111:", res1);

      await createFlightTrack({
        fa_flight_id: f.fa_flight_id,
        actual_distance: res1.actual_distance,
        positions: JSON.stringify(res1.positions),
      });
    }

  }


  const iatas = [f.origin_iata || "", f.destination_iata || ""].filter(i => i !== "");
  const airports = await getAirports(iatas)
  const iatas_existing = airports.map(a => a.iata)

  console.log("222222:", iatas, iatas_existing,);
  await Promise.all(
    iatas.map(async (i) => {
      if (iatas_existing.indexOf(i) === -1) {
        const res2 = await fetcherFlight(`https://aeroapi.flightaware.com/aeroapi/airports/${i}`);
        const ap: Airport = {
          iata: res2.code_iata,
          name: res2.name,
          longitude: res2.longitude,
          latitude: res2.latitude,
          timezone: res2.timezone,
          country_code: res2.country_code,
        };
        await createAirport(ap);
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

import { auth } from "@/app/(auth)/auth";
import { createTrain, deleteTrain, updateTrain } from "@/db/queries";



export async function POST(request: Request) {

  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  try {
    let res_past: Response | undefined, res_future: Response | undefined;
    // res_past = await fetcherInternal(`/train/bookings/past-trainline.json`, request);
    // res_past = await fetcherInternal(`/train/bookings/past-scot.json`, request);
    // res_future = await fetcherInternal(`/train/bookings/upcoming-trainline.json`, request);

    let res1 = res_past ? await res_past.json() : { pastBookings: { results: [] } };
    let res2 = res_future ? await res_future.json() : { upcomingBookings: { results: [] } };

    let records = (res1?.pastBookings?.results || []).concat(res2?.upcomingBookings?.results || []);//.slice(5, 10);

    for (let r of records) {
      if (r.booking.state == 'VOIDED') { continue; }

      if (r.booking.inward?.openReturn) {
        for (let trip of (r.booking.outward?.legs || [])) {
          if (trip.destination.countryCode != 'GB' || trip.origin.countryCode != 'GB') { continue; }

          let originTime = trip.origin.time.split("T");
          let carrierCodes = trip.carrierCode?.split(':');

          let train = {
            runDate: originTime[0],
            destination: trip.origin.crs,
            destinationName: trip.origin.name,
            originTime: '0000',
            origin: trip.destination.crs,
            originName: trip.destination.name,
            atocCode: carrierCodes[carrierCodes.length - 1],
            transportMode: trip.transportMode,
            id: trip.id + '-1',
          }
          await createTrain(train);
        }
      }

      for (let trip of (r.booking.outward?.legs || []).concat(!r.booking.inward?.openReturn && r.booking.inward?.legs || [])) {
        if (trip.destination.countryCode != 'GB' || trip.origin.countryCode != 'GB') { continue; }

        let originTime = trip.origin.time.split("T");
        let carrierCodes = trip.carrierCode?.split(':');

        let train = {
          serviceUid: trip.timetableId,
          runDate: originTime[0],
          origin: trip.origin.crs,
          originName: trip.origin.name,
          originTime: originTime[1].substr(0, 5).split(':').join(''),
          destination: trip.destination.crs,
          destinationTime: trip.destination.time.split("T")[1].substr(0, 5).split(':').join(''),
          destinationName: trip.destination.name,
          atocCode: carrierCodes[carrierCodes.length - 1],
          transportMode: trip.transportMode,
          id: trip.id,
        }
        await createTrain(train);
      }
    }
  } catch (err) {
    console.error("Failed to read bookings json", err);
    return new Response("Failed to read bookings json", { status: 500 });
  }

  return Response.json({});
}

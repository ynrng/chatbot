import { auth } from "@/app/(auth)/auth";
import { getTrainStations, createTrainStations } from "@/db/queries";
import { fetcherInternal } from "@/lib/utils";


export async function POST(request: Request) {

  const session = await auth();

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  let records: any[] = [];
  try {
    // abcdefghijklmnopqrstuvwxyz
    const promises = 'abcdefghijklmnopqrstuvwxyz'.split('').map(async (ele) => {
      const resp = await fetcherInternal(`/train/station-picker/${ele}.json`, request);
      const res = await resp.json();
      return res.payload.stations;
    });

    records = (await Promise.all(promises)).flat();
    let record_set: any = {};
    for (let r of records) {
      if (!record_set[r.crsCode] && r.latitude && r.longitude) {
        record_set[r.crsCode] = {...r, 'crs': r.crsCode};
      }
    }
    let existings = await getTrainStations(Object.keys(record_set));
    let existing_keys = existings.map(e => e.crs);

    let new_stations: any = Object.values(record_set).filter((r: any) => !existing_keys.includes(r.crs));
    console.log("existings:", existings.length, existing_keys, '\nnew:', new_stations.length);
    if (new_stations.length) {
      createTrainStations(new_stations);
    }
  } catch (err) {
    console.error("Failed to read/parse CSV", err);
    return new Response("Failed to read CSV", { status: 500 });
  }

  return Response.json({});
}

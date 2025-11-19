import fs from "fs";
import { auth } from "@/app/(auth)/auth";
import { fetchOverpass } from "../utils";
import { fetcherInternal } from "@/lib/utils";

const OSM_FILE_PATH = "/train/osm/"; //rail.uk.json



export async function GET(request: Request) {

  let res = await fetcherInternal(OSM_FILE_PATH+'rail.uk.json', request);
  const osm = await res.json()
  console.log('osm data:', osm.elements.length);

  return Response.json(osm);
}

const q = {
//   "rail":`
//       [out:json][timeout:600];
//       area["ISO3166-1"="GB"][admin_level=2]->.uk;
//       (
//         way["railway"="rail"](area.uk);
//       );
//       out geom;
// `,
// 'station':`
//       [out:json][timeout:600];
//       area["ISO3166-1"="GB"][admin_level=2]->.uk;
//       (
//         node["railway"="station"](area.uk);
//       );
//       out geom;
// `,
// 'routenr04':`
// [out:json][timeout:120];
// area["ISO3166-1"="GB"][admin_level=2]->.uk;
// relation["ref"="NR 04"];
// (._;>;);
// out geom;
// `,

'route':`
[out:json][timeout:600];
area["ISO3166-1"="GB"]->.uk;
relation["type"="route"]["route"="train"](area.uk);
(._;>;);
out meta;
`
}



export async function POST(request: Request) {

  const session = await auth();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    console.log('fetching osm data...');

    (Object.keys(q) as Array<keyof typeof q>).forEach(async (key) => {
      console.log(`Fetching ${key} data...`);
      let osm = await fetchOverpass(q[key]);

      // const osm = await res.json();
      console.log('osm data:', osm.elements.length);
      console.log('saving osm data... ' + q[key]);
      fs.writeFileSync('public' + OSM_FILE_PATH + key + '.uk.json', JSON.stringify(osm));
      console.log('osm data saved...');
    });

    return Response.json({});

  } catch (err) {
    console.error("Failed to fetch osm data", err);
    return new Response("Failed to fetch osm data", { status: 500 });
  }
}

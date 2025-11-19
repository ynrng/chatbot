

import { getTrainLegs, getTrains, } from "@/db/queries";

function pathToGeoJSON(path: any, crs: any) {

  return {
    type: "Feature",
    geometry: {
      type: "LineString",
      coordinates: path,
    },
    properties: {
      crs,
    }
  }
};


export async function GET(request: Request) {

  try {

    let trains = await getTrains() || [];
    let legs = await getTrainLegs();
    let legMap: Record<string, any> = {};
    legs.forEach((l) => {
      legMap[`${l.start}-${l.end}`] = l.segments;
    })


    let paths: any = [];

    for (let t of trains) {
      if (Array.isArray(t.locations) && t.locations.length && t.transportMode == 'train' ) {
        let couples: any[] = [];
        let locs = t.locations.filter((loc: any) => loc.crs);
        let seg = []
        for (let i = 0; i < locs.length - 1; i++) {
          let s: any[] = (legMap[`${locs[i].crs}-${locs[i + 1].crs}`] || [])
          if (s && s.length) {
            couples = couples.concat(s.slice(0, -1));
            seg = s.slice(-1);
          } else {
            console.log('No leg found between', locs[i].crs, locs[i + 1].crs, t.serviceUid, t.runDate,t.origin, t.originTime, t.destination);
          }
        }
        couples = couples.concat(seg);
        paths.push(pathToGeoJSON(couples.filter(v => v), locs.map((v: any) => v.crs)));
      }
    }


    let res = {
      "type": "FeatureCollection",
      "features": paths.filter((p: any) => p !== null),
    }

    return Response.json(res);


  } catch (err) {
    console.error("Failed to fetch geojson", err);
    return new Response("Failed to fetch geojson", { status: 500 });
  }

}

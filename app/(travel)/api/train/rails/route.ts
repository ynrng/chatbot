

import { getTrainLegs, getTrains, } from "@/db/queries";
import { writeFile, readFile } from "fs/promises";

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

    const { searchParams } = new URL(request.url);
    const legonly = searchParams.get("legonly");
    console.log('legonly:', legonly);

    let legs = []
    // legs = await getTrainsLegs();
    let s = await readFile("legMap.json", "utf-8")
    let legMap: Record<string, any> = {};


    // await writeFile("public/legMap.json", JSON.stringify(legMap, null, 2));

    if (legonly) {
      legMap = JSON.parse(s);
      let res2 = Object.keys(legMap).map(v=>(pathToGeoJSON(legMap[v], v)))
      console.log('legMap keys:', (Object.keys(legMap).length));
      return Response.json(res2);
    }

    legs.forEach((l) => {
      legMap[`${l.start}-${l.end}`] = l.segments;
    })

    let trains = await getTrains() || [];

    let paths: any = [];

    for (let t of trains) {
      if (Array.isArray(t.locations) && t.locations.length && t.transportMode == 'train') {
        let couples: any[] = [];
        let locs = t.locations.filter((loc: any) => loc.crs);
        let seg = []
        for (let i = 0; i < locs.length - 1; i++) {
          let s: any[] = (legMap[`${locs[i].crs}-${locs[i + 1].crs}`] || [])
          if (s && s.length) {
            couples = couples.concat(s.slice(0, -1));
            seg = s.slice(-1);
          } else {
            console.log('No leg found between', locs[i].crs, locs[i + 1].crs, t.serviceUid, t.runDate, t.origin, t.originTime, t.destination);
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



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
    const debugging = searchParams.get("debug");
    console.log('debugging:', debugging);

    let legs = await getTrainLegs();
    let legMap: Record<string, any> = {};

    legs.forEach((l) => {
      legMap[`${l.start}-${l.end}`] = l.segments;
    })

    if (debugging=='1') {
      // await writeFile("public/legMap.json", JSON.stringify(legMap, null, 2));
      let s = await readFile("legMap.json", "utf-8");
      legMap = JSON.parse(s);
      let res2 = Object.keys(legMap).map(v => (pathToGeoJSON(legMap[v], v)))
      console.log('legMap keys:', (Object.keys(legMap).length));
      return Response.json(res2);
    }

    let trains = await getTrains() || [];

    let paths: any = [];

    for (let t of trains) {
      if (Array.isArray(t.locations) && t.locations.length && t.transportMode == 'train') {
        let couples: any[] = [];
        let locs = t.locations.filter((loc: any) => loc.crs);
        let seg = []
        for (let i = 0; i < locs.length - 1; i++) {
          let k =`${locs[i].crs}-${locs[i + 1].crs}`
          let s: any[] = (legMap[k] || [])
          //   if(k==[ 'GLQ', 'CHC',  ].join('-')){
          //   couples = s //couples.concat(s);
          //   seg = s.slice(-1);
          //   console.log('  leg ', couples, locs[i].crs, locs[i + 1].crs,  t.runDate, t.origin, t.originTime, t.destination);
          //   break;
          // }
          if (s && s.length) {
            couples = couples.concat(s);
            seg = s.slice(-1);
          } else {
            console.log('No leg found between', locs[i].crs, locs[i + 1].crs, t.serviceUid, t.runDate, t.origin, t.originTime, t.destination);
          }
        }
        couples = couples.concat(seg);
        paths.push(pathToGeoJSON(couples.filter(v => v), locs.map((v: any) => v.crs)));
      }
    }


    if (debugging=='2') {
      console.log('paths all:', (paths.length));
    return Response.json(paths);

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

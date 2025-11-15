// import { auth } from "@/app/(auth)/auth";


import { auth } from "@/app/(auth)/auth";
import { fetcherInternal } from "@/lib/utils";


// Helper: do Overpass query and return features
async function runOverpass(query: string) {
    const url = 'https://overpass-api.de/api/interpreter';
    const body = `data=${encodeURIComponent(query)}`;
    const resp = await fetch(url, {
        method: 'POST',
        body,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    const json = await resp.json();
    return json;
}

// Get node(s) for a station by name
async function getStationNodes(stationName: string) {
    const query = `
    [out:json];
    node["railway"="station"]["name"="${stationName}"];
    out;
  `;
    const result = await runOverpass(query);
    return result.elements.filter((e:any) => e.type === 'node');
}

// Get rail track ways between bounding boxes around two stations
async function getRailWays(bbox1:any, bbox2:any) {
    // Combine bounding box extents (minLat, minLon, maxLat, maxLon)
    const combined = [
        Math.min(bbox1.minLat, bbox2.minLat),
        Math.min(bbox1.minLon, bbox2.minLon),
        Math.max(bbox1.maxLat, bbox2.maxLat),
        Math.max(bbox1.maxLon, bbox2.maxLon)
    ];
    const query = `
    [out:json][timeout:60];
    (
      way["railway"="rail"](${combined[0]},${combined[1]},${combined[2]},${combined[3]});
    );
    out geom;
  `;
    const result = await runOverpass(query);
    return result.elements.filter(e => e.type === 'way');
}

// Main function
async function getRailGeoJSON(stationA:string, stationB:string) {
    const nodesA = await getStationNodes(stationA);
    const nodesB = await getStationNodes(stationB);
    if (nodesA.length === 0 || nodesB.length === 0) {
        throw new Error('Station not found');
    }

    // Take first node each
    const na = nodesA[0], nb = nodesB[0];

    // Create bounding boxes around each station (e.g. ±0.1° lat/lon)
    const delta = 0.2;
    const bboxA = { minLat: na.lat - delta, minLon: na.lon - delta, maxLat: na.lat + delta, maxLon: na.lon + delta };
    const bboxB = { minLat: nb.lat - delta, minLon: nb.lon - delta, maxLat: nb.lat + delta, maxLon: nb.lon + delta };

    const ways = await getRailWays(bboxA, bboxB);

    console.log('1111111',ways.length);
    // Convert to GeoJSON FeatureCollection
    const features = ways.map(w => ({
        type: "Feature",
        geometry: {
            type: "LineString",
            coordinates: w.geometry.map((pt:any) => [pt.lon, pt.lat])
        },
        properties: {
            id: w.id,
            tags: w.tags
        }
    }));

    return {
        type: "FeatureCollection",
        features
    };
}



export async function GET(request: Request) {

  // const session = await auth();

  // if (!session) {
  //   return new Response("Unauthorized", { status: 401 });
  // }

  let records: any[] = [];
  try {
    // const resp = await fetcherInternal(`/train/bookings/0.json`, request);
    // const res = await resp.json();

  // Example usage
  const res = await getRailGeoJSON('London Euston', 'Manchester Piccadilly')
  return Response.json(res);


    // let records = res?.pastBookings?.results || [];

  } catch (err) {
    console.error("Failed to fetch geojson", err);
    return new Response("Failed to fetch geojson", { status: 500 });
  }

  return Response.json({});
}

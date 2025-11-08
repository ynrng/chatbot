"use client";
import dynamic from "next/dynamic";

import useSWR from "swr";
import L, { LatLngExpression } from "leaflet";

import { fetcher } from "@/lib/utils";
import { Polyline } from "react-leaflet";



const Map = dynamic(() => import("@/components/travel/map"), {
    ssr: false, // Disable SSR for Leaflet
});

// Generate points along a quadratic Bezier curve
function generateBezierCurve(
    start: [number, number],
    end: [number, number],
    curvature: number = 0.1,
    segments: number = 50
): [number, number][] {
    const [lat1, lng1] = start;
    const [lat2, lng2] = end;

    // Control point (offset from midpoint)
    const midLat = (lat1 + lat2) / 2 + curvature;
    const midLng = (lng1 + lng2) / 2 + curvature;

    const points: [number, number][] = [];

    for (let t = 0; t <= 1; t += 1 / segments) {
        // Quadratic Bezier formula: B(t) = (1-t)^2 P0 + 2(1-t)t P1 + t^2 P2
        const lat = (1 - t) ** 2 * lat1 + 2 * (1 - t) * t * midLat + t ** 2 * lat2;
        const lng = (1 - t) ** 2 * lng1 + 2 * (1 - t) * t * midLng + t ** 2 * lng2;
        points.push([lat, lng]);
    }

    return points;
}

export default function Page() {

    const flightId = '12345';

    const { data } = useSWR(flightId ? `/api/flight/${flightId}/track` : null, fetcher);


    const positions: LatLngExpression[] = data?.positions ? data?.positions.map(p => [p.latitude, p.longitude]) : [];



    const edi_coords: [number, number] = [55.9500, -3.3725]; // Edinburgh Airport coordinates

    const geneva_coords: [number, number] = [46.2381, 6.1083]; // Geneva Airport coordinates
    const positionsFuture = generateBezierCurve(edi_coords, geneva_coords, 5);


    console.log("Flight Track Data:", data);


    return (
        <div className="h-screen ">
            <Map>
                {positions.length && <Polyline positions={positions} color="blue" />}
                <Polyline positions={positionsFuture}
                    pathOptions={{
                        color: "deepskyblue",
                        weight: 1,
                        renderer: L.canvas(), // force canvas rendering
                        className: "bg-cyan-500 shadow-lg shadow-cyan-500/50", //todo this is not working
                    }}
                />
            </Map>
        </div>
    );
}
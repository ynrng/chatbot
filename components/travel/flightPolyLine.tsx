"use client";
import L, { LatLngExpression } from "leaflet";

import { Polyline, PolylineProps } from "react-leaflet";

// Generate points along a quadratic Bezier curve
function generateBezierCurve(
    start: [number, number],
    end: [number, number],
    curvature: number = 0.1,
    segments: number = 50
): [number, number][] {
    const [lat1, lng1] = start;
    const [lat2, lng2] = end;
    if (!lat1 || !lng1 || !lat2 || !lng2) return [];

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

    return points; // filter out invalid points
}

// helper to overwrite properties of a type
type Overwrite<T, U> = Omit<T, keyof U> & U;
type Props = Overwrite<
    PolylineProps,
    {
        positions?: any[]; // override PolylineProps.positions type
    }
> & {
    from?: [number, number];
    to?: [number, number];
    curvature?: number;
};


export default function FlightPolyLine({
    positions,
    from,
    to,
    curvature,
    ...polylineProps
}: Props) {

    const edi_coords: [number, number] = [55.9500, -3.3725]; // Edinburgh Airport coordinates

    const geneva_coords: [number, number] = [46.2381, 6.1083]; // Geneva Airport coordinates

    if (positions?.length) {
        const positionsPast: LatLngExpression[] = positions.map((p: any) => [p.latitude, p.longitude]);

        return positionsPast.length && <Polyline color="blue"   {...polylineProps} positions={positionsPast} />;
    } else if (from && to) {

        const positionsFuture = generateBezierCurve(from, to, curvature || 5);
        return positionsFuture?.length&&(
            <Polyline
                positions={positionsFuture}
                pathOptions={{
                    color: polylineProps?.color || "deepskyblue",
                    weight: 1,
                    renderer: L.canvas(), // force canvas rendering
                    className: "bg-cyan-500 shadow-lg shadow-cyan-500/50", //todo this is not working
                }}
                {...polylineProps}
            />
        )||null;
    }else{
        return null;
    }
}

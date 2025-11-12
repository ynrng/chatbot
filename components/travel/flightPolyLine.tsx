"use client";
import L, { LatLngExpression } from "leaflet";

import { Polyline, PolylineProps } from "react-leaflet";

// Generate points along a quadratic Bezier curve
function generateBezierCurve(
    start: [number, number],
    end: [number, number],
    curvature: number = 1,
    segments: number = 50
): [number, number][] {
    const [lat1, lng1] = start;
    const [lat2, lng2] = end;
    if (!lat1 || !lat2 || !lng1 || !lng2) return [];

    const points: [number, number][] = [start];

    // Web Mercator projection <-> geographic helpers
    const R = 6378137;
    const project = (lat: number, lng: number) => {
        const x = (lng * Math.PI / 180) * R;
        const y = Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360)) * R;
        return [x, y];
    };
    const unproject = (x: number, y: number) => {
        const lng = (x / R) * 180 / Math.PI;
        const lat = (2 * Math.atan(Math.exp(y / R)) - Math.PI / 2) * 180 / Math.PI;
        return [lat, lng] as [number, number];
    };

    // project endpoints to meters
    const [x1, y1] = project(lat1, lng1);
    const [x2, y2] = project(lat2, lng2);

    // Control point (offset from midpoint)
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;


    // vector from start to end
    const dx = x2 - x1;
    const dy = y2 - y1;

    // perpendicular vector (rotate 90deg)
    let px = -dy;
    let py = dx;

    // normalize perpendicular
    const len = Math.hypot(px, py) || 1;
    px /= len;
    py /= len;

    // scale offset by distance and curvature
    const distance = Math.hypot(dx, dy);
    const offset = distance * (0.3 + curvature * 0.1);
    const cx = mx + px * offset;
    const cy = my + py * offset;

    for (let t = 0; t <= 1; t += 1 / segments) {
        // Quadratic Bezier formula: B(t) = (1-t)^2 P0 + 2(1-t)t P1 + t^2 P2
        const bx = (1 - t) ** 2 * x1 + 2 * (1 - t) * t * cx + t ** 2 * x2;
        const by = (1 - t) ** 2 * y1 + 2 * (1 - t) * t * cy + t ** 2 * y2;
        points.push(unproject(bx, by));
    }
    points.push(end);

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
    from: [number, number];
    to: [number, number];
    curvature?: number;
    centre?: [number, number];
};


export default function FlightPolyLine({
    positions,
    from,
    to,
    curvature,
    centre,
    ...polylineProps
}: Props) {

    const edi_coords: [number, number] = [55.9500, -3.3725]; // Edinburgh Airport coordinates
    if (!centre || !centre[0] || !centre[1]) {
        centre = edi_coords;
    }

    let from_dis = Math.abs(from[0] - centre[0]) + Math.abs(from[1] - centre[1])
    let to_dis = Math.abs(to[0] - centre[0]) + Math.abs(to[1] - centre[1])
    let color =from_dis>to_dis ? "green" : "deepskyblue";

    if (positions?.length) {
        const positionsPast: LatLngExpression[] = positions.map((p: any) => [p.latitude, p.longitude]);

        return positionsPast.length && <Polyline color={polylineProps?.color || color}   {...polylineProps} positions={positionsPast} />;
    } else if (from && to) {

        const positionsFuture = generateBezierCurve(from, to, curvature || 0);


        return positionsFuture?.length && (
            <Polyline
                positions={positionsFuture}
                pathOptions={{
                    color: polylineProps?.color || color,
                    weight: 1,
                    // renderer: L.canvas(), // force canvas rendering
                    className: "bg-cyan-500 shadow-lg shadow-cyan-500/50", //todo this is not working
                }}
                {...polylineProps}
            />
        ) || null;
    } else {
        return null;
    }
}

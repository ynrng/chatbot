"use client";

import L, { LatLngExpression } from "leaflet";
import { Rotate3D } from "lucide-react";

import { Polyline, Popup, Tooltip, Marker, SVGOverlay } from "react-leaflet";


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

// Generate points along a quadratic Bezier curve
function generateBezierCurve(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
    curvature: number = 1,
    segments: number = 51
): [number, number][] {
    // const [lat1, lng1] = start;
    // const [lat2, lng2] = end;
    if (!lat1 || !lat2 || !lng1 || !lng2) return [];

    const points: [number, number][] = [[lat1, lng1]];

    // Web Mercator projection <-> geographic helpers
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
    points.push([lat2, lng2]);

    console.log('bezier points:', points.length);

    return points; // filter out invalid points
}

const arrowIcon = L.icon({
    iconUrl: '/images/arrow.png',
    iconSize: [16, 16], // size of the icon
    iconAnchor: [8, 8], // point of the icon which will correspond to marker's location
    popupAnchor: [0, -8] // point from which the popup should open relative to the iconAnchor
});


export default function FlightPolyLine({
    flight: f
}: any) {

    const edi_coords: [number, number] = [55.9500, -3.3725]; // Edinburgh Airport coordinates

    let from_dis = Math.abs(f.from_airport?.latitude - edi_coords[0]) + Math.abs(f.from_airport?.longitude - edi_coords[1])
    let to_dis = Math.abs(f.to_airport?.latitude - edi_coords[0]) + Math.abs(f.to_airport?.longitude - edi_coords[1])
    let color = from_dis > to_dis ? "green" : "deepskyblue";
    let popupText = (<>
        <div>{`${f.scheduled_out.split('T')[0]} ${f.ident}`} </div>
        <div>{`${f.from_airport?.name} - ${f.to_airport?.name}`}</div>
    </>)
    let popups = (<Tooltip opacity={1} sticky>{popupText}</Tooltip>)

    if (f.positions?.length) {
        const positionsPast: LatLngExpression[] = f.positions.map((p: any) => [p.latitude, p.longitude]);
        return <Polyline color={color} positions={positionsPast} >{popups}</Polyline>;
    } else {
        let lat1 = f.from_airport?.latitude || 0, lng1 = f.from_airport?.longitude || 0, lat2 = f.to_airport?.latitude || 0, lng2 = f.to_airport?.longitude || 0;
        const positionsFuture = generateBezierCurve(lat1, lng1, lat2, lng2, f.route_count || 0);

        const midP = positionsFuture[Math.floor((positionsFuture.length + 1) / 2)];

        // compute arrow points in projected (meters) space for symmetry
        const [x1, y1] = project(lat1, lng1);
        const [x2, y2] = project(lat2, lng2);
        const [mx, my] = project(midP[0], midP[1]);

        let dirX = x2 - x1;
        let dirY = y2 - y1;
        let dirLen = (dirX ** 2 + dirY ** 2) ** 0.5
        dirX /= dirLen;
        dirY /= dirLen;

        // perpendicular unit vector
        let perpX = -dirY;
        let perpY = dirX;
        const halfWidth = 10000
        const backLen =20000

        // base points are behind the tip along -dir and offset by perpendicular for symmetry
        const leftX = mx - dirX * backLen + perpX * halfWidth;
        const leftY = my - dirY * backLen + perpY * halfWidth;
        const rightX = mx - dirX * backLen - perpX * halfWidth;
        const rightY = my - dirY * backLen - perpY * halfWidth;

        const [m_lat1, m_lng1] = unproject(leftX, leftY);
        const [m_lat2, m_lng2] = unproject(rightX, rightY);


        return positionsFuture?.length && (
            <>
                <Polyline
                    positions={positionsFuture}
                    pathOptions={{
                        color: color,
                        weight: 1,
                        // renderer: L.canvas(), // force canvas rendering
                        className: "bg-cyan-500 shadow-lg shadow-cyan-500/50", //todo this is not working
                    }}
                >
                    {popups}
                </Polyline>
                <Polyline
                    positions={[[m_lat1, m_lng1], midP, [m_lat2, m_lng2]]}
                    pathOptions={{
                        color: color,
                        weight: 1,
                        // renderer: L.canvas(), // force canvas rendering
                        className: "bg-cyan-500 shadow-lg shadow-cyan-500/50 z-50", //todo this is not working
                    }}
                >
                    <Popup>{popupText}</Popup>
                </Polyline>
            </>
        ) || null;
    }
}

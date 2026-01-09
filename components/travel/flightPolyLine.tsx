"use client";

import L, { LatLngExpression } from "leaflet";
import { useEffect, useState } from "react";
import cx from "classnames";

import { Polyline, Popup, Tooltip, Marker, SVGOverlay, useMap, useMapEvents } from "react-leaflet";



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
    if (!lat1 || !lat2 || !lng1 || !lng2) return [];

    const points: [number, number][] = [];

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
    // points.push([lat2, lng2]);

    return points; // filter out invalid points
}

function getArrowPoints(positions: any, zoom?: number) {

    let midi = Math.floor((positions.length + 1) / 2)
    const midP = positions[midi];

    // compute arrow points in projected (meters) space for symmetry
    const [x1, y1] = project(...(positions[midi - 1] as [number, number]));
    const [x2, y2] = project(...(positions[midi + 1] as [number, number]));
    const [mx, my] = project(midP[0], midP[1]);

    let dirX = x2 - x1;
    let dirY = y2 - y1;
    let dirLen = (dirX ** 2 + dirY ** 2) ** 0.5
    dirX /= dirLen;
    dirY /= dirLen;

    // perpendicular unit vector
    let perpX = -dirY;
    let perpY = dirX;
    let a = zoom ? 2 ** (7 - zoom) : 0;

    let halfWidth = 5000 * a
    let backLen = 10000 * a

    // base points are behind the tip along -dir and offset by perpendicular for symmetry
    const leftX = mx - dirX * backLen + perpX * halfWidth;
    const leftY = my - dirY * backLen + perpY * halfWidth;
    const rightX = mx - dirX * backLen - perpX * halfWidth;
    const rightY = my - dirY * backLen - perpY * halfWidth;

    const [m_lat1, m_lng1] = unproject(leftX, leftY);
    const [m_lat2, m_lng2] = unproject(rightX, rightY);

    return [[m_lat1, m_lng1], midP, [m_lat2, m_lng2]];

}

export default function FlightPolyLine({
    flight: f,
    zoom
}: {
    flight: any,
    zoom?: number
}) {
    if (f.status == 'Cancelled') {
        return null;
    }

    const edi_coords: [number, number] = [55.9500, -3.3725]; // Edinburgh Airport coordinates

    let from_dis = Math.abs(f.from_airport?.latitude - edi_coords[0]) + Math.abs(f.from_airport?.longitude - edi_coords[1])
    let to_dis = Math.abs(f.to_airport?.latitude - edi_coords[0]) + Math.abs(f.to_airport?.longitude - edi_coords[1])
    let color = from_dis > to_dis ? "green" : "deepskyblue";
    let popupText = (<>
        <div>{`${f.scheduled_out.split('T')[0]} ${f.ident}`} </div>
        <div>{`${f.from_airport?.name} - ${f.to_airport?.name}`}</div>
    </>)
    let popups = (<Tooltip opacity={1} sticky>{popupText}</Tooltip>)
    let positions: any[];

    let lat1 = f.from_airport?.latitude || 0, lng1 = f.from_airport?.longitude || 0, lat2 = f.to_airport?.latitude || 0, lng2 = f.to_airport?.longitude || 0;
    if (f.positions?.length) {
        positions = f.positions.map((p: any) => [p.latitude, p.longitude]);
    } else {
        positions = generateBezierCurve(lat1, lng1, lat2, lng2, f.route_count || 0);
    }

    positions = [[lat1, lng1]].concat(positions, [[lat2, lng2]]);
    let midi = Math.floor((positions.length + 1) / 2)
    const midP = positions[midi];

    const [highlight, setHighlight] = useState(false);
    const arrowPos = getArrowPoints(positions, (zoom || 1) * (highlight ? 0.9 : 1));

    let pathOptions = {
        color: color,
        weight: highlight ? 5 : 1,
        opacity: highlight ? 1 : 0.8,
        // renderer: L.canvas(), // force canvas rendering
        className: cx(
            "bg-cyan-500 shadow-lg shadow-cyan-500/50",
            highlight ? 'z-50' : ''
        ), //todo this is not working
    }

    return positions?.length && (
        <>
            <Polyline
                positions={positions}
                pathOptions={pathOptions}
                eventHandlers={{
                    mouseover: (e) => {
                        console.log("Mouse over polyline", f, e.target);
                        setHighlight(true);
                    },
                    mouseout: (e) => {
                        setHighlight(false);
                    }
                }}
            >
                {popups}
            </Polyline>
            <Polyline
                positions={arrowPos}
                pathOptions={pathOptions}
            >
                <Popup>{popupText}</Popup>
            </Polyline>
        </>
    ) || null;
}

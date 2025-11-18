"use client";

import { GeoJSON } from "react-leaflet";
import L from "leaflet";


export default function TrainTrackGeoJSON({
    data
}: {
    data: any
}) {
    console.log('TrainTrackGeoJSONdata:', data);
    return (
        <GeoJSON attribution="&copy; credits due overpass api" data={data} pathOptions={{
            color: 'yellow',
            weight: 1,
            opacity: 1,
            renderer: L.canvas(), // force canvas rendering
            className: "bg-cyan-500 shadow-lg shadow-cyan-500/50", //todo this is not working
        }} />
    );
}

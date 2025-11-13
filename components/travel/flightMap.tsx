"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";

import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";

// Fix Leaflet's default marker icon path
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});


export default function FlightMap({
    center_coords,
    children,
}: {
    center_coords: [number, number],
    children?: React.ReactNode,
}) {

    return (
        <MapContainer
            center={center_coords}
            zoom={5.5}
            zoomDelta={0.5}
            minZoom={2.5}
            maxZoom={7}
            scrollWheelZoom={true}
            className="size-full flex flex-1 z-20"
        >
            {/* <TileLayer
                attribution='&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
            /> */}

            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            {children}
        </MapContainer>
    );
}
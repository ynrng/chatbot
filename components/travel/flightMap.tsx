"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";

import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";

// Fix Leaflet's default marker icon path,
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});


export default function FlightMap({
    center_coords = [55.9500, -3.3725],
    children,
    minZoom=2.5,
    maxZoom=10
}: {
    center_coords?: [number, number],
    children?: React.ReactNode,
    minZoom?: number,
    maxZoom?: number
}) {

    return (
        <MapContainer
            center={center_coords}
            zoom={5.5}
            zoomDelta={0.5}
            minZoom={minZoom || 2.5}
            maxZoom={maxZoom || 7}
            scrollWheelZoom={true}
            className="size-full flex flex-1 z-20"
        >

            <TileLayer
                attribution='&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png?token=6b0b8afe-3fa5-4569-a017-681170f87d5f"
                minZoom={0}
                maxZoom={20}
            />
            {children}
        </MapContainer>
    );
}
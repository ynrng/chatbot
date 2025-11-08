"use client";

import "leaflet/dist/leaflet.css";
import L, { LatLngExpression } from "leaflet";
import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";

// Fix Leaflet's default marker icon path
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// TO change map designs: https://leaflet-extras.github.io/leaflet-providers/preview/

export default function Map({
    children,
    polylinePositions,
}: {
    children?: React.ReactNode,
    polylinePositions?: [any],
}) {
    const edi_coords: [number, number] = [55.9500, -3.3725]; // Edinburgh Airport coordinates
    const pvg_coords: [number, number] = [31.1443, 121.8083]; // Shanghai Pudong International Airport coordinates
    const geneva_coords: [number, number] = [46.2381, 6.1083]; // Geneva Airport coordinates
    const center_coords: [number, number] = [(edi_coords[0] + geneva_coords[0]) / 2, (edi_coords[1] + geneva_coords[1]) / 2];


    return (
        <MapContainer
            center={center_coords}
            zoom={5.5}
            scrollWheelZoom={false}
            className="h-full w-full rounded-lg"
        >

            {/* <TileLayer
                attribution='&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
            /> */}

            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            <Marker position={edi_coords}>
                <Popup>📍 I'm here.</Popup>
            </Marker>
            {/* {polylinePos.length && <Polyline positions={polylinePos} color="blue" />} */}
            {children}
        </MapContainer>
    );
}
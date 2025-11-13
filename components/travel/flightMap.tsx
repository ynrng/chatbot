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

// TO change map designs: https://leaflet-extras.github.io/leaflet-providers/preview/
const edi_coords: [number, number] = [55.9500, -3.3725]; // Edinburgh Airport coordinates
const pvg_coords: [number, number] = [31.1443, 121.8083]; // Shanghai Pudong International Airport coordinates
const geneva_coords: [number, number] = [46.2381, 6.1083]; // Geneva Airport coordinates
const center_coords: [number, number] = [(edi_coords[0] + geneva_coords[0]) / 2, (edi_coords[1] + geneva_coords[1]) / 2];


const defaultBounds: L.LatLngBoundsLiteral = [
    edi_coords,
    geneva_coords,
]


function MyComponent() {

    const map = useMap();
    // console.log('fitting bounds to defaultBounds');
    map.fitBounds(defaultBounds)

    return null
}

export default function FlightMap({
    children,
}: {
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
            <MyComponent />
        </MapContainer>
    );
}
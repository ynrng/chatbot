"use client";
import dynamic from "next/dynamic";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";

const FlightMap = dynamic(() => import("@/components/travel/flightMap"), {
    ssr: false, // Disable SSR for Leaflet
});

const TrainTrackGeoJSON = dynamic(() => import("@/components/travel/trainTrack"), {
    ssr: false, // Disable SSR for Leaflet
});

import { useMap, useMapEvents,GeoJSON } from "react-leaflet";
import { useEffect, useState } from "react";


// TO change map designs: https://leaflet-extras.github.io/leaflet-providers/preview/
const edi_coords: [number, number] = [55.9500, -3.3725]; // Edinburgh Airport coordinates
const london_coords: [number, number] = [51.4700, -0.4543]; // London Heathrow Airport coordinates


const defaultBounds: L.LatLngBoundsLiteral = [
    edi_coords,
    london_coords,
]

export default function Page() {

    const [zoom, setZoom] = useState<number>(0);

    function MyComponent() {
        const map = useMapEvents({
            // https://leafletjs.com/reference.html#evented
            zoom: () => {
                setZoom(map.getZoom());
            },
        });
        if (0 == zoom) {
            setZoom(map.getZoom());
            map.fitBounds(defaultBounds)
        }
        return null
    }

    let { data } = useSWR(`/api/train/rails`, fetcher);

    console.log('3333222', data);

    return (
        <div className="h-screen w-full">
            <FlightMap center_coords={edi_coords}
                // minZoom={minZoom || 2.5}
                maxZoom={20}
            >
                {data  && <TrainTrackGeoJSON data={data}  />}
                <MyComponent />
            </FlightMap>
        </div>
    );
}

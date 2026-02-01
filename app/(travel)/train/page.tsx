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
const TrainStationMarker = dynamic(() => import("@/components/travel/trainStationMarker"), {
    ssr: false, // Disable SSR for Leaflet
});

import { useMap, } from "react-leaflet";


// TO change map designs: https://leaflet-extras.github.io/leaflet-providers/preview/
const edi_coords: [number, number] = [55.9500, -3.3725]; // Edinburgh Airport coordinates
const london_coords: [number, number] = [51.4700, -0.4543]; // London Heathrow Airport coordinates


const defaultBounds: L.LatLngBoundsLiteral = [
    edi_coords,
    london_coords,
]

export default function Page() {


    function MyComponent() {
        const map = useMap();
        map.fitBounds(defaultBounds)
        return null
    }

    let { data:rails } = useSWR(`/api/train/rails`, fetcher);
    let { data:stations } = useSWR(`/api/train/stations`, fetcher);

    console.log('3333222', rails, );

    return (
        <div className="h-screen w-full">
            <FlightMap center_coords={edi_coords}
                // minZoom={minZoom || 2.5}
                maxZoom={20}
            >
                {rails && <TrainTrackGeoJSON data={rails} />}

                {
                    stations?.map((a: any) => (
                        <TrainStationMarker key={a.crs} station={a} ></TrainStationMarker>
                    ))
                }
                <MyComponent />
            </FlightMap>
        </div>
    );
}

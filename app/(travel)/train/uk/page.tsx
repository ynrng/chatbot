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


import { osmToGeoJSON } from "@/lib/utils";


// TO change map designs: https://leaflet-extras.github.io/leaflet-providers/preview/
const edi_coords: [number, number] = [55.9500, -3.3725]; // Edinburgh Airport coordinates


export default function Page() {


    let { data } = useSWR(`/api/train/overpass`, fetcher);

    console.log('3333222', data);

    return (
        <div className="h-screen w-full">
            <FlightMap center_coords={edi_coords}
                maxZoom={20}
            >
                {data  && <TrainTrackGeoJSON data={osmToGeoJSON(data)}  />}
            </FlightMap>
        </div>
    );
}

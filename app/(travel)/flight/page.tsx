"use client";
import dynamic from "next/dynamic";

import useSWR from "swr";

import { fetcher } from "@/lib/utils";

const FlightMap = dynamic(() => import("@/components/travel/flightMap"), {
    ssr: false, // Disable SSR for Leaflet
});
const FlightPolyLine = dynamic(() => import("@/components/travel/flightPolyLine"), {
    ssr: false, // Disable SSR for Leaflet
});
const AirportMarker = dynamic(() => import("@/components/travel/airportMarker"), {
    ssr: false, // Disable SSR for Leaflet
});

import { useMap, useMapEvents, } from "react-leaflet";
import { useEffect, useState } from "react";


// TO change map designs: https://leaflet-extras.github.io/leaflet-providers/preview/
const edi_coords: [number, number] = [55.9500, -3.3725]; // Edinburgh Airport coordinates
const pvg_coords: [number, number] = [31.1443, 121.8083]; // Shanghai Pudong International Airport coordinates
const geneva_coords: [number, number] = [46.2381, 6.1083]; // Geneva Airport coordinates
const center_coords: [number, number] = [(edi_coords[0] + geneva_coords[0]) / 2, (edi_coords[1] + geneva_coords[1]) / 2];


const defaultBounds: L.LatLngBoundsLiteral = [
    edi_coords,
    geneva_coords,
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


    const { data } = useSWR(`/api/flight/history`, fetcher);


    return (
        <div className="h-screen w-full">
            <FlightMap center_coords={center_coords}>
                {
                    data?.flights?.map((f: any) => (
                        <FlightPolyLine key={f.ident + f.scheduled_out} flight={f} zoom={zoom} />
                    ))
                }
                {
                    data?.airports?.map((a: any) => (
                        <AirportMarker key={a.iata} airport={a} ></AirportMarker>
                    ))
                }
                <MyComponent />
            </FlightMap>
        </div>
    );
}
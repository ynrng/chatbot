"use client";
import dynamic from "next/dynamic";

import useSWR from "swr";

import { fetcher } from "@/lib/utils";

const Map = dynamic(() => import("@/components/travel/flightMap"), {
    ssr: false, // Disable SSR for Leaflet
});
const FlightPolyLine = dynamic(() => import("@/components/travel/flightPolyLine"), {
    ssr: false, // Disable SSR for Leaflet
});
const AirportMarker = dynamic(() => import("@/components/travel/airportMarker"), {
    ssr: false, // Disable SSR for Leaflet
});




export default function Page() {


    const { data } = useSWR(`/api/flight/list`, fetcher);


    return (
        <div className="h-screen w-full">
            <Map>
                {
                    data?.flights?.map((f: any) => (
                        <FlightPolyLine key={f.ident + f.scheduled_out} flight={f} />
                    ))
                }
                {
                    data?.airports?.map((a: any) => (
                        <AirportMarker key={a.iata} airport={a}></AirportMarker>
                    ))
                }
            </Map>
        </div>
    );
}
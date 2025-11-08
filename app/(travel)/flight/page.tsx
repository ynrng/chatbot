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


export default function Page() {

    const flightId = '12345';

    const { data } = useSWR(flightId ? `/api/flight/${flightId}/track` : null, fetcher);



    const edi_coords: [number, number] = [55.9500, -3.3725]; // Edinburgh Airport coordinates

    const geneva_coords: [number, number] = [46.2381, 6.1083]; // Geneva Airport coordinates


    console.log("Flight Track Data:", data);


    return (
        <div className="h-screen ">
            <Map>
                {data?.positions && <FlightPolyLine positions={data?.positions} color="blue" />}
                <FlightPolyLine from={edi_coords} to={geneva_coords} curvature={5} color="deepskyblue" />
            </Map>
        </div>
    );
}
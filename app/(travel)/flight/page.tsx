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


    const { data } = useSWR(`/api/flight/list`, fetcher);

    return (
        <div className="h-screen w-full">
            <Map>
                {
                    data && data.map((d: any) => (
                        d.positions?.length > 0 ?
                            <FlightPolyLine key={d.indent + d.scheduled_out} positions={d.positions} color="blue" />
                            : <FlightPolyLine key={d.ident + d.scheduled_out} from={[d.from_airport?.latitude, d.from_airport?.longitude]} to={[d.to_airport?.latitude, d.to_airport?.longitude]} curvature={.3} color="deepskyblue" />)
                    ) || null
                }
            </Map>
        </div>
    );
}
"use client";
// import dynamic from "next/dynamic";

// import useSWR from "swr";

// import { fetcher } from "@/lib/utils";

// const FlightMap = dynamic(() => import("@/components/travel/flightMap"), {
//     ssr: false, // Disable SSR for Leaflet
// });
// const FlightPolyLine = dynamic(() => import("@/components/travel/flightPolyLine"), {
//     ssr: false, // Disable SSR for Leaflet
// });
// const AirportMarker = dynamic(() => import("@/components/travel/airportMarker"), {
//     ssr: false, // Disable SSR for Leaflet
// });

// const { useMap, useMapEvents,GeoJSON } = dynamic(() => import("react-leaflet"), {
//     ssr: false, // Disable SSR for Leaflet
// });

import { useMap, useMapEvents,GeoJSON } from "react-leaflet";
// import { useEffect, useState } from "react";


// TO change map designs: https://leaflet-extras.github.io/leaflet-providers/preview/
const edi_coords: [number, number] = [55.9500, -3.3725]; // Edinburgh Airport coordinates
const london_coords: [number, number] = [51.4700, -0.4543]; // London Heathrow Airport coordinates


const defaultBounds: L.LatLngBoundsLiteral = [
    edi_coords,
    london_coords,
]

export default   function TrainTrackGeoJSON({data}: {data:any}) {




    return (
                <GeoJSON attribution="&copy; credits due..." data={data} />
    );
}

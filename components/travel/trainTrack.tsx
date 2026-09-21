"use client";

import { GeoJSON } from "react-leaflet";
import { useEffect, useRef } from "react";

function useGeoJsonClassName(geoJsonRef: React.MutableRefObject<any>, className: string, data: any) {
    useEffect(() => {
        geoJsonRef.current?.eachLayer((layer: any) => {
            layer.getElement?.()?.classList.add(className);
        });
    }, [className, data, geoJsonRef]);
}


export default function TrainTrackGeoJSON({
    data
}: {
    data: any
}) {
    // console.log('TrainTrackGeoJSONdata:', data);
    const glowRef = useRef<any>(null);
    const coreRef = useRef<any>(null);

    useGeoJsonClassName(glowRef, "train-neon-glow", data);
    useGeoJsonClassName(coreRef, "train-neon-core", data);

    return (
        <>
            <GeoJSON
                ref={glowRef}
                attribution="&copy; credits due overpass api"
                data={data}
                pathOptions={{
                    color: "yellow",
                    weight: 5,
                    opacity: 0.35,
                }}
            />
            <GeoJSON
                ref={coreRef}
                data={data}
                pathOptions={{
                    color: "#fff7a8",
                    weight: 2,
                    opacity: 1,
                }}
            />

        </>
    );
}

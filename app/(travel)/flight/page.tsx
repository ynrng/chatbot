
import dynamic from "next/dynamic";
const Map = dynamic(() => import("@/components/travel/map"), {
    ssr: false, // Disable SSR for Leaflet
});

export default function Page() {
    return (
        <Map />
    );
}
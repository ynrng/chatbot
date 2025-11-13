"use client";

import L from "leaflet";
import { Marker, Popup } from "react-leaflet";


var airportIcon = L.icon({
    iconUrl: '/images/airport.png',
    iconSize:     [38, 38], // size of the icon
    iconAnchor:   [19, 34], // point of the icon which will correspond to marker's location
    popupAnchor:  [0, -30] // point from which the popup should open relative to the iconAnchor
});

export default function AirportMarker({
    airport
}: any) {
    <a href="https://www.flaticon.com/free-icons/airport" title="airport icons">Airport icons created by Boris farias - Flaticon</a>

    return (
        <Marker position={[airport.latitude, airport.longitude]} icon={airportIcon}>
            <Popup>
                {airport.iata == 'EDI' ? "📍 I'm Here!" : ''}
                <div>{airport.name} ({airport.iata})</div>
            </Popup>
        </Marker>)

}

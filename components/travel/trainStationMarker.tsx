"use client";

import L from "leaflet";
import { Marker, Popup } from "react-leaflet";


var airportIcon = L.icon({
    iconUrl: '/images/train.png',
    iconSize:     [38, 38], // size of the icon
    iconAnchor:   [19, 34], // point of the icon which will correspond to marker's location
    popupAnchor:  [0, -30] // point from which the popup should open relative to the iconAnchor
});

export default function TrainStationMarker({
    station
}: any) {
    <a href="https://www.flaticon.com/free-icons/railway" title="railway icons">Railway icons created by riajulislam - Flaticon</a>

    return (
        <Marker position={[station.latitude, station.longitude]} icon={airportIcon}>
            <Popup>
                {station.crs == 'EDI' ? "📍 I'm Here!" : ''}
                <div>{station.name} ({station.crs})</div>
            </Popup>
        </Marker>)


}

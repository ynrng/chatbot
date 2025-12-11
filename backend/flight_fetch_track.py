from datetime import datetime, timedelta
import os
from supabase import create_client, Client
import math
from heapq import heappush, heappop
from dotenv import load_dotenv

import json

from utils import connect_db, fetch_flightaware


def db_select_from_flights(supabase: Client):

    nowstamp = datetime.now()
    early = nowstamp - timedelta(days=10)

    response = (
        supabase.table("Flights")
        .select("*", count="exact")
        .order('scheduled_out', desc=True)
        .gte("scheduled_out", early)
        .lte("scheduled_out", nowstamp)
        .execute()
    )
    print('db_select_from_flights', len(response.data),)
    return response.data

def db_upsert_airport(supabase: Client, airport: dict):
    print("db_upsert_airport:", airport)
    response = (
        supabase.table("Airport")
        .upsert(airport)
        .execute()
    )
    return response

def db_upsert_flights(supabase: Client, flight_new: dict, flight_condition: dict):
    print("db_upsert_flights:", flight_new, ' WHEN ', flight_condition)
    response = (
        supabase.table("Flights")
        .update(flight_new)
        .eq('scheduled_out', flight_condition['scheduled_out'])
        .eq('ident', flight_condition['ident'])
        .execute()
    )
    return response


def db_select_from_flight_track(supabase: Client, id):
    response = (
        supabase.table("FlightTrack")
        .select("*", count="exact")
        .eq('fa_flight_id', id)
        .execute()
    )
    print('db_select_from_flight_track for ', id, len(response.data),)
    return response.data[0] if len(response.data) else None

def db_upsert_flight_track(supabase: Client, track: dict):
    print("db_upsert_flight_track:", track)
    response = (
        supabase.table("FlightTrack")
        .upsert(track)
        .execute()
    )
    return response


def fetch_flight_track(fa_flight_id: str):
    track = fetch_flightaware('/flights/'+fa_flight_id+'/track')

    db_upsert_flight_track(db, {
        'fa_flight_id': fa_flight_id,
        'actual_distance': track.get('actual_distance', 0),
        'positions': track.get('positions', []),
        'created_at': datetime.now().isoformat(),
    })
    return track

def main():

    global db
    db = connect_db()
    flights = db_select_from_flights(db)

    for f in flights:
        print('Flight:', f)
        if f.get('fa_flight_id'):
            tr = db_select_from_flight_track(db, f['fa_flight_id'])
            if tr and len(tr.get('positions', [])) > 0:
                print('Flight track exists, skip.' , f['fa_flight_id'])
            else:
                print('Flight track missing, need fetch.')
                fetch_flight_track(f['fa_flight_id'])

        else:
            da = f.get('scheduled_out')
            q = ''
            start = da.split("T")[0] if da else ""
            if start:
                q += f"&start={start}"
                end = f"{start}T23:59:59Z" if start else ''
                if end:
                    q += f"&end={end}"

            flights = fetch_flightaware('/flights/'+f['ident']+'?ident_type=fa_flight_id' + q)
            print('Fetched flights:', len(flights.get('flights', [])), flights)

            if len(flights.get('flights', [])) > 0:
                fl = flights['flights'][0]
                fa_flight_id = fl.get('fa_flight_id')
                if fa_flight_id:
                    print('Found flight, ID:', fa_flight_id)

                    tr = db_upsert_flights(db, {
                        'fa_flight_id': fa_flight_id,
                        'scheduled_out': fl.get('scheduled_out'),
                        'created_at': datetime.now().isoformat(),
                        'ident': fl.get('ident_iata'),
                    }, {
                        'ident': f['ident'],
                        'scheduled_out': f.get('scheduled_out'),
                    })

                    fetch_flight_track(fa_flight_id)

                for a in [fl.get('origin'), fl.get('destination')]:
                    if a and a.get('code_iata'):
                        db_upsert_airport(db, {
                            'iata': a.get('code_iata'),
                            'name': a.get('name'),
                            'timezone': a.get('timezone'),
                            'created_at': datetime.now().isoformat(),
                        })


if __name__ == "__main__":
    main()

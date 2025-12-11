from datetime import datetime, timedelta
import os
from supabase import create_client, Client
import math
from heapq import heappush, heappop
from dotenv import load_dotenv

import json

from utils import connect_db, fetch_flightaware, airline_iata_map


def db_select_from_flights(supabase: Client):

    response = (
        supabase.table("Flights")
        .select("*", count="exact")
        # .order('scheduled_out', desc=True)
        .execute()
    )
    print('db_select_from_flights', len(response.data),)
    return response.data


def db_upsert_flight(supabase: Client, airport: dict):
    print("db_upsert_flight:", airport)
    response = (
        supabase.table("Flights")
        .update({'ident': airport['ident'], 'ident_iata': airport['ident_iata']})
        .eq('ident',  airport['ident_iata'])
        .execute()
    )
    return response


def main():

    global db
    db = connect_db()
    flights = db_select_from_flights(db)
    for flight in flights:
        if flight.get('ident_iata', None):
            continue
        ident = flight['ident']
        for i1, i2 in airline_iata_map.items():
            if ident.startswith(i1):
                db_upsert_flight(db, {'ident': ident.replace(i1, i2), 'ident_iata': ident})
                break
            if ident.startswith(i2):
                # db_upsert_flight(db, {'ident_iata': ident.replace(i2, i1), 'ident': ident.replace(i2, i1)})

                (
                    db.table("Flights")
                    .update({'ident': ident, 'ident_iata': ident.replace(i2, i1)})
                    .eq('ident',  ident)
                    .execute()
                )
                break


if __name__ == "__main__":
    main()

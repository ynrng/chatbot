import os
from supabase import create_client, Client
import math
from heapq import heappush, heappop
from dotenv import load_dotenv

import json

from utils import connect_db


def db_select_from_station(supabase: Client):

    response = (
        supabase.table("TrainStation")
        .select("*", count="exact")
        .execute()
    )
    stations = {}
    for s in response.data:
        stations[s['crs']] = s
    print("Total stations fetched:", len(stations.keys()))
    return stations


def db_select_from_trains(supabase: Client):

    response = (
        supabase.table("Trains")
        .select("*", count="exact")
        .neq("raw", 'null')
        .eq("transport_mode", 'train')
        .execute()
    )
    stations = {}
    for s in response.data:
        if s['raw']:
            stations[s['origin']] = s['raw']
            stations[s['destination']] = s['raw']
        else:
            print('empty')
    print("Total stations fetched:", len(stations.keys()))
    return stations


def db_upsert_train_station(supabase: Client, tr: dict):
    print('upsert station', tr)
    response = (
        supabase.table("TrainStation")
        .upsert(tr)
        .execute()
    )



def check_origin(crs, raw, tag):
    if raw.get(tag).get('code') == crs:
        origin = raw.get('legs')[0].get(tag)
        station = {
            'name': origin.get('name'),
            'latitude': origin.get('latitude'),
            'longitude': origin.get('longitude'),
            'operator': origin.get('code').split(':')[2] ,
        }
        return station
    return None

def get_info_from_raw(crs, raw: dict):
    s = check_origin(crs, raw, 'origin')
    if not s:
        s = check_origin(crs, raw, 'destination')
    print('s',s)
    return  s


def main():

    load_dotenv('/Users/yan/code/chatbot/.env.local')
    global db
    db = connect_db()
    trains = db_select_from_trains(db)
    stations = db_select_from_station(db)
    for i in trains:
        crs_country = i.split(':')
        if not stations.get(crs_country[0]):
            print('train', i, 'not found in stations')
            station = {
                'crs': crs_country[0],
                'country_code': crs_country[1],
            }
            s = None
            if trains[i]['outward']:
                s = get_info_from_raw(station['crs'], trains[i]['outward'])
            if not s and trains[i]['inward']:
                s = get_info_from_raw(station['crs'], trains[i]['inward'])

            db_upsert_train_station(db, station|s)

    # print('trains', len(trains.keys()), 'stations', len(stations.keys()))


if __name__ == "__main__":
    main()

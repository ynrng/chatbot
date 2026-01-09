import os
from supabase import create_client, Client
import math
from heapq import heappush, heappop
from dotenv import load_dotenv

import json

from utils import connect_db, fetch_rrt
from datetime import datetime, timedelta





def db_select_trains(supabase: Client):
    response = (
        supabase.table("Trains")
        .select("*", count="exact")
        .eq("transport_mode", 'train')
        # .eq("locations", 'null')
        .execute()
    )
    print("Total trains fetched:", len(response.data))
    return response.data


def db_upsert_train(supabase: Client, train: dict):
    print("Upsert train:", train)
    response = (
        supabase.table("Trains")
        .upsert(train)
        .execute()
    )
    return response


def read_into_db_train():
    paths = [
        {"name": "past-scot",   "key": "pastBookings"},
        # {"name": "past",        "key": "pastBookings"},
        # {"name": "upcoming",    "key": "upcomingBookings"},
        # {"name": "upcoming-scot",    "key": "upcomingBookings"},
    ]

    bookings = []

    for p in paths:
        path1 = f'/Users/yan/code/chatbot/public/train/bookings/{p["name"]}.json'
        with open(path1, 'r') as f:
            booking_data = json.load(f)
            bookings += [b.get('booking') for b in booking_data.get(p['key'], {}).get('results', [])]

    print("Total bookings loaded:", len(bookings))
    trains=[]

    for booking in bookings:
        print('Booking ID:', booking['id'])
        if booking['state'] == 'VOIDED':
            # maybe delete from db?
            continue
        outward = booking.get('outward', {})
        inward = booking.get('inward', {})
        legs = []
        if inward:
            if inward.get('openReturn', False):
                for trip in outward.get('legs', []):
                    if trip['destination']['countryCode'] != 'GB' or trip['origin']['countryCode'] != 'GB':
                        continue
                    originTime =  trip['origin']['time'].split("T")
                    carrierCodes = trip['carrierCode'].split(':')
                    train = {
                        'run_date': originTime[0],
                        'destination': trip['origin'].get('crs'),
                        'origin': trip['destination'].get('crs'),
                        'origin_time': '0000',
                        'atoc_code': carrierCodes[-1],
                        'transport_mode': trip['transportMode'],
                    }
                    # if trip.get('timetableId'):
                    #     train['service_uid'] = trip.get('timetableId')
                    trains.append(train)
                    db_upsert_train(db, train)
            else:
                legs += inward.get('legs', [])
        legs += outward.get('legs', [])
        for trip in legs:
            if trip['destination']['countryCode'] != 'GB' or trip['origin']['countryCode'] != 'GB':
                continue
            originTime =  trip['origin']['time'].split("T")
            carrierCodes = trip['carrierCode'].split(':')

            train = {
                'run_date': originTime[0],
                'origin': trip['origin'].get('crs'),
                'origin_time': ''.join(originTime[1].split(':')[0:2]),
                'destination': trip['destination'].get('crs'),
                'destination_time': ''.join(trip['destination']['time'].split('T')[1].split(':')[0:2]),
                # 'locations': '',
                'atoc_code': carrierCodes[-1],
                'transport_mode': trip['transportMode'],
                # 'route_from': '',
                # 'route_to': '',
            }
            if trip.get('timetableId'):
                train['service_uid'] = trip.get('timetableId')
            trains.append(train)
            db_upsert_train(db, train)

    print('all', len(trains))


def fetch_rrt_service(s: dict, record: dict):
    url = f"/json/service/{s['service_uid']}/{s['run_date'].replace('-', '/')}"
    res2 = fetch_rrt(url)

    if res2.get('locations') and len(res2['locations']) > 0:
        start, end = -1, -1
        for i, location in enumerate(res2['locations']):
            if location.get('crs') == record['origin']:
                start = i
            elif location.get('crs') == record['destination']:
                end = i

        if start > -1 and end > start:
            record['locations'] = [
                {'description': loc['description'], 'crs': loc.get('crs')}
                for loc in res2['locations'][start:end + 1]
                if loc.get('crs')
            ]
            record['service_uid'] = res2['serviceUid']
            record['atoc_code'] = res2['atocCode']

            if not record.get('destination_time') or (
                # record.get('destination_time') and
                record['destination_time'] == res2['locations'][end].get('gbttBookedArrival')
            ):
                record['destination_time'] = res2['locations'][end].get('gbttBookedArrival')

        record['route_from'] = res2['locations'][0]['origin'][0].get('description')
        record['route_to'] = res2['locations'][0]['destination'][0].get('description')
        return record

    return None


def fetch_rrt_search(record, ):

    day = datetime.strptime(record['run_date'], '%Y-%m-%d')
    today = datetime.now()

    if abs((day - today).total_seconds()) < 7 * 24 * 60 * 60:  # within 7 days

        url4 = f"/json/search/{record['origin']}/to/{record['destination']}/{record['run_date'].replace('-', '/')}"
        if record['origin_time'] != '0000':
            url4 += f"/{record['origin_time']}"
        res_ser = fetch_rrt(url4)

        if res_ser and res_ser.get('services'):
            if record['origin_time'] == '0000':
                timefiltered = [
                    s for s in res_ser['services']
                    if s.get('serviceUid') and s['atocCode'] == record['atoc_code']
                ]
            else:
                timefiltered = [
                    s for s in res_ser['services']
                    if s.get('serviceUid') and s['locationDetail']['gbttBookedDeparture'] == record['origin_time']
                ]

            if len(timefiltered):
                for s in timefiltered:
                    res2 = fetch_rrt_service({
                        'service_uid': s['serviceUid'],
                        'run_date': s['runDate']
                    }, record)
                    if res2:
                        record = res2
                        return record

    elif day < today:
        url4 = f"/json/search/{record['origin']}/to/{record['destination']}/{today.strftime('%Y/%m/%d')}"
        if record['origin_time'] != '0000':
            url4 += f"/{record['origin_time']}"
        res4 = fetch_rrt(url4)

        if res4 and res4.get('services'):
            timefiltered = [
                s for s in res4['services']
                if s.get('serviceUid') and s['locationDetail']['gbttBookedDeparture'] == record['origin_time']
            ]

            if len(timefiltered) == 0:
                timefiltered = [
                    s for s in res4['services']
                    if s.get('serviceUid') and s['atocCode'] == record['atoc_code']
                ]

            for s in timefiltered:
                res2 = fetch_rrt_service({
                        'service_uid': s['serviceUid'],
                        'run_date': s['runDate']
                    }, record)
                if res2:
                    record = res2
                    return record
    return None



def main():
    load_dotenv('/Users/yan/code/chatbot/.env.local')
    global db
    db = connect_db()

    read_into_db_train()

    records = db_select_trains(db)
    for record in records:
        if record['locations'] is None or len(record['locations']) == 0:
            if record.get('service_uid'):
                re = fetch_rrt_service(record,record)
                if re:
                    db_upsert_train(db, re)
            else:
                print("No service_uid for train:", record)
                re = fetch_rrt_search(record)
                if re:
                    print("Fetched locations for train:", re)
                    db_upsert_train(db, re)


if __name__ == "__main__":
    main()

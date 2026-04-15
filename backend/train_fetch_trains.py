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


def get_platform(p: str):
    u = p['seatReservation']['unallocatedInfoUrl']
    if u.find('scotrail') > -1:
        return 'scotrail'
    if u.find('trainline') > -1:
        return 'trainline'
    # return 'trip.com'
    return ''

def read_into_db_train(paths=[]):

    bookings = []

    for p in paths:
        path1 = f'/Users/yan/code/chatbot/public/train/bookings/{p["name"]}.json'
        with open(path1, 'r') as f:
            booking_data = json.load(f)
            bookings += [b.get('booking') for b in booking_data.get(p['key'], {}).get('results', [])]

    print("Total bookings loaded:", len(bookings))

    for booking in bookings:
        print('Booking ID:', booking['id'])
        if booking['state'] == 'VOIDED':
            # maybe delete from db?
            continue
        outward = booking.get('outward', {})
        inward = booking.get('inward', {})
        # legs = []
        # eutrain = {}

        if inward:
            if inward.get('openReturn', False):
                for trip in outward.get('legs', []):
                    originTime =  trip['origin']['time'].split("T")
                    carrierCodes = trip['carrierCode'].split(':')
                    train = {
                        'run_date': originTime[0],
                        'destination': trip['origin'].get('crs'),
                        'origin': trip['destination'].get('crs'),
                        'origin_time': '0000',
                        'atoc_code': carrierCodes[-1],
                        'transport_mode': trip['transportMode'],
                        'id': trip['id']+'-1',
                        'platform': get_platform(trip),
                        'raw': booking,
                    }
                    db_upsert_train(db, train)
            else:
                form_train_from_legs(booking, inward)
        if outward:
            form_train_from_legs(booking, outward)

intl_crs_map = {
    'LON:GB': 'STP:GB',
}

def form_train_from_legs(booking, outward):
    for trip in outward.get('legs', []):
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
            'id': trip['id'],
            'platform': get_platform(trip),
            'raw': booking,
        }
        if  booking['isEuBooking']:
            train = train | {
                'destination': outward['destination'].get('code') + ":" + trip['destination'].get('countryCode'),
                'origin':  outward['origin'].get('code') + ":" + trip['origin'].get('countryCode'),
                'route_from': outward['origin'].get('name'),
                'route_to': outward['destination'].get('name'),
            }

            train['origin'] = intl_crs_map.get(train['origin'], train['origin'])
            train['destination'] = intl_crs_map.get(train['destination'], train['destination'])


        if trip.get('timetableId'):
            train['service_uid'] = trip.get('timetableId')
    db_upsert_train(db, train)


def fetch_rrt_service(s: dict, record: dict):
    url = f"/json/service/{s['service_uid']}/{s['run_date'].replace('-', '/')}"
    res2 = fetch_rrt(url)

    if res2.get('locations') and len(res2['locations']) > 0:
        start, end = -1, -1
        for i, location in enumerate(res2['locations']):
            if location.get('crs') == get_intl_crs(record['origin']):
                start = i
            elif location.get('crs') == get_intl_crs(record['destination']):
                end = i

        if start > -1 and end > start:
            record['locations'] = [
                {'description': loc['description'], 'crs': loc.get('crs'), 'isCall': loc.get('isCall')}
                for loc in res2['locations'][start:end + 1]
                # if loc.get('crs') and loc.get('isCall')
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

def get_intl_crs(crs: str):
    return crs.split(':')[0]

def fetch_rrt_search(record, ):

    # if eurostar
    is_eurostar = False
    if record['origin'].index(':') > -1 or record['destination'].index(':') > -1:
        print('eurostar:', record['origin'], 'to', record['destination'])
        is_eurostar = True


    day = datetime.strptime(record['run_date'], '%Y-%m-%d')
    today = datetime.now()

    if abs((day - today).total_seconds()) < (40 if is_eurostar else 7) * 24 * 60 * 60:  # within 7 days

        url4 = f"/json/search/{get_intl_crs(record['origin'])}/to/{get_intl_crs(record['destination'])}/{record['run_date'].replace('-', '/')}"
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
        url4 = f"/json/search/{get_intl_crs(record['origin'])}/to/{get_intl_crs(record['destination'])}/{today.strftime('%Y/%m/%d')}"
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


def read_trip_com_into_db():

    data = {}

    path1 = f'/Users/yan/code/chatbot/public/train/bookings/trip.com.json'
    with open(path1, 'r') as f:
        booking_data = json.load(f)
        data = booking_data.get('data')

    # for trains in bookings:
    orderId = data['orderId']

    for trip in data['outJourney'] + data.get('returnJourney', []):
        for seg in trip['segments']:
            originTime =  seg['departureDateTime'].split(" ")
            train = {
                'run_date': seg['dateType'],
                'destination': seg['arrivalLocation'].get('name'),
                'origin': seg['departureLocation'].get('name'),
                'origin_time': ''.join(originTime[1].split(':')[0:2]),
                'atoc_code': seg['transport']['carrier']['code'],
                'transport_mode': seg['transport']['type'].lower(),
                'id': orderId + f"-{seg['segmentId']}",
                'platform': 'trip.com'
            }
            print("Upserting trip.com train:", train)

def read_tranpal_into_db():

    p = f'/Users/yan/code/chatbot/public/train/bookings/trainpal.json'
    with open(p, 'r') as f:
        booking_data = json.load(f)
        orders = booking_data.get('data', {}).get('orders', [])
        for trip in orders:
            originTime =  trip['departureTime'].split(" ")
            # carrierCodes = trip['arrivalTime'].split(' ')
            train = {
                'run_date': originTime[0],
                'destination': 'EDB',
                'origin': "BHM",
                'origin_time': originTime[1].replace(':', ''),
                # 'atoc_code': carrierCodes[-1],
                'transport_mode': 'train' if trip.get('businessType', '').index('train') > -1 else trip.get('businessType', ''),
                'id': str(trip['orderId']),
                'platform': 'tranpal',
                'raw': trip,
            }
            db_upsert_train(db, train)


def main():
    load_dotenv('/Users/yan/code/chatbot/.env.local')
    global db
    db = connect_db()


    paths = [
        # {"name": "past-scot",   "key": "pastBookings"},
        # {"name": "upcoming-scot",    "key": "upcomingBookings"},
        # {"name": "past-trainline",        "key": "pastBookings"},
        {"name": "upcoming-trainline",    "key": "upcomingBookings"},

    ]

    read_into_db_train(paths)
    # read_tranpal_into_db()

    # read_trip_com_into_db()

    records = db_select_trains(db)
    for record in records:
        if record['locations'] is None or len(record['locations']) == 0:
            if record.get('service_uid') and record['origin'].index(':')==-1:
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

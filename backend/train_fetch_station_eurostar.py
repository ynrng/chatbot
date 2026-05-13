
from supabase import Client
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
        .order('updated_at', desc=True)
        .execute()
    )
    stations = {}
    inter_stations = []
    for s in response.data:
        if s['raw']:
            stations[s['origin']] = s['raw']
            stations[s['destination']] = s['raw']
        else:
            print('empty', stations[s['origin']], stations[s['destination']])

    for s in response.data:
        if s['locations']:
            for l in s['locations']:
                if l.get('isCall') != False and not stations.get(l['crs']):
                    inter_stations.append(l)

    print("Total stations fetched:", len(stations.keys()))
    return stations, inter_stations


def main():

    load_dotenv('/Users/yan/code/chatbot/.env.local')
    global db
    db = connect_db()
    trains, inter_stations = db_select_from_trains(db)
    stations = db_select_from_station(db)
    inter_stations = [s for s in inter_stations if not stations.get(s['crs'])]
    inter_stations_set = dict()
    for s in inter_stations:
        # merge the existing entry (if any) with the new station dict
        inter_stations_set[s['crs']] = {**inter_stations_set.get(s['crs'], {}), **s}
    print('TODO fetching', inter_stations_set)

    with open('/Users/yan/code/chatbot/public/train/osm/eurostar.geojson', 'r') as f:
        eurostar_geojson = f.read()
        eurostar_geos = json.loads(eurostar_geojson)
    features = [f for f in eurostar_geos.get('features', []) if f['id'].startswith('node') and f['properties'].get('railway') == 'stop' and f['properties'].get(
        '@relations') and f['properties'].get('@relations')[0].get('reltags', {}).get('operator', '').startswith('Eurostar')]

    # write features into file
    with open('/Users/yan/code/chatbot/public/train/osm/eurostar_features.geojson', 'w') as f:
        json.dump(features, f)

    print('eurostar features', len(eurostar_geos.get('features', [])), len(features),)


if __name__ == "__main__":
    main()

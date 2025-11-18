import os
from supabase import create_client, Client
import math
from heapq import heappush, heappop
from dotenv import load_dotenv

import json

from db import connect_db

def db_select_from_train(supabase: Client):

    response = (
        supabase.table("Trains")
        .select("*", count="exact")
        .neq("locations", 'null')
        .eq("transport_mode", 'train')
        .order('run_date', desc=True)
        .execute()
    )
    t = [v['locations'] for v in response.data]
    print('db_select_from_train',len(t), t[0])
    return t


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


def db_select_train_legs_by(supabase: Client, from_crs: str, to_crs: str):

    response = (
        supabase.table("TrainLegs")
        .select("*", count="exact")
        .eq("start", from_crs)
        .eq("end", to_crs)
        .execute()
    )
    if response.data and len(response.data) > 0:
        a = response.data
        a.sort(key=lambda x: len(x['segments']), reverse=True)
        return a[0]
    return None

def db_upsert_train_leg(supabase: Client, leg: dict):
    response = (
        supabase.table("TrainLegs")
        .upsert(leg)
        .execute()
    )
    return response

def overpass_to_graph(elements: list):
    nodes = {}
    edges = {}

    for el in elements:
        if el["type"] == "way" and el['tags'].get('railway') == 'rail':
            for i in range(len(el["nodes"])-1):
                a = el["nodes"][i]
                b = el["nodes"][i+1]

                nodes[a] = el['geometry'][i]
                nodes[b] = el['geometry'][i+1]

                if not edges.get(a):
                    edges[a] = []
                if not edges.get(b):
                    edges[b] = []

                dist = haversine(nodes[a], nodes[b])
                edges[a].append({"node": b, "weight": dist})
                edges[b].append({"node": a, "weight": dist})
    print("Graph built with", len(nodes.keys()), "nodes and", len(edges.keys()), "edges.")

    return nodes, edges


def haversine(a, b):
    """Distance in meters between node a and node b."""
    lat1, lon1 = a.get('lat'), a.get('lon')
    lat2, lon2 = b.get('lat'), b.get('lon')
    R = 6371e3
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    x = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dl/2)**2
    return 2*R*math.atan2(math.sqrt(x), math.sqrt(1-x))


def astar(nodes, edges, start, goal):
    pq = [(0, start)]
    g = {start: 0}
    prev = {}

    def h(n):
        return haversine(nodes[n], nodes[goal])

    f = {start: h(start)}

    while pq:
        _, node = heappop(pq)
        if node == goal:
            break

        for i in edges[node]:
            # for nxt, w in i:
            nxt = i['node']
            new_g = g[node] + i['weight']
            if nxt not in g or new_g < g[nxt]:
                g[nxt] = new_g
                f[nxt] = new_g + h(nxt)
                prev[nxt] = node
                heappush(pq, (f[nxt], nxt))

    # Reconstruct path
    path = []
    cur = goal
    while cur in prev:
        path.append(cur)
        cur = prev[cur]
    path.append(start)
    path.reverse()
    return path, g.get(goal, float("inf"))


def nearest_node(lat, lon, nodes):
    best = None
    bestDist = 9999999

    for (id, n) in nodes.items():
        d = (n['lat'] - lat) ** 2 + (n['lon'] - lon) ** 2
        d = haversine({'lat': lat, 'lon': lon}, n)
        if d < bestDist:
            best = id
            bestDist = d
    return best


def get_path_between_stations(locations: list, nodes, edges):
    B = locations[0]
    end = nearest_node(B['latitude'], B['longitude'], nodes)
    for i in range(len(locations)-1):
        A = B
        B = locations[i+1]
        leg = db_select_train_legs_by(db, A['crs'], B['crs'])
        if leg and leg.get('segments') and len(leg['segments']) > 2: # have more than start and end stations
            continue

        start = end
        end = nearest_node(B['latitude'], B['longitude'], nodes)

        p, c = astar(nodes, edges, start, end)

        seg =  [[nodes[id]['lon'], nodes[id]['lat']] for id in p]
        if len(seg) > 2:
            print({"start": A['crs'], "end": B['crs'], "segments": len(seg)})
            db_upsert_train_leg(db, {
                "start": A['crs'],
                "end": B['crs'],
                "segments": seg,
                "created_at": "now()"
            })
        else:
            print("!!!No path found between", A['crs'], "and", B['crs'])



def main():

    load_dotenv('/Users/yan/code/chatbot/.env.local')
    global db
    db = connect_db()
    trains = db_select_from_train(db)
    stations = db_select_from_station(db)
    locations = [[s.get('crs')  for s in t if s.get('crs') in stations] for t in trains]
    locations = [loc for sublist in locations for loc in sublist if loc]
    print("Total train routes to process:", locations)
    # with open('/Users/yan/code/chatbot/public/train/osm/rail.uk.json', 'r') as f:
    #     osm_data = json.load(f)

    # nodes, edges = overpass_to_graph(osm_data['elements'])
    # # paths = []
    # for l in locations:
    #     get_path_between_stations(l, nodes, edges)
        # print("Path found with", len(path), "edges.")


if __name__ == "__main__":
    main()

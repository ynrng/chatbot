
import os
from datetime import datetime, timezone
from supabase import create_client, Client
from dotenv import load_dotenv
from requests.auth import HTTPBasicAuth
import requests

from rate_limiter import api_rate_limiter, rate_limited

airline_iata_map = {
    '9C': 'CQH',
    'AF': 'AFR',  # Air France
    'CA': 'CCA',
    'HU': 'CHH',
    'DS': 'EZS',  # Easyjet
    'U2': 'EZY',  # Easyjet
    'EK': 'UAE',  # Emirates
    'EW': 'EWG',  # Eurowings
    'FM': 'CSH',  # Shanghai Airlines
    'HO': 'DKH',  # Juneyao Airlines
    'JD': 'CBJ',  # Beijing Capital Airlines
    'KL': 'KLM',  # KLM
    'LH': 'DLH',  # Lufthansa
    'MF': 'CXA',  # XiamenAir
    'MM': 'APJ',  # Peach Aviation
    'MU': 'CES',  # China Eastern
    'RK': 'RUK',  # Ryanair
    'FR': 'RYR',  # Ryanair
    'CZ': 'CZN',  # China Southern Airlines
    'SQ': 'SIA',  # Singapore Airlines
    'W9': 'WUK',  # Wizz Air
    'Z2': 'APG',  # Philippines AirAsia
    'ZH': 'CSZ',  # Shenzhen Airlines
}


def connect_db():
    load_dotenv('/Users/yan/code/chatbot/.env.local')
    url: str = os.getenv("SUPABASE_URL")
    key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    print("Connecting to Supabase with URL:", url)
    supabase: Client = create_client(url, key)

    return supabase


def fetch_rrt(url: str):
    load_dotenv('/Users/yan/code/chatbot/.env.local')
    user: str = os.getenv("RRT_API_USER")
    pwd: str = os.getenv("RRT_API_PWD")
    auth = HTTPBasicAuth(user, pwd)

    response = requests.get('https://api.rtt.io/api/v1'+url, auth=auth)
    print('fetch_rrt', 'https://api.rtt.io/api/v1'+url)

    if response.ok:
        return response.json()
    else:
        raise requests.HTTPError("Request to {} failed ({}, {})".format(url, response.status_code, response.reason))

rrt_token = ''
rrt_token_valid_until = "2026-05-12T02:42:48+00:00"

def fetch_rrt_auth_new():
    global rrt_token, rrt_token_valid_until
    valid_until = datetime.fromisoformat(rrt_token_valid_until)
    if rrt_token and valid_until > datetime.now(timezone.utc):
        return rrt_token
    load_dotenv('/Users/yan/code/chatbot/.env.local')
    headers = {
        "accept": "application/json",
        "Authorization": f"Bearer {os.environ['RRT_IO_TOKEN']}",
    }
    url = 'https://data.rtt.io/api/get_access_token'
    response = requests.get(url, headers=headers)
    print('fetch_rrt_new', url)
    if response.ok:
        data= response.json()
        rrt_token = data.get('token')
        rrt_token_valid_until = data.get('validUntil')
        return rrt_token
    else:
        raise requests.HTTPError("Request to {} failed ({}, {})".format(url, response.status_code, response.reason))


def fetch_rrt_new(url: str, params: dict = {}):
    rrt_token = fetch_rrt_auth_new()
    headers = {
        "accept": "application/json",
        "Authorization": f"Bearer {rrt_token}",
    }
    response = requests.get('https://data.rtt.io' + url, params=params, headers=headers)
    print('fetch_rrt_new', 'https://data.rtt.io' + url)
    if response.ok:
        return response.json()
    else:
        raise requests.HTTPError("Request to {} failed ({}, {})".format(url, response.status_code, response.reason))


@rate_limited
def fetch_flightaware(url: str):
    load_dotenv('/Users/yan/code/chatbot/.env.local')
    api_key: str = os.getenv("AERO_API_KEY")

    if not api_key:
        raise ValueError("Server configuration error: missing AERO_API_KEY")

    print('[fetch]flightaware:', 'https://aeroapi.flightaware.com/aeroapi' + url)

    headers = {
        'x-apikey': api_key
    }

    response = requests.get('https://aeroapi.flightaware.com/aeroapi' + url, headers=headers)

    if response.ok:
        return response.json()
    else:
        raise requests.HTTPError("Request to {} failed ({}, {})".format(url, response.status_code, response.reason))

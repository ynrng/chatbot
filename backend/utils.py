
import os
from supabase import create_client, Client
from dotenv import load_dotenv
from requests.auth import HTTPBasicAuth
import requests

from rate_limiter import api_rate_limiter, rate_limited


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

    response = requests.get('https://aeroapi.flightaware.com/aeroapi' + url, headers=headers )

    if response.ok:
        return response.json()
    else:
        raise requests.HTTPError("Request to {} failed ({}, {})".format(url, response.status_code, response.reason))

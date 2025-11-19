
import os
from supabase import create_client, Client
import math
from heapq import heappush, heappop
from dotenv import load_dotenv

import json

def connect_db():
    load_dotenv('/Users/yan/code/chatbot/.env.local')
    url: str = os.getenv("SUPABASE_URL")
    key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    print("Connecting to Supabase with URL:", url)
    supabase: Client = create_client(url, key)

    return supabase

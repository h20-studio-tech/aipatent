import os
from fastapi import FastAPI
from supabase import create_client, Client

url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_SECRET_KEY")
supabase: Client = create_client(url, key)



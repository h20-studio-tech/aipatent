import os
import lancedb
from lancedb.db import DBConnection
from contextlib import asynccontextmanager
from fastapi import FastAPI

db = lancedb.connect("server/data/lancedb")



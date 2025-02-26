import lancedb
from lancedb.pydantic import LanceModel

uri = "app/data/lancedb"
db = lancedb.connect(uri)

class Schema(LanceModel):
    record_id: str
    text: str
db.create_table("document", schema=Schema)
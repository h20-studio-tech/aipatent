from typing import Any
from pydantic import BaseModel, Field

class StructuredDocument(BaseModel):
    df: Any = Field(..., title="The structured data frame", description="The structured data frame resulting from the unstructured data processing")
    filename: str = Field(..., title="The name of the file", description="The name of the file processed")
    
    
class Chunk(BaseModel):
    element_id: str
    text: str
    page_number: int
    filename: str
    chunk_id: int
    
class ChunkReview(BaseModel):
    relevant: bool
    
class ReviewedChunk(BaseModel):
    element_id: str
    text: str
    page_number: int
    filename: str
    chunk_id: int
    relevant: bool
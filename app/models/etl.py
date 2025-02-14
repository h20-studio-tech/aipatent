from typing import Any
from pydantic import BaseModel, Field

class StructuredDocument(BaseModel):
    df: Any = Field(..., title="The structured data frame", description="The structured data frame resulting from the unstructured data processing")
    filename: str = Field(..., title="The name of the file", description="The name of the file processed")
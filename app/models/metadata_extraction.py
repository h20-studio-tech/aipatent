import logging
from typing import Literal 
import instructor
import time

from openai import OpenAI
from pydantic import BaseModel, Field

class Extraction(BaseModel):
    method: list[str] = Field(
        default_factory=list, 
        description="method or methods observed/applied in the document. E.g., gene editing, CRISPR, PCR, fermentation, etc")
    hypothetical_questions: list[str] = Field(
        default_factory=list,
        description="Hypothetical questions that this document could answer",
    ) 
    keywords: list[str] = Field(
        default_factory=list, description="Biology related keywords that this document is about or MeSH headings for p apers"
    ) 
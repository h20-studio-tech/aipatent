from pydantic import BaseModel, Field
from typing import Optional, List

class Technology(BaseModel):
    """
    Input values for our patent draft
    
    args:
        target_antigen: The target antigen for the technology
        disease: The disease for the technology, more than one disease is possible
    """
    target_antigen: str = Field(..., description="The target antigen for the technology")
    disease: List[str] = Field(..., description="The disease for the technology, more than one disease is possible")

class PrimaryInvention(BaseModel):
    text: str = Field(..., description="the redacted primary invention section for the patent draft")


from pydantic import BaseModel, Field
from typing import Optional, List

class Technology(BaseModel):
    """
    Input values for our patent draft
    
    args:
        target_antigen: The target antigen for the technology
        disease: The disease for the technology, more than one disease is possible
    """
    target_antigen: str = Field(..., description="The target antigen for the technology. Only generate antigens associated with Immunoglobulin Y")
    disease: List[str] = Field(..., description="The disease for the technology, more than one disease is possible. Only generate diseases that Immunoglobulin Y has the potential to cure")

class PrimaryInvention(BaseModel):
    prediction: str | None  = Field(..., description="the redacted primary invention section for the patent draft")
    trace_id: str = Field(..., description="the langfuse trace id for the primary invention generation")

class FieldOfInvention(BaseModel):
    prediction: str | None = Field(..., description="the redacted field of invention section for the patent draft")
    trace_id: str = Field(..., description="the langfuse trace id for the field of invention generation")

class BackgroundAndNeed(BaseModel):
    prediction: str | None = Field(..., description="the redacted background and need section for the patent draft")
    trace_id: str = Field(..., description="the langfuse trace id for the background and need generation")

class BriefSummary(BaseModel):
    prediction: str = Field(..., description="the redacted brief summary section for the patent draft")
    trace_id: str = Field(..., description="the langfuse trace id for the brief summary generation")

class TechnologyPlatform(BaseModel):
    prediction: str = Field(..., description="the redacted technology platform section for the patent draft")
    trace_id: str = Field(..., description="the langfuse trace id for the technology platform generation")

class DescriptionOfInvention(BaseModel):
    prediction: str = Field(..., description="the redacted description of invention section for the patent draft")
    trace_id: str = Field(..., description="the langfuse trace id for the description of invention generation")

class ProductOrProducts(BaseModel):
    prediction: str = Field(..., description="the redacted product section for the patent draft")
    trace_id: str = Field(..., description="the langfuse trace id for the product generation")

class Uses(BaseModel):
    prediction: str = Field(..., description="the redacted uses section for the patent draft")
    trace_id: str = Field(..., description="the langfuse trace id for the uses generation")


                            





import logging 
import instructor
import time

from openai import OpenAI
from pydantic import BaseModel, Field
from pprint import pprint
from collections.abc import Iterable

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s.%(msecs)03d - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

client = instructor.from_openai(OpenAI())

class Extraction(BaseModel):
    method: list[str] = Field(
        default_factory=list, 
        description="method or methods observed/applied in the document. E.g., gene editing, CRISPR, PCR, fermentation, etc")
    hypothetical_questions: list[str] = Field(
        default_factory=list,
        description="Hypothetical questions that this document could answer",
    )
    keywords: list[str] = Field(
        default_factory=list, description="Biology related keywords that this document is about or MeSH headings for papers"
    )
    
    
# testing on chunk id 4 of the graft-versus-host disease (GVHD) paper 
text_chunk = """

bloodstream infection in allo-HCT patients (5, 8). Patients with severe graft-versus-host disease (GVHD) after allo-HCT have poor outcomes 
with only ~30% long-term survival (9). Gut microbiota perturbations caused by broad-spectrum antibiotics and a reduction 
in microbial diversity are associated with in- creased transplant-related mortality and lethal GVHD in humans and mice (10–13). 
Besides causing infections, experimental studies in gno- tobiotic mice have revealed that enterococci play an important role in 
colitis (14) by stimulat- ing antigen-presenting cells and CD4+RORg+ T cell infiltration, causing intestinal inflam- mation (15). 
In this study, we investigated the role of enterococci in the development of acute GVHD, both in allo-HCT patients and preclinical allo-HCT mouse models.

"""

model: str = "gpt-3.5-turbo"
logging.info("start")
start_time = time.perf_counter()
extractions = client.chat.completions.create(
    model=model,
    response_model=Extraction,
    messages=[
        {
            "role": "system",
            "content": "Your role is to extract data from the following document and create a set of topics.",
        },
        {"role": "user", "content": text_chunk},
    ],
)
elapsed_time = time.perf_counter() - start_time
logging.info(f"Elapsed time: {elapsed_time:.3f} seconds with model: {model}")
pprint(extractions.model_dump())
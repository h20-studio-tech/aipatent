import uuid
import sys

from datetime import datetime

from langfuse import Langfuse
from openai import OpenAI
from models.llm import (
    PrimaryInvention,
    FieldOfInvention,
    BackgroundAndNeed,
    BriefSummary,
    DiseaseOverview,
    TargetOverview,
    HighLevelConcept,
    UnderlyingMechanism,
    Embodiment,
    Claims,
    Abstract,
    KeyTerms,

)

from utils.utils import values_to_json

langfuse = Langfuse()


class ProgressTracker:

    def __init__(self):
        self.counter = 0

    async def update(self, total_tasks):
        self.counter += 1
        progress = (self.counter / total_tasks) * 100
        sys.stdout.write(
            f"\rProgress: {self.counter}/{total_tasks} tasks completed ({progress:.2f}%)"
        )
        sys.stdout.flush()


progress_tracker = ProgressTracker()


def generate_field_of_invention(
    innovation: str, 
    technology: str,
    approach: str, 
    antigen: str, 
    disease: str, 
    model: str = "o1-preview") -> FieldOfInvention:
    client = OpenAI()

    if not antigen or not disease:
        raise ValueError("Disease and antigen must be non-empty strings")

    trace_id = str(uuid.uuid4())
    trace = langfuse.trace(
        id=trace_id,
        name=f"generate_field_of_invention_{model}",
        input=values_to_json(
        technology=technology, 
        antigen=antigen, 
        disease=disease,
        innovation=innovation,
        approach=approach        ),
        tags=["evaluation"],
    )
    fetch_prompt = trace.span(name="fetch_prompt", start_time=datetime.now())
    raw_prompt = langfuse.get_prompt("generate_field_of_invention")
    prompt = raw_prompt.compile(
        technology=technology, 
        antigen=antigen, 
        disease=disease,
        innovation=innovation,
        approach=approach    )
    fetch_prompt.end(
        end_time=datetime.now(),
        input=values_to_json(
            technology=technology, 
            antigen=antigen, 
            disease=disease,
            innovation=innovation,
            approach=approach
        ),
        output=raw_prompt,
    )
    generation = trace.generation(
        name="field_of_invention",
        input=prompt,
        completion_start_time=datetime.now(),
        model=model,
    )
    response = client.chat.completions.create(
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
        model=model,
    )

    generation.end(
        output=response.choices[0].message.content,
        end_time=datetime.now(),
        usage=response.usage,
        metadata={"prompt_usage": response.usage},
        model=model,
    )

    trace.update(
        status_message="Generation completed",
        output=response.choices[0].message.content,
        metadata={"prompt_usage": response.usage},
    )

    return FieldOfInvention(
        prediction=response.choices[0].message.content, trace_id=trace_id
    )


def generate_background(
    innovation: str, 
    technology: str,
    approach: str, 
    antigen: str, 
    disease: str, 
    model: str = "o1-preview") -> BackgroundAndNeed:

    client = OpenAI()
    if not antigen or not disease:
        raise ValueError("Disease and antigen must be non-empty strings")

    trace_id = str(uuid.uuid4())
    trace = langfuse.trace(
        id=trace_id,
        name=f"generate_background_and_need_{model}",
        input=values_to_json(
        technology=technology, 
        antigen=antigen, 
        disease=disease,
        innovation=innovation,
        approach=approach        ),
        tags=["evaluation"],
    )
    fetch_prompt = trace.span(name="fetch_prompt", start_time=datetime.now())
    raw_prompt = langfuse.get_prompt("generate_background")
    prompt = raw_prompt.compile(
        technology=technology, 
        antigen=antigen, 
        disease=disease,
        innovation=innovation,
        approach=approach    )
    fetch_prompt.end(
        end_time=datetime.now(),
        input=values_to_json(
        technology=technology, 
        antigen=antigen, 
        disease=disease,
        innovation=innovation,
        approach=approach        ),
        output=raw_prompt,
    )

    generation = trace.generation(
        name="background_and_need",
        input=prompt,
        completion_start_time=datetime.now(),
        model=model,
    )
    response = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}], model=model
    )
    generation.end(
        output=response.choices[0].message.content,
        end_time=datetime.now(),
        usage=response.usage,
        metadata={"prompt_usage": response.usage},
        model=model,
    )

    trace.update(
        status_message="Generation completed",
        output=response.choices[0].message.content,
        metadata={"prompt_usage": response.usage},
    )
    return BackgroundAndNeed(
        prediction=response.choices[0].message.content, trace_id=trace_id
    )


def generate_summary(
    innovation: str, 
    technology: str,
    approach: str, 
    antigen: str, 
    disease: str, 
    model: str = "o1-preview") -> BriefSummary:
    client = OpenAI()
    if not antigen or not disease:
        raise ValueError("Disease and antigen must be non-empty strings")

    trace_id = str(uuid.uuid4())
    trace = langfuse.trace(
        id=trace_id,
        name=f"generate_brief_summary_{model}",
        input=values_to_json(
        technology=technology, 
        antigen=antigen, 
        disease=disease,
        innovation=innovation,
        approach=approach            ),
        tags=["evaluation"],
    )
    fetch_prompt = trace.span(name="fetch_prompt", start_time=datetime.now())
    raw_prompt = langfuse.get_prompt("generate_brief_summary")
    prompt = raw_prompt.compile(
        technology=technology, 
        antigen=antigen, 
        disease=disease,
        innovation=innovation,
        approach=approach        )
    fetch_prompt.end(
        end_time=datetime.now(),
        input=values_to_json(
        technology=technology, 
        antigen=antigen, 
        disease=disease,
        innovation=innovation,
        approach=approach            ),
        output=raw_prompt,
    )

    generation = trace.generation(
        name="brief_summary",
        input=prompt,
        completion_start_time=datetime.now(),
        model=model,
    )
    response = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}], model=model
    )

    generation.end(
        output=response.choices[0].message.content,
        end_time=datetime.now(),
        usage=response.usage,
        metadata={"prompt_usage": response.usage},
        model=model,
    )

    trace.update(
        status_message="Generation completed",
        output=response.choices[0].message.content,
        metadata={"prompt_usage": response.usage},
    )

    return BriefSummary(
        prediction=response.choices[0].message.content, trace_id=trace_id
    )


def generate_target_overview(
    innovation: str, 
    technology: str,
    approach: str, 
    antigen: str, 
    disease: str, 
    model: str = "o1-preview") -> TargetOverview:
    client = OpenAI()
    if not antigen or not disease:
        raise ValueError("Disease and antigen must be non-empty strings")

    trace_id = str(uuid.uuid4())
    trace = langfuse.trace(
        id=trace_id,
        name="generate_target_overview",
        input=values_to_json(
        technology=technology, 
        antigen=antigen, 
        disease=disease,
        innovation=innovation,
        approach=approach        ),
        tags=["evaluation"],
    )
    fetch_prompt = trace.span(name="fetch_prompt", start_time=datetime.now())
    raw_prompt = langfuse.get_prompt("generate_target_overview")
    prompt = raw_prompt.compile(
        technology=technology, 
        antigen=antigen, 
        disease=disease,
        innovation=innovation,
        approach=approach    )
    fetch_prompt.end(
        end_time=datetime.now(),
        input=values_to_json(
        technology=technology, 
        antigen=antigen, 
        disease=disease,
        innovation=innovation,
        approach=approach        ),
        output=raw_prompt,
    )

    generation = trace.generation(
        name="target_overview",
        input=prompt,
        completion_start_time=datetime.now(),
        model=model,
    )

    response = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}], model=model
    )
    generation.end(
        output=response.choices[0].message.content,
        end_time=datetime.now(),
        usage=response.usage,
        metadata={"prompt_usage": response.usage},
        model=model,
    )

    trace.update(
        status_message="Generation completed",
        output=response.choices[0].message.content,
        metadata={"prompt_usage": response.usage},
    )

    return TargetOverview(
        prediction=response.choices[0].message.content, trace_id=trace_id
    )


def generate_high_level_concept(
    innovation: str, 
    technology: str,
    approach: str, 
    antigen: str, 
    disease: str, 
    model: str = "o1-preview") -> HighLevelConcept:
    client = OpenAI()
    if not antigen or not disease:
        raise ValueError("Disease and antigen must be non-empty strings")

    trace_id = str(uuid.uuid4())
    trace = langfuse.trace(
        id=trace_id,
        name="generate_high_level_concept",
        input=values_to_json(
        technology=technology, 
        antigen=antigen, 
        disease=disease,
        innovation=innovation,
        approach=approach        ),
        tags=["evaluation"],
    )
    fetch_prompt = trace.span(name="fetch_prompt", start_time=datetime.now())
    raw_prompt = langfuse.get_prompt("generate_high_level_concept")
    prompt = raw_prompt.compile(
        technology=technology, 
        antigen=antigen, 
        disease=disease,
        innovation=innovation,
        approach=approach    )
    fetch_prompt.end(
        end_time=datetime.now(),
        input=values_to_json(
        technology=technology, 
        antigen=antigen, 
        disease=disease,
        innovation=innovation,
        approach=approach        ),
        output=raw_prompt,
    )

    generation = trace.generation(
        name="high_level_concept",
        input=prompt,
        completion_start_time=datetime.now(),
        model=model,
    )

    response = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}], model=model
    )
    generation.end(
        output=response.choices[0].message.content,
        end_time=datetime.now(),
        usage=response.usage,
        metadata={"prompt_usage": response.usage},
        model=model,
    )

    trace.update(
        status_message="Generation completed",
        output=response.choices[0].message.content,
        metadata={"prompt_usage": response.usage},
    )

    return HighLevelConcept(
        prediction=response.choices[0].message.content, trace_id=trace_id
    )


def generate_underlying_mechanism(
    innovation: str, 
    technology: str,
    approach: str, 
    antigen: str, 
    disease: str, 
    model: str = "o1-preview"
) -> UnderlyingMechanism:
    client = OpenAI()
    if not antigen or not disease:
        raise ValueError("Disease and antigen must be non-empty strings")

    trace_id = str(uuid.uuid4())
    trace = langfuse.trace(
        id=trace_id,
        name="generate_underlying_mechanism",
        input=values_to_json(
        technology=technology, 
        antigen=antigen, 
        disease=disease,
        innovation=innovation,
        approach=approach),
        tags=["evaluation"],
    )
    fetch_prompt = trace.span(name="fetch_prompt", start_time=datetime.now())
    raw_prompt = langfuse.get_prompt("generate_underlying_mechanism")
    prompt = raw_prompt.compile(
        technology=technology, 
        antigen=antigen, 
        disease=disease,
        innovation=innovation,
        approach=approach    )
    fetch_prompt.end(
        end_time=datetime.now(),
        input=values_to_json(
        technology=technology, 
        antigen=antigen, 
        disease=disease,
        innovation=innovation,
        approach=approach        ),
        output=raw_prompt,
    )

    generation = trace.generation(
        name="underlying_mechanism",
        input=prompt,
        completion_start_time=datetime.now(),
        model=model,
    )

    response = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}], model=model
    )
    generation.end(
        output=response.choices[0].message.content,
        end_time=datetime.now(),
        usage=response.usage,
        metadata={"prompt_usage": response.usage},
        model=model,
    )

    trace.update(
        status_message="Generation completed",
        output=response.choices[0].message.content,
        metadata={"prompt_usage": response.usage},
    )

    return UnderlyingMechanism(
        prediction=response.choices[0].message.content, trace_id=trace_id
    )

def generate_embodiment(
    previous_embodiment: str, 
    innovation: str, 
    technology: str,
    approach: str, 
    antigen: str, 
    disease: str, 
    model: str = "o1-preview"
) -> Embodiment:
    client = OpenAI()
    if not antigen or not disease:
        raise ValueError("Disease and antigen must be non-empty strings")

    trace_id = str(uuid.uuid4())
    trace = langfuse.trace(
        id=trace_id,
        name="generate_embodiment",
        input=values_to_json(
            previous_embodiment=previous_embodiment, 
            innovation=innovation, 
            technology=technology, 
            antigen=antigen, 
            disease=disease
        ),
        tags=["evaluation"],
    )
    fetch_prompt = trace.span(name="fetch_prompt", start_time=datetime.now())
    raw_prompt = langfuse.get_prompt("generate_embodiment")
    prompt = raw_prompt.compile(
        technology=technology, 
        antigen=antigen, 
        disease=disease, 
        innovation=innovation,
        approach=approach, 
        previous_embodiment=previous_embodiment
    )
    fetch_prompt.end(
        end_time=datetime.now(),
        input=values_to_json(
            technology=technology, 
            antigen=antigen, 
            disease=disease,
            innovation=innovation,
            previous_embodiment=previous_embodiment
        ),
        output=raw_prompt,
    )

    generation = trace.generation(
        name="embodiment",
        input=prompt,
        completion_start_time=datetime.now(),
        model=model,
    )

    response = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}], model=model
    )
    generation.end(
        output=response.choices[0].message.content,
        end_time=datetime.now(),
        usage=response.usage,
        metadata={"prompt_usage": response.usage},
        model=model,
    )

    trace.update(
        status_message="Generation completed",
        output=response.choices[0].message.content,
        metadata={"prompt_usage": response.usage},
    )

    return Embodiment(
        prediction=response.choices[0].message.content, trace_id=trace_id
    )


def generate_disease_overview(
    disease: str, model: str = "o1-preview"
) -> DiseaseOverview:
    client = OpenAI()
    if not disease:
        raise ValueError("Disease and antigen must be non-empty strings")

    trace_id = str(uuid.uuid4())
    trace = langfuse.trace(
        id=trace_id,
        name="generate_disease_overview",
        input=values_to_json(
            disease=disease
        ),
        tags=["evaluation"],
    )
    fetch_prompt = trace.span(name="fetch_prompt", start_time=datetime.now())
    raw_prompt = langfuse.get_prompt("generate_disease_overview")
    prompt = raw_prompt.compile(
        disease=disease
    )
    fetch_prompt.end(
        end_time=datetime.now(),
        input=values_to_json(
            disease=disease
        ),
        output=raw_prompt,
    )

    generation = trace.generation(
        name="disease_overview",
        input=prompt,
        completion_start_time=datetime.now(),
        model=model,
    )

    response = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}], model=model
    )
    generation.end(
        output=response.choices[0].message.content,
        end_time=datetime.now(),
        usage=response.usage,
        metadata={"prompt_usage": response.usage},
        model=model,
    )

    trace.update(
        status_message="Generation completed",
        output=response.choices[0].message.content,
        metadata={"prompt_usage": response.usage},
    )

    return DiseaseOverview(
        prediction=response.choices[0].message.content, trace_id=trace_id
    )

def generate_claims(
    innovation: str, 
    technology: str,
    approach: str, 
    antigen: str, 
    disease: str, 
    model: str = "o1-preview") -> Claims:
    client = OpenAI()
    if not antigen or not disease:
        raise ValueError("Disease and antigen must be non-empty strings")

    trace_id = str(uuid.uuid4())
    trace = langfuse.trace(
        id=trace_id,
        name="generate_claims",
        input=values_to_json(
            technology=technology, 
            antigen=antigen, 
            disease=disease,
            innovation=innovation,
            approach=approach),
        tags=["evaluation"],
    )
    fetch_prompt = trace.span(name="fetch_prompt", start_time=datetime.now())
    raw_prompt = langfuse.get_prompt("generate_claims")
    prompt = raw_prompt.compile(
        technology=technology, 
        antigen=antigen, 
        disease=disease,
        innovation=innovation,
        approach=approach
        )
    fetch_prompt.end(
        end_time=datetime.now(),
        input=values_to_json(
        technology=technology, 
        antigen=antigen, 
        disease=disease,
        innovation=innovation,
        approach=approach
    ),
        output=raw_prompt,
    )

    generation = trace.generation(
        name="claims",
        input=prompt,
        completion_start_time=datetime.now(),
        model=model,
    )

    response = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}], model=model
    )
    generation.end(
        output=response.choices[0].message.content,
        end_time=datetime.now(),
        usage=response.usage,
        metadata={"prompt_usage": response.usage},
        model=model,
    )

    trace.update(
        status_message="Generation completed",
        output=response.choices[0].message.content,
        metadata={"prompt_usage": response.usage},
    )

    return Claims(
        prediction=response.choices[0].message.content, trace_id=trace_id
    )


def generate_key_terms(
    innovation: str, 
    technology: str,
    approach: str, 
    antigen: str, 
    disease: str, 
    model: str = "o1-preview"
) -> KeyTerms:
    client = OpenAI()
    if not antigen or not disease:
        raise ValueError("Disease and antigen must be non-empty strings")

    trace_id = str(uuid.uuid4())
    trace = langfuse.trace(
        id=trace_id,
        name="generate_key_terms",
        input=values_to_json(
            technology=technology, 
            antigen=antigen, 
            disease=disease,
            innovation=innovation,
            approach=approach),
        tags=["evaluation"],
    )
    fetch_prompt = trace.span(name="fetch_prompt", start_time=datetime.now())
    raw_prompt = langfuse.get_prompt("generate_key_terms")
    prompt = raw_prompt.compile(
        technology=technology, 
        antigen=antigen, 
        disease=disease,
        innovation=innovation,
        approach=approach
        )
    fetch_prompt.end(
        end_time=datetime.now(),
        input=values_to_json(
        technology=technology, 
        antigen=antigen, 
        disease=disease,
        innovation=innovation,
        approach=approach,        ),
        output=raw_prompt,
    )

    generation = trace.generation(
        name="key_terms",
        input=prompt,
        completion_start_time=datetime.now(),
        model=model,
    )

    response = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}], model=model
    )
    generation.end(
        output=response.choices[0].message.content,
        end_time=datetime.now(),
        usage=response.usage,
        metadata={"prompt_usage": response.usage},
        model=model,
    )

    trace.update(
        status_message="Generation completed",
        output=response.choices[0].message.content,
        metadata={"prompt_usage": response.usage},
    )

    return KeyTerms(
        prediction=response.choices[0].message.content, trace_id=trace_id
    )

def generate_abstract(
    innovation: str, 
    technology: str,
    approach: str, 
    antigen: str, 
    disease: str, 
    model: str = "o1-preview"
) -> Abstract:
    client = OpenAI()
    if not antigen or not disease:
        raise ValueError("Disease and antigen must be non-empty strings")

    trace_id = str(uuid.uuid4())
    trace = langfuse.trace(
        id=trace_id,
        name="generate_abstract",
        input=values_to_json(
            technology=technology, 
            antigen=antigen, 
            disease=disease,
            innovation=innovation,
            approach=approach),
        tags=["evaluation"],
        )

    fetch_prompt = trace.span(name="fetch_prompt", start_time=datetime.now())
    raw_prompt = langfuse.get_prompt("generate_abstract")
    prompt = raw_prompt.compile(
            technology=technology, 
            antigen=antigen, 
            disease=disease,
            innovation=innovation,
            approach=approach    
    )

    fetch_prompt.end(
        end_time=datetime.now(),
        input=values_to_json(
        technology=technology, 
        antigen=antigen, 
        disease=disease,
        innovation=innovation,
        approach=approach
        ),
        output=raw_prompt,
    )

    generation = trace.generation(
        name="abstract",
        input=prompt,
        completion_start_time=datetime.now(),
        model=model,
    )

    response = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}], model=model
    )
    generation.end(
        output=response.choices[0].message.content,
        end_time=datetime.now(),
        usage=response.usage,
        metadata={"prompt_usage": response.usage},
        model=model,
    )

    trace.update(
        status_message="Generation completed",
        output=response.choices[0].message.content,
        metadata={"prompt_usage": response.usage},
    )

    return Abstract(
        prediction=response.choices[0].message.content, trace_id=trace_id
    )



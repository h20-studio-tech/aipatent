import uuid
import sys

from datetime import datetime

from langfuse import Langfuse
from openai import OpenAI
from app.models.llm import (
    PrimaryInvention,
    FieldOfInvention,
    BackgroundAndNeed,
    BriefSummary,
    TechnologyPlatform,
    DescriptionOfInvention,
    ProductOrProducts,
    Uses,
)

from app.utils.utils import values_to_json

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


def generate_primary_invention(
    antigen: str, disease: str, model: str = "o1-mini"
) -> PrimaryInvention:
    client = OpenAI()

    if not disease or not antigen:
        raise ValueError("Disease and antigen must be non-empty strings")

    trace_id = str(uuid.uuid4())
    trace = langfuse.trace(
        id=trace_id,
        name="generate_primary_invention",
        input=values_to_json(antigen=antigen, disease=disease),
        tags=["evaluation"],
    )
    fetch_prompt = trace.span(name="fetch_prompt", start_time=datetime.now())
    raw_prompt = langfuse.get_prompt("generate_primary_invention")
    prompt = raw_prompt.compile(antigen=antigen, disease=disease)

    fetch_prompt.end(
        end_time=datetime.now(),
        input=values_to_json(antigen=antigen, disease=disease),
        output=raw_prompt,
    )
    generation = trace.generation(
        name="primary_invention",
        input=prompt,
        completion_start_time=datetime.now(),
        model=model,
    )
    response = client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}], model=model
    )

    print("usage:  ", response.usage)
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
    return PrimaryInvention(
        prediction=response.choices[0].message.content, trace_id=trace_id
    )


def generate_field_of_invention(
    primary_invention: str, antigen: str, disease: str, model: str = "o1-mini"
) -> FieldOfInvention:
    client = OpenAI()

    if not antigen or not disease:
        raise ValueError("Disease and antigen must be non-empty strings")

    trace_id = str(uuid.uuid4())
    trace = langfuse.trace(
        id=trace_id,
        name="generate_field_of_invention",
        input=primary_invention,
        antigen=antigen,
        disease=disease,
        tags=["evaluation"],
    )
    fetch_prompt = trace.span(name="fetch_prompt", start_time=datetime.now())
    raw_prompt = langfuse.get_prompt("generate_field_of_invention")
    prompt = raw_prompt.compile(
        primary_invention=primary_invention, antigen=antigen, disease=disease
    )
    fetch_prompt.end(
        end_time=datetime.now(),
        input=primary_invention,
        antigen=antigen,
        disease=disease,
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


def generate_background_and_need(
    field_of_invention: str, antigen: str, disease: str, model: str = "o1-mini"
) -> BackgroundAndNeed:

    client = OpenAI()
    if not antigen or not disease:
        raise ValueError("Disease and antigen must be non-empty strings")

    trace_id = str(uuid.uuid4())
    trace = langfuse.trace(
        id=trace_id,
        name="generate_background_and_need",
        input=values_to_json(
            field_of_invention=field_of_invention, antigen=antigen, disease=disease
        ),
        tags=["evaluation"],
    )
    fetch_prompt = trace.span(name="fetch_prompt", start_time=datetime.now())
    raw_prompt = langfuse.get_prompt("generate_background")
    prompt = raw_prompt.compile(
        field_of_invention=field_of_invention, antigen=antigen, disease=disease
    )
    fetch_prompt.end(
        end_time=datetime.now(),
        input=values_to_json(
            field_of_invention=field_of_invention, antigen=antigen, disease=disease
        ),
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


def generate_brief_summary(
    background: str, antigen: str, disease: str, model: str = "o1-mini"
) -> BriefSummary:
    client = OpenAI()
    if not antigen or not disease:
        raise ValueError("Disease and antigen must be non-empty strings")

    trace_id = str(uuid.uuid4())
    trace = langfuse.trace(
        id=trace_id,
        name="generate_brief_summary",
        input=values_to_json(background=background, antigen=antigen, disease=disease),
        tags=["evaluation"],
    )
    fetch_prompt = trace.span(name="fetch_prompt", start_time=datetime.now())
    raw_prompt = langfuse.get_prompt("generate_brief_summary")
    prompt = raw_prompt.compile(background=background, antigen=antigen, disease=disease)
    fetch_prompt.end(
        end_time=datetime.now(),
        input=values_to_json(background=background, antigen=antigen, disease=disease),
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


def generate_technology_platform(
    summary: str, antigen: str, disease: str, model: str = "o1-mini"
) -> TechnologyPlatform:
    client = OpenAI()
    if not antigen or not disease:
        raise ValueError("Disease and antigen must be non-empty strings")

    trace_id = str(uuid.uuid4())
    trace = langfuse.trace(
        id=trace_id,
        name="generate_technology_platform",
        input=values_to_json(summary=summary, antigen=antigen, disease=disease),
        tags=["evaluation"],
    )
    fetch_prompt = trace.span(name="fetch_prompt", start_time=datetime.now())
    raw_prompt = langfuse.get_prompt("generate_technology_platform")
    prompt = raw_prompt.compile(summary=summary, antigen=antigen, disease=disease)
    fetch_prompt.end(
        end_time=datetime.now(),
        input=values_to_json(summary=summary, antigen=antigen, disease=disease),
        output=raw_prompt,
    )

    generation = trace.generation(
        name="technology_platform",
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

    return TechnologyPlatform(
        prediction=response.choices[0].message.content, trace_id=trace_id
    )


def generate_description_of_invention(
    technology_platform: str, antigen: str, disease: str, model: str = "o1-mini"
) -> DescriptionOfInvention:
    client = OpenAI()
    if not antigen or not disease:
        raise ValueError("Disease and antigen must be non-empty strings")

    trace_id = str(uuid.uuid4())
    trace = langfuse.trace(
        id=trace_id,
        name="generate_description_of_invention",
        input=values_to_json(
            technology_platform=technology_platform, antigen=antigen, disease=disease
        ),
        tags=["evaluation"],
    )
    fetch_prompt = trace.span(name="fetch_prompt", start_time=datetime.now())
    raw_prompt = langfuse.get_prompt("generate_description_of_invention")
    prompt = raw_prompt.compile(
        technology_platform=technology_platform, antigen=antigen, disease=disease
    )
    fetch_prompt.end(
        end_time=datetime.now(),
        input=values_to_json(
            technology_platform=technology_platform, antigen=antigen, disease=disease
        ),
        output=raw_prompt,
    )

    generation = trace.generation(
        name="description_of_invention",
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

    return DescriptionOfInvention(
        prediction=response.choices[0].message.content, trace_id=trace_id
    )


def generate_product_or_products(
    description_of_invention: str, antigen: str, disease: str, model: str = "o1-mini"
) -> ProductOrProducts:
    client = OpenAI()
    if not antigen or not disease:
        raise ValueError("Disease and antigen must be non-empty strings")

    trace_id = str(uuid.uuid4())
    trace = langfuse.trace(
        id=trace_id,
        name="generate_product_or_products",
        input=description_of_invention,
        antigen=antigen,
        disease=disease,
        tags=["evaluation"],
    )
    fetch_prompt = trace.span(name="fetch_prompt", start_time=datetime.now())
    raw_prompt = langfuse.get_prompt("generate_product_or_products")
    prompt = raw_prompt.compile(
        description_of_invention=description_of_invention,
        antigen=antigen,
        disease=disease,
    )

    fetch_prompt.end(
        end_time=datetime.now(),
        input=description_of_invention,
        antigen=antigen,
        disease=disease,
        output=raw_prompt,
    )

    generation = trace.generation(
        name="product_or_products",
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

    return ProductOrProducts(
        prediction=response.choices[0].message.content, trace_id=trace_id
    )


def generate_uses(
    product: str, antigen: str, disease: str, model: str = "o1-mini"
) -> Uses:
    client = OpenAI()
    if not antigen or not disease:
        raise ValueError("Disease and antigen must be non-empty strings")

    trace_id = str(uuid.uuid4())
    trace = langfuse.trace(
        id=trace_id,
        name="generate_uses",
        input=product,
        antigen=antigen,
        disease=disease,
        tags=["evaluation"],
    )

    fetch_prompt = trace.span(name="fetch_prompt", start_time=datetime.now())
    raw_prompt = langfuse.get_prompt("generate_uses")
    prompt = raw_prompt.compile(product=product, antigen=antigen, disease=disease)
    fetch_prompt.end(end_time=datetime.now(), input=product, output=raw_prompt)

    generation = trace.generation(
        name="uses", input=prompt, completion_start_time=datetime.now(), model=model
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

    return Uses(prediction=response.choices[0].message.content, trace_id=trace_id)

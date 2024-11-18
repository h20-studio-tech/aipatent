import os

from datetime import datetime
import pandas as pd
import instructor
from instructor.exceptions import InstructorRetryException
import asyncio
from langfuse import Langfuse
from openai import AsyncOpenAI
from dotenv import load_dotenv
from models.llm import PrimaryInvention
from utils.utils import values_to_json
import uuid
import sys

trace_id = str(uuid.uuid4())
client = instructor.from_openai(AsyncOpenAI())
langfuse = Langfuse()

class ProgressTracker:
    def __init__(self):
        self.counter = 0

    async def update(self, total_tasks):
        self.counter += 1
        progress = (self.counter / total_tasks) * 100
        sys.stdout.write(f"\rProgress: {self.counter}/{total_tasks} tasks completed ({progress:.2f}%)")
        sys.stdout.flush()

progress_tracker = ProgressTracker()

async def primary_invention(antigen: str, disease: str, model: str = "o1-mini") -> str:
    client = AsyncOpenAI()
    
    if not disease or not antigen:
        raise ValueError("Disease and antigen must be non-empty strings")

    trace = langfuse.trace(id=trace_id, name="generate_primary_invention", input=values_to_json(antigen=antigen, disease=disease), tags =["evaluation"])
    fetch_prompt = trace.span(name="fetch_prompt", start_time=datetime.now())
    raw_prompt = langfuse.get_prompt("generate_primary_invention")
    prompt = raw_prompt.compile(antigen=antigen, disease=disease)

    fetch_prompt.end(end_time=datetime.now(), input=values_to_json(antigen=antigen, disease=disease), output=raw_prompt)
    generation = trace.generation(name="primary_invention", input=prompt, completion_start_time=datetime.now(), model=model)
    response = await client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
        )
        
    generation.end(output=response.choices[0].message.content, end_time=datetime.now(), usage=response.usage, metadata={"prompt_caching": response.usage.prompt_tokens_details}, model=model)
    trace.update(status_message="Generation completed", output=response.choices[0].message.content, metadata={"prompt_caching": response.usage.prompt_tokens_details})
    return response.choices[0].message.content


sem = asyncio.Semaphore(5)

async def update_progress(total_tasks):
    await progress_tracker.update(total_tasks)

async def gather_primary_inventions(row, total_tasks):
    async with sem:
        disease = row["target_disease"]
        antigen = row["target_antigen"]
        
        responseo1mini = await primary_invention(antigen, disease, model="o1-mini")

        row["primary_invention_o1mini"] = responseo1mini

        # Update progress
        await update_progress(total_tasks)

        return row

sample = pd.read_csv("sample_patents.csv")
async def main():
    total_tasks = len(sample)
    # Convert DataFrame to list of dictionaries for async processing
    rows = sample.to_dict("records")
    
    # Process all rows concurrently
    tasks = [gather_primary_inventions(row, total_tasks) for row in rows]
    processed_rows = await asyncio.gather(*tasks)
    
    # Convert back to DataFrame and save
    result_df = pd.DataFrame(processed_rows)
    result_df.to_csv("synthetic_data/primary_invention.csv", index=False)
    print("\nAll tasks completed.")

if __name__ == "__main__":
    asyncio.run(main())

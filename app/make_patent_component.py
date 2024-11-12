import pandas as pd 
import instructor
import asyncio
from asyncio import Semaphore
from langfuse import Langfuse
from openai import AsyncOpenAI
from dotenv import load_dotenv
from models import PrimaryInvention

load_dotenv()

client = instructor.from_openai(AsyncOpenAI())
langfuse = Langfuse()

sample_filepath = "synthetic_data/technologies.csv"
sample = pd.read_csv(sample_filepath)

async def primary_invention(antigen:str, disease: str, model:str) -> PrimaryInvention:
    prompt = langfuse.get_prompt("generate_primary_invention")

    prompt = prompt.compile(antigen=antigen, disease=disease)
    
    response = await client.chat.completions.create(
        response_model=PrimaryInvention,
        model=model,
        messages=[{"role": "user", "content": prompt}],

    )

    return response


sem = asyncio.Semaphore(5)

async def gather_primary_inventions(row):
    async with sem:
        disease = row["disease"]
        antigen = row["target_antigen"]
        response = await primary_invention(antigen, disease, model = "gpt-4o")
        row["primary_invention_4o"] = response.text

        return row

async def main():
    # Convert DataFrame to list of dictionaries for async processing
    rows = sample.to_dict('records')
    
    # Process all rows concurrently
    processed_rows = await asyncio.gather(
        *[gather_primary_inventions(row) for row in rows]
    )
    
    # Convert back to DataFrame and save
    result_df = pd.DataFrame(processed_rows)
    result_df.to_csv('synthetic_data/primary_invention.csv', index=False)

if __name__ == "__main__":
    asyncio.run(main())




import os
import logging
import uuid
import instructor
import langfuse
import pandas as pd
from pydantic import BaseModel
from typing import List
from utils.lance import db
from utils.langfuse_client import get_langfuse_instance
from lancedb.pydantic import LanceModel, Vector
from lancedb.table import Table
from lancedb.embeddings import get_registry
from openai import OpenAI, AsyncOpenAI

langfuse = get_langfuse_instance()
openai = instructor.from_openai(OpenAI())
asyncopenai = instructor.from_openai(AsyncOpenAI())

func = get_registry().get("openai").create(name=os.getenv("EMBEDDING_MODEL_NAME"))    
class Schema(LanceModel):
    text: str = func.SourceField()
    vector: Vector(func.ndims()) = func.VectorField()  # type: ignore
    element_id: str
    page_number: int
    filename: str
    chunk_id: int    
    
class MultiQueryQuestions(BaseModel):
    questions: List[str]    

def format_chunks(chunks: List[LanceModel]) -> str:
    lines = []
    for i, chunk in enumerate(chunks, start=1):
        lines.append(f"===== Chunk {i} =====")
        lines.append(chunk.text.strip())
        lines.append(f"page number: {chunk.page_number}")
        lines.append(f"filename: {chunk.filename}")
        lines.append(f"chunk ID: {chunk.chunk_id}")
        lines.append("")  # blank line between docs
    logging.info("formatted chunks")
    return "\n".join(lines)

def add_df_to_table(df: pd.DataFrame, table: Table ):
    df = df[df["text"].str.strip() != ""]
    
    
    print(f"checking rows with missing text: {df['text'].isnull().sum()} ")
    print(f"add_df_to_table: {df.shape[0]}")

    if df.empty:
        print("Warning: The DataFrame is empty, no data will be added.")
        return
    
    table.add(df)

def create_table_from_file(table_name: str, data: pd.DataFrame, schema: Schema = Schema) -> None:
        
        logging.info(f"create_table_from_file: {table_name} of length: {data.shape[0]}")


        if data.empty:
            logging.info("Warning: The DataFrame is empty, no data will be added.")
            return

        if table_name in db.table_names():
            db.drop_table(table_name)
        
        table = db.create_table(table_name, schema=schema, exist_ok=True, data=data)
        
        table_rows = table.count_rows()
        logging.info(f"table {table_name} successfully created")
        logging.info(f"Entries added to the table: {table_rows}")

def search(query: str,  table_name: str, schema: Schema = Schema, k_results: int = 4) -> List[LanceModel]:
    try:
        table = db.open_table(table_name)
        chunks = table.search(query).limit(k_results).to_pydantic(schema)
        return chunks
    except Exception as e:
        logging.info(f"Error during search: {str(e)}")
        return []   

def multiquery_search(query:str, table_name:str, n_queries: str = 3) -> str:
                
        prompt = f"""
            You are a query understanding system for an AI Patent Generation application your task is to transform the user query and expand it into `{n_queries}` different queries
            in order to maximize retrieval efficiency
            
            
            Generate `{n_queries}` questions based on `{query}`. The questions should be focused on expanding the search of information from a microbiology paper:


            Stylistically the queries should be optimized for matching text chunks in a vectordb, doing so enhances the likelihood of effectively retrieving the relevant chunks
            that contain the answer to the original user query.
            """
        try:
            logging.info(f"Generating MultiQuery questions")
            multiquery = openai.chat.completions.create(
                model="gpt-4o-mini",
                response_model=MultiQueryQuestions,
                messages=[{"role": "user", "content": prompt}],
            )
            logging.info(f"MultiQuery questions: \n{chr(10).join(f'- {q}' for q in multiquery.questions)}\n")
            logging.info(f"Retrieving chunks from table: {table_name}")
            retrieved = [search(q, table_name=table_name) for q in multiquery.questions]
          
            chunks = [result for results in retrieved for result in results]
                
            logging.info(f"amount of retrieved chunks: {len(chunks)}")
            logging.info(f"retrieved chunk IDs:\n{[chunk.chunk_id for chunk in chunks]}\n")
            trace_id = str(uuid.uuid4())
            langfuse.trace(
                id=trace_id,
                name=f"multiquery questions",
                input=query,
                output=multiquery
            )
            formatted_chunks = format_chunks(chunks)
            return formatted_chunks
        except Exception as e:
            print(f"Error generating MultiQueryQuestions: {str(e)}")
            return []
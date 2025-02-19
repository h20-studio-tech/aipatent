import os
import pandas as pd
import unstructured_client
import lancedb
import json

from lancedb.table import Table
from unstructured_client.models import operations, shared
from lancedb.pydantic import LanceModel, Vector
from lancedb.embeddings import get_registry
from typing import List
import instructor
import asyncio
from openai import AsyncOpenAI
from pydantic import BaseModel

class Chunk(BaseModel):
    element_id: str
    text: str
    page_number: int
    filename: str
    chunk_id: int
    
class ChunkReview(BaseModel):
    relevant: bool
    
class ReviewedChunk(BaseModel):
    element_id: str
    text: str
    page_number: int
    filename: str
    chunk_id: int
    relevant: bool
    
class RagWorkflow:
    def __init__(self):
        self.client = unstructured_client.UnstructuredClient(
            api_key_auth=os.getenv("UNSTRUCTURED_API_KEY"),
            server_url=os.getenv("UNSTRUCTURED_API_URL"),
        )

        self.func = get_registry().get("openai").create(name="text-embedding-3-large")
        self.uri = "app/data/lancedb"
        self.db = lancedb.connect(self.uri)
        self.table_name = "document"
        self.openai = instructor.from_openai(AsyncOpenAI())
        self.semaphore = asyncio.Semaphore(20)

        class Schema(LanceModel):
            text: str = self.func.SourceField()
            vector: Vector(self.func.ndims()) = self.func.VectorField()  # type: ignore
            element_id: str
            page_number: int
            filename: str
            chunk_id: int

        self.schema = Schema
        
    async def limited_chunk_review(self, chunk):
        async with self.semaphore:
            return await self.chunk_review(chunk)
    
    async def process_all_chunks(self, chunks):
        tasks = [self.limited_chunk_review(chunk) for chunk in chunks]
        reviewed_chunks = await asyncio.gather(*tasks, return_exceptions=True)
        
        # Check if any task failed and log the error
        for i, result in enumerate(reviewed_chunks):
            if isinstance(result, Exception):
                print(f"Task {i} failed with exception: {result}")
            else:
                print(f"Task {i} completed successfully")
        
        
            # Filter out any exceptions (failed tasks) before proceeding
        successful_chunks = [rc for rc in reviewed_chunks if not isinstance(rc, Exception)]
    
        return successful_chunks    
        
    async def chunk_review(self, chunk: Chunk)-> ReviewedChunk:
            prompt  = f"""
                You are a data annotator, your task is to review a corpus of data consisting of chunks from a source document.
                Your perfomance is critical as it ensures that bad or irrelevant data doesn't flood the vector database where
                the chunks will be stored
                
                here's the chunk text: <Text>{chunk.text}</Text>
                
                <Guidelines>
                    What makes text irrelevant:
                    - the text is too short and doesn't develop any idea or argument
                    - contains only numbers
                    - text that appears to be a caption for an image
                    - text that appears to only contain people's names
                    - text that is out of context
                    - as a rule of thumb text smaller than 80 tokens is not relevant
                    
                    What makes text relevant: 
                    - it does present findings, ideas, arguments,
                    - it describes something and contains semantic meaning, valuable ideas about a topic can infered from it
                </Guidelines>
            """
            
            res = await self.openai.chat.completions.create(
                model="o3-mini",
                response_model=ChunkReview,
                messages=[
                    {"role": "assistant", "content": prompt}
                ]
            )
            print("API Response:", res)
            return ReviewedChunk(**chunk.model_dump(), relevant=res.relevant)    
        
    async def clean_df(self, df: pd.DataFrame) -> pd.DataFrame:
        df['chunk_id'] = range(1, len(df) + 1)
        chunks: List[BaseModel] = []
        for _,row in df.iterrows():
            chunk = Chunk(
                element_id=row["element_id"],
                text=row["text"],
                page_number=row["page_number"],
                filename=row["filename"],
                chunk_id=row["chunk_id"]    
            )
            
            chunks.append(chunk)
        reviewed_chunks = await self.process_all_chunks(chunks)
        reviewed_dicts = [rc.model_dump() for rc in reviewed_chunks]
        reviewed_df = pd.DataFrame(reviewed_dicts)
        clean_df = reviewed_df[reviewed_df["relevant"] != False]
        return clean_df
                
        
    async def process_file(self, file_path: str, filename: str) -> dict:
        self.table_name = filename.replace(".pdf", "")
        if not os.path.exists(file_path):
            print("The file does not exist")
            return
        print(f"Processing file: {file_path}")
        req = operations.PartitionRequest(
            partition_parameters=shared.PartitionParameters(
                files=shared.Files(
                    content=open(file_path, "rb"),
                    file_name=filename,
                ),
                combine_under_n_chars=80,
                chunking_strategy=shared.ChunkingStrategy.BY_SIMILARITY,
                strategy=shared.Strategy.HI_RES,
                languages=["eng"],
                split_pdf_page=True,
                split_pdf_allow_failed=True,
                split_pdf_concurrency_level=15,
            ),
        )

        try:
            data = []
            chunk_counter = 0
            res = self.client.general.partition(request=req)
            element_dicts = [element for element in res.elements]
            with open(file_path.replace(".pdf", ".json"), "w") as f:
                json.dump(element_dicts, f)

            for element_dict in element_dicts:
                chunk_counter += 1  # increment only when we add a row

                new_row = {
                    "element_id": element_dict["element_id"],
                    "text": element_dict["text"],
                    "page_number": element_dict["metadata"].get("page_number"),
                    "filename": element_dict["metadata"].get("filename"),
                    "chunk_id": chunk_counter,
                }
                data.append(new_row)

            df = pd.DataFrame(data=data)
            df = await self.clean_df(df)
            df.to_csv(file_path.replace(".pdf", ".csv"), index=False)
            return {"df": df, "filepath": file_path}

        except Exception as e:
            print(e)

    def create_table_from_file(self, file_path: str):

        if not os.path.exists(file_path):
            print("The file does not exist")
            return

        self.file_path = file_path
        df = pd.read_csv(file_path.replace(".pdf", ".csv"))
        
        df = df[df["text"].str.strip() != ""]
        print(f"checking rows with missing text: {df['text'].isnull().sum()} ")  # How many rows have missing text?
        print(f"create_table_from_file: {file_path} of length: {df.shape[0]}")


        if df.empty:
            print("Warning: The DataFrame is empty, no data will be added.")
            return

        if self.table_name in self.db.table_names():
            self.db.drop_table(self.table_name)
        
        self.table = self.db.create_table(self.table_name, schema=self.schema)
        self.add_df_to_table(df)
        
        table = self.table.count_rows()
        print(f"Entries added to the table: {table}")

    def add_df_to_table(self, df: pd.DataFrame):
        df = df[df["text"].str.strip() != ""]
        print(f"checking rows with missing text: {df['text'].isnull().sum()} ")
        print(f"add_df_to_table: {df.shape[0]}")

        if df.empty:
            print("Warning: The DataFrame is empty, no data will be added.")
            return
        
        self.table.add(df)

    def format_chunks(self, chunks: List[LanceModel]) -> str:
        lines = []
        for i, chunk in enumerate(chunks, start=1):
            lines.append(f"===== Chunk {i} =====")
            lines.append(chunk.text.strip())
            lines.append(f"page number: {chunk.page_number}")
            lines.append(f"filename: {chunk.filename}")
            lines.append("")  # blank line between docs
        return "\n".join(lines)

    def search(self, query: str, k_results: int = 4):
        table = self.db.open_table(self.table_name)
        chunks = table.search(query).limit(k_results).to_pydantic(self.schema)
        return chunks

    def formatted_search(self, query: str, k_results: int = 4) -> str:
        chunks = self.search(query, k_results)
        return self.format_chunks(chunks)

    def delete_file(self):
        if os.path.exists(self.file_path):
            os.remove(self.file_path)
        else:
            print("The file does not exist")

    def cleanup(self, delete_file: bool = True):
        self.db.drop_table(self.table_name)
        if delete_file:
            self.delete_file()

df = pd.read_csv("app/data/tmp/GvHD-paper.csv")

rag = RagWorkflow()

clean_df = asyncio.run(rag.clean_df(df))

clean_df.to_csv("app/data/tmp/clean GvHD-paper.csv")

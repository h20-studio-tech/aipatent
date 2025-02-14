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

        class Schema(LanceModel):
            text: str = self.func.SourceField()
            vector: Vector(self.func.ndims()) = self.func.VectorField()  # type: ignore
            element_id: str
            page_number: int
            filename: str
            chunk_id: int

        self.schema = Schema

    def process_file(self, file_path: str, filename: str) -> dict:
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
            df.to_csv(file_path.replace(".pdf", ".csv"), index=False)
            return {"df": df, "filepath": file_path}

        except Exception as e:
            print(e)

    def create_table_from_file(self, file_path: str):

        if not os.path.exists(file_path):
            print("The file does not exist")
            return

        self.file_path = file_path
        # document = self.process_file(file_path)
        # df = document["df"]
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

# rag.process_file(r"C:\Users\vtorr\Work\Projects\aipatent\app\data\tmp\GvHD-paper.pdf")

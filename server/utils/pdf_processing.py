import io
import os
import logging
from unstructured_client.models import shared
from unstructured_client.models.operations import PartitionRequest
from supabase import create_client

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

supabase = create_client(
    supabase_url=os.getenv("SUPABASE_URL"),
    supabase_key=os.getenv("SUPABASE_SECRET_KEY"),
)


async def partition_request(filename: str, content: bytes) -> PartitionRequest:
    file_stream = io.BytesIO(content)

    return PartitionRequest(
        partition_parameters=shared.PartitionParameters(
            files=shared.Files(
                content=file_stream,
                file_name=filename,
            ),
            combine_under_n_chars=120,
            chunking_strategy=shared.ChunkingStrategy.BY_PAGE,
            strategy=shared.Strategy.FAST,
            languages=["eng"],
            split_pdf_page=True,
            split_pdf_allow_failed=True,
            split_pdf_concurrency_level=15,
            max_characters=1000,
            overlap=500,
        ),
    )


def supabase_upload(file: bytes, filename: str, partition: bool):
    bucket_name = os.getenv("SUPABASE_BUCKET_NAME")
    
    
    files = supabase.storage.from_(bucket_name).list("files")
    
    if filename in [file.name for file in files]:
        logging.info(f"file {filename} already exists in storage")
    
    
    folder = "partitions" if partition else "files"
    
    try:
        res = supabase.storage.from_(bucket_name).upload(
            file=file,
            path=f"{folder}/{filename}",
            file_options={"cache-control": "3600", "upsert": "false"},
        )
        logging.info(f"uploaded file to path {res.path}")
    except Exception as e:
        logging.error(f"Error during processing: {e}")


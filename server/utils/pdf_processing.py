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


def supabase_upload(file: bytes, filename: str):
    bucket_name = os.getenv("SUPABASE_BUCKET_NAME")

    try:
        res = supabase.storage.from_(bucket_name).upload(
            file=file,
            path=f"public/{filename}",
            file_options={"cache-control": "3600", "upsert": "false"},
        )
        logging.info(f"uploaded file to path {res.path}")
    except Exception as e:
        logging.error(f"Error during processing: {e}")


def main():
    with open("server/experiments/docs/ald_paper.pdf", "rb") as f:
        file_content = f.read()
    supabase_upload(file_content, "ald_paper.pdf")


if __name__ == "__main__":
    main()

import os
import json
import logging
import unstructured_client
from unstructured_client.models import operations, shared


logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

file_path = rf"C:\Users\vtorr\Work\Projects\aipatent\experiments\unstructured\docs\GvHD patent background disease-target paper.pdf"
filename = "gvhd-paper.pdf"

req = operations.PartitionRequest(
            partition_parameters=shared.PartitionParameters(
                files=shared.Files(
                    content=open(file_path, "rb"),
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
                overlap=500
            ),
        )

client = unstructured_client.UnstructuredClient(
            api_key_auth=os.getenv("UNSTRUCTURED_API_KEY"),
            server_url=os.getenv("UNSTRUCTURED_API_URL"),
        )
logging.info("start")
res = client.general.partition(request=req)
element_dicts = [element for element in res.elements]
with open(file_path.replace(".pdf", ".json"), "w") as f:
    json.dump(element_dicts, f)
logging.info("finish")
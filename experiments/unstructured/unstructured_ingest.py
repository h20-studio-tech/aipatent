import os

from pydantic import SecretStr

from unstructured_ingest.v2.pipeline.pipeline import Pipeline
from unstructured_ingest.v2.interfaces import ProcessorConfig

from unstructured_ingest.v2.processes.connectors.local import (
    LocalIndexerConfig,
    LocalDownloaderConfig,
    LocalConnectionConfig,
)
from unstructured_ingest.v2.processes.connectors.lancedb.lancedb import (
    LanceDBConnectionConfig,
    LanceDBUploader,
    LanceDBUploaderConfig,
    LanceDBUploadStager,
    LanceDBUploadStagerConfig,
)
from unstructured_ingest.v2.processes.partitioner import PartitionerConfig
from unstructured_ingest.v2.processes.chunker import ChunkerConfig
from unstructured_ingest.v2.processes.embedder import EmbedderConfig

# For LanceDB OSS with local data storage:
# from unstructured_ingest.v2.processes.connectors.lancedb.local import (
#     LanceDBLocalConnectionConfig,
#     LanceDBLocalAccessConfig,
#     LanceDBUploadStagerConfig,
#     LanceDBUploaderConfig
# )

# For LanceDB OSS with data storage in an Amazon S3 bucket:
from unstructured_ingest.v2.processes.connectors.lancedb.aws import (
    LanceDBS3ConnectionConfig,
    LanceDBS3AccessConfig,
    LanceDBUploadStagerConfig,
    LanceDBUploaderConfig
)

# For LanceDB OSS with data storage in an Azure Blob Storage account:
# from unstructured_ingest.v2.processes.connectors.lancedb.azure import (
#     LanceDBAzureConnectionConfig,
#     LanceDBAzureAccessConfig,
#     LanceDBUploadStagerConfig,
#     LanceDBUploaderConfig
# )

# For LanceDB OSS with data storage in a Google Cloud Storage bucket:
# from unstructured_ingest.v2.processes.connectors.lancedb.gcp import (
#     LanceDBGCSConnectionConfig,
#     LanceDBGCSAccessConfig,
#     LanceDBUploadStagerConfig,
#     LanceDBUploaderConfig
# )

# Chunking and embedding are optional.

if __name__ == "__main__":
    Pipeline.from_configs(
        context=ProcessorConfig(),
        indexer_config=LocalIndexerConfig(input_path=SecretStr(os.getenv("LOCAL_FILE_INPUT_DIR"))),
        downloader_config=LocalDownloaderConfig(),
        source_connection_config=LocalConnectionConfig(),
        partitioner_config=PartitionerConfig(
            partition_by_api=True,
            api_key=SecretStr(os.getenv("UNSTRUCTURED_API_KEY")),
            partition_endpoint=SecretStr(os.getenv("UNSTRUCTURED_API_URL")),
            additional_partition_args={
                "split_pdf_page": True,
                "split_pdf_allow_failed": True,
                "split_pdf_concurrency_level": 15,
            }
        ),
        chunker_config=ChunkerConfig(chunking_strategy="by_title"),
        embedder_config=EmbedderConfig(embedding_provider="openai", embedding_model_name="text-embedding-3-large", embedding_api_key=SecretStr(os.getenv("OPENAI_API_KEY"))),

        # For LanceDB OSS with local data storage:
        destination_connection_config=LanceDBConnectionConfig(
            uri=SecretStr(os.getenv("LANCEDB_URI"))
        ),
        stager_config=LanceDBUploadStagerConfig(),
        uploader_config=LanceDBUploaderConfig(table_name=SecretStr(os.getenv("LANCEDB_TABLE")))
    ).run()
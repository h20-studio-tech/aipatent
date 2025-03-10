import os
import base64
import logging
from typing import List
from fastapi import FastAPI, UploadFile
from utils.pdf_processing import partition_request, supabase_upload
import unstructured_client

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

unstructured = unstructured_client.UnstructuredClient(
    api_key_auth=os.getenv("UNSTRUCTURED_API_KEY")
)

app = FastAPI(title="aipatent", version="0.1.0")

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.post("/api/v1/documents/")
async def upload_file(file: UploadFile):
    content = await file.read()
    filename = file.filename
    
    supabase_upload(content, filename, partition = False)
    
    unstructured_request = await partition_request(content, filename)
    
    # response = unstructured.general.partition(request=unstructured_request)
    
    
    return {"filename": file.filename}
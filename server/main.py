import os
import base64
import logging
from typing import List
from fastapi import FastAPI, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from models.workflow import FileProcessedError
from rag import multiquery_search, create_table_from_file
from utils.pdf_processing import partition_request, supabase_upload, process_file, supabase_files

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)


app = FastAPI(title="aipatent", version="0.1.0")
    
CORSMiddleware(
    app,
    allow_origins='*',
    allow_credentials=True,
    allow_methods=("*"),
    allow_headers=("*"),
    allow_origin_regex=None,
    expose_headers=None,
    max_age=600,
)

@app.get("/")
async def root():
    return {"message": "Hello World"}

@app.post("/api/v1/documents/")
async def upload_file(file: UploadFile):
    content = await file.read()
    filename = file.filename
    
    try:
        supabase_upload(content, filename, partition = False)
    
        res = await process_file(content, filename)

        if isinstance(res, FileProcessedError):
            return {"filename": filename, "message": "file exists in vectorstore, request a search instead"}
        
        create_table_from_file(res["filename"].replace(".pdf", ""), res["data"])
        
        
        return {"response":{"filename": filename, "message": "File uploaded successfully"}, "status":200} 
    except Exception as e:  
        logging.info(f"upload_file error during processing {e}")
        return {"message": "error during processing"}
    
@app.get("/api/v1/documents/")
async def get_files():
    files = supabase_files()
    return {"response": files}

@app.post("/api/v1/rag/multiquery-search/")
async def query_search(query: str, target_file: str):
    table_name = target_file.replace(".pdf", "")
    try:
        res = multiquery_search(query, table_name = table_name)
        return {"response": res}
    except Exception as e:
        logging.info(f"Error during processing {e}")
        return {"message": "Error during processing"}

    
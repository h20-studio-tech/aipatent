from typing import List
from pydantic import BaseModel
import uuid
from openai import OpenAI
import instructor
from langfuse import Langfuse


langfuse = Langfuse()
openai =  instructor.from_openai(OpenAI())

class MultiQueryQuestions(BaseModel):
    questions: List[str]


def multiquery_search(query:str, n_queries: str = 3) -> str:
                
        prompt = f"""
            You are a query understanding system for an AI Patent Generation application your task is to transform the user query and expand it into `{n_queries}` different queries
            in order to maximize retrieval efficiency of biological research papers
            
            
            Generate `{n_queries}` questions based on `{query}`. The questions should be focused on expanding the search of information from a microbiology paper:


            Semantically, the queries must be optimized for directly matching text chunks in a vectordb, doing so enhances the likelihood of effectively retrieving the relevant chunks
            that contain the answer to the original user query.
            
            phrase the queries as potential literal matches rather than questions
            """
        try:
            multiquery = openai.chat.completions.create(
                model="gpt-4o",
                response_model=MultiQueryQuestions,
                temperature=0.5,
                messages=[{"role": "user", "content": prompt}],
            )
            print(f"MultiQuery questions: {chr(10).join(f'- {q}' for q in multiquery.questions)}")

            return multiquery
        except Exception as e:
            print(f"Error generating MultiQueryQuestions: {str(e)}")
            return []
        
res = multiquery_search("where was the posttransplant expansion found?")

res
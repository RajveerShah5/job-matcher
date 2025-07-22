import os
from dotenv import load_dotenv
from fastapi import FastAPI, Query
from pydantic import BaseModel
from typing import List
from pinecone import Pinecone
from openai import OpenAI

# Load env vars
load_dotenv()

# Setup OpenAI & Pinecone
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index(os.getenv("PINECONE_INDEX_NAME"))

# FastAPI app
app = FastAPI()

# Request schema
class MatchRequest(BaseModel):
    query: str
    top_k: int = 5
    filter: dict = {}

# Response schema
class MatchResult(BaseModel):
    id: str
    score: float
    title: str
    location: str
    salary: int

@app.post("/match", response_model=List[MatchResult])
def match_jobs(req: MatchRequest):
    # Embed the query (e.g., resume text)
    response = openai_client.embeddings.create(
        input=req.query,
        model="text-embedding-3-small"
    )
    query_vector = response.data[0].embedding

    # Query Pinecone index
    search_result = index.query(
        vector=query_vector,
        top_k=req.top_k,
        include_metadata=True,
        filter=req.filter if req.filter else None
    )

    results = []
    for match in search_result.matches:
        metadata = match.metadata
        results.append(MatchResult(
            id=match.id,
            score=match.score,
            title=metadata.get("title", ""),
            location=metadata.get("location", ""),
            salary=metadata.get("salary", 0)
        ))

    return results

import os
import io
import pdfplumber
import docx
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from pinecone import Pinecone
from openai import OpenAI

# Load environment variables
load_dotenv()

# Initialize OpenAI & Pinecone
openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index(os.getenv("PINECONE_INDEX_NAME"))

# Initialize FastAPI app
app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for JSON API
class MatchRequest(BaseModel):
    query: str
    top_k: int = 5
    filter: dict = {}

class MatchResult(BaseModel):
    id: str
    score: float
    title: str
    location: str
    salary: int

# Helpers to extract text from files
def extract_text_from_pdf(file_bytes: bytes) -> str:
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        return "\n".join([page.extract_text() or "" for page in pdf.pages])

def extract_text_from_docx(file_bytes: bytes) -> str:
    doc = docx.Document(io.BytesIO(file_bytes))
    return "\n".join([para.text for para in doc.paragraphs])

# Endpoint 1: Original JSON API
@app.post("/match", response_model=List[MatchResult])
def match_jobs(req: MatchRequest):
    response = openai_client.embeddings.create(
        input=req.query,
        model="text-embedding-3-small"
    )
    query_vector = response.data[0].embedding

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

# Endpoint 2: File upload support with advanced filtering
@app.post("/upload-match", response_model=List[MatchResult])
async def match_jobs_with_file(
    resume: Optional[UploadFile] = File(None),
    query: Optional[str] = Form(""),
    location: str = Form(...),
    salary: int = Form(...),
    location_type: Optional[str] = Form(None),
    employment_type: Optional[str] = Form(None),
    sector: Optional[str] = Form(None)
):
    # Extract query text
    if resume:
        file_bytes = await resume.read()
        if resume.filename.lower().endswith(".pdf"):
            query_text = extract_text_from_pdf(file_bytes)
        elif resume.filename.lower().endswith(".docx"):
            query_text = extract_text_from_docx(file_bytes)
        else:
            return {"error": "Unsupported file type"}
    else:
        query_text = query

    if not query_text.strip():
        return {"error": "Empty resume or query text."}

    # Embed query
    response = openai_client.embeddings.create(
        input=query_text,
        model="text-embedding-3-small"
    )
    query_vector = response.data[0].embedding

    # Build filter
    filter_ = {
        "location": location,
        "salary": {"$gte": salary}
    }

    if location_type:
        filter_["location_type"] = location_type
    if employment_type:
        filter_["employment_type"] = employment_type
    if sector:
        filter_["sector"] = sector

    # Query Pinecone
    search_result = index.query(
        vector=query_vector,
        top_k=50,
        include_metadata=True,
        filter=filter_
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

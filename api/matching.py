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

openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index(os.getenv("PINECONE_INDEX_NAME"))

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    us_state: Optional[str] = ""
    location_type: Optional[str] = ""

def extract_text_from_pdf(file_bytes: bytes) -> str:
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        return "\n".join([page.extract_text() or "" for page in pdf.pages])

def extract_text_from_docx(file_bytes: bytes) -> str:
    doc = docx.Document(io.BytesIO(file_bytes))
    return "\n".join([para.text for para in doc.paragraphs])

def normalize_filter(f):
    fixed = {}
    for k, v in f.items():
        fixed[k] = v if isinstance(v, dict) else {"$eq": v}
    return fixed

def detect_resume_seniority(text: str) -> str:
    lowered = text.lower()
    if any(term in lowered for term in ["student", "intern", "undergrad", "bachelor", "sophomore", "junior"]):
        return "junior"
    return "senior"

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
        filter=normalize_filter(req.filter) if req.filter else None
    )

    return [
        MatchResult(
            id=match.id,
            score=match.score,
            title=match.metadata.get("title", ""),
            location=match.metadata.get("location", ""),
            salary=match.metadata.get("salary", 0),
            us_state=match.metadata.get("us_state", ""),
            location_type=match.metadata.get("location_type", "")
        )
        for match in search_result.matches
    ]

@app.post("/upload-match", response_model=List[MatchResult])
async def match_jobs_with_file(
    resume: Optional[UploadFile] = File(None),
    query: Optional[str] = Form(""),
    location: str = Form(...),
    salary: int = Form(...),
    location_type: Optional[str] = Form(None),
    employment_type: Optional[str] = Form(None),
    sector: Optional[str] = Form(None),
    us_state: Optional[str] = Form(None)
):
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

    resume_seniority = detect_resume_seniority(query_text)

    enrichment = openai_client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "Given a resume or job description, extract important keywords and rewrite it to highlight relevant skills, job titles, and tools for semantic search."},
            {"role": "user", "content": query_text}
        ]
    )
    enriched_text = enrichment.choices[0].message.content

    response = openai_client.embeddings.create(
        input=enriched_text,
        model="text-embedding-3-small"
    )
    query_vector = response.data[0].embedding

    filter_ = {
    "salary": {"$gte": salary}
}

    if location and location.strip():
        filter_["location"] = {"$eq": location.title()}
    if location_type and location_type.strip():
        filter_["location_type"] = {"$eq": location_type}
    if employment_type and employment_type.strip():
        filter_["employment_type"] = {"$eq": employment_type}
    if sector and sector.strip():
        filter_["sector"] = {"$eq": sector}
    if us_state and us_state.strip():
        filter_["us_state"] = {"$eq": us_state.title()}


    search_result = index.query(
        vector=query_vector,
        top_k=100,
        include_metadata=True,
        filter=filter_
    )

    if not search_result.matches:
        return []

    senior_keywords = ["senior", "lead", "principal", "director", "vp", "head"]
    junior_keywords = ["intern", "junior", "entry", "trainee", "graduate"]

    results = []
    for match in search_result.matches:
        metadata = match.metadata
        title = metadata.get("title", "").lower()

        if resume_seniority == "junior" and any(k in title for k in senior_keywords):
            adjusted_score = match.score - 0.2
        elif resume_seniority == "junior" and any(k in title for k in junior_keywords):
            adjusted_score = match.score + 0.1
        else:
            adjusted_score = match.score

        results.append((adjusted_score, MatchResult(
            id=match.id,
            score=adjusted_score,
            title=metadata.get("title", ""),
            location=metadata.get("location", ""),
            salary=metadata.get("salary", 0),
            us_state=metadata.get("us_state", ""),
            location_type=metadata.get("location_type", "")
        )))

    results.sort(key=lambda x: x[0], reverse=True)
    return [r for _, r in results[:100]]
